package com.bonda.replay;

import com.bonda.ai.application.AnalysisRunLifecycle;
import com.bonda.ai.application.CandidateValidationService;
import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.alert.infrastructure.AlertRepository;
import com.bonda.disclosure.application.DartClient;
import com.bonda.disclosure.application.DisclosureIngestionService;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import com.bonda.replay.application.HistoricalReplayService;
import com.bonda.risk.application.FinancialSnapshotService;
import com.bonda.risk.infrastructure.IssuerRiskSnapshotRepository;
import com.bonda.risk.infrastructure.RiskChangeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties =
    "spring.datasource.url=jdbc:h2:mem:replay;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH"
)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class HistoricalReplayIntegrationTest {

    @Autowired private DisclosureIngestionService ingestionService;
    @Autowired private DisclosureVersionRepository versionRepository;
    @Autowired private AnalysisRunLifecycle analysisLifecycle;
    @Autowired private CandidateValidationService validationService;
    @Autowired private FinancialSnapshotService financialService;
    @Autowired private HistoricalReplayService replayService;
    @Autowired private IssuerRiskSnapshotRepository currentSnapshotRepository;
    @Autowired private RiskChangeRepository currentChangeRepository;
    @Autowired private AlertRepository alertRepository;
    @Autowired private MockMvc mockMvc;

    @Test
    void replaysOnlyInformationAvailableAtTheCutoffWithoutMutatingCurrentState() throws Exception {
        Long disclosureId = correctionHistory();
        List<DisclosureVersion> versions = versionRepository
            .findAllByDisclosureIdOrderByVersionNumberAsc(disclosureId);
        createCanonicalEvent(
            versions.get(0), RiskEventType.LIQUIDITY_WARNING, LocalDate.of(2026, 1, 10),
            "2026년 1월 10일 유동성 부족으로 상환에 어려움이 예상됩니다."
        );
        createCanonicalEvent(
            versions.get(1), RiskEventType.CREDIT_RATING_CHANGE, LocalDate.of(2026, 2, 3),
            "2026년 2월 3일 회사채 신용등급이 A에서 BBB로 하향되었습니다."
        );
        DisclosureVersion lateVersion = futureDisclosure();
        createCanonicalEvent(
            lateVersion, RiskEventType.DEBT_INCREASE, LocalDate.of(2025, 12, 1),
            "2025년 12월 1일 단기차입금이 800억원 증가했습니다."
        );
        financialService.save(1L, new FinancialSnapshotService.SaveCommand(
            "2025-Q4", LocalDate.of(2025, 12, 31), money("100"), money("100"), money("100"),
            money("100"), money("100"), money("1000"), money("500"), LocalDate.of(2026, 1, 15)
        ));
        financialService.save(1L, new FinancialSnapshotService.SaveCommand(
            "2026-M1", LocalDate.of(2026, 1, 31), money("60"), money("160"), money("100"),
            money("40"), money("50"), money("1000"), money("600"), LocalDate.of(2026, 4, 30)
        ));
        long snapshotsBefore = currentSnapshotRepository.count();
        long changesBefore = currentChangeRepository.count();
        long alertsBefore = alertRepository.count();

        HistoricalReplayService.ReplayResult january = replayService.replay(
            1L, LocalDate.of(2026, 1, 20)
        );
        HistoricalReplayService.ReplayResult januaryAgain = replayService.replay(
            1L, LocalDate.of(2026, 1, 20)
        );

        assertThat(january.disclosuresUsed()).singleElement()
            .satisfies(disclosure -> assertThat(disclosure.versionNumber()).isEqualTo(1));
        assertThat(january.riskEvents()).singleElement()
            .satisfies(event -> assertThat(event.eventType()).isEqualTo("LIQUIDITY_WARNING"));
        assertThat(january.financialSnapshot().period()).isEqualTo("2025-Q4");
        assertThat(january.riskSnapshot().liquidity().name()).isEqualTo("CAUTION");
        assertThat(january.riskSnapshot().credit().name()).isEqualTo("NORMAL");
        assertThat(januaryAgain.metadata().inputFingerprint()).isEqualTo(january.metadata().inputFingerprint());
        assertThat(januaryAgain.riskSnapshot()).isEqualTo(january.riskSnapshot());
        assertThat(januaryAgain.timeline()).isEqualTo(january.timeline());
        assertThat(january.timeline()).extracting(HistoricalReplayService.TimelineItem::date).isSorted();
        assertThat(january.timeline().stream().filter(item -> item.date().equals(LocalDate.of(2026, 1, 10)))
            .map(HistoricalReplayService.TimelineItem::type))
            .containsExactly("DISCLOSURE", "RISK_EVENT", "RISK_CHANGE");
        assertThat(january.metadata().executionTimeMs()).isNotNegative();

        HistoricalReplayService.ReplayResult february = replayService.replay(
            1L, LocalDate.of(2026, 2, 10)
        );
        assertThat(february.disclosuresUsed()).singleElement()
            .satisfies(disclosure -> assertThat(disclosure.versionNumber()).isEqualTo(2));
        assertThat(february.riskEvents()).singleElement()
            .satisfies(event -> assertThat(event.eventType()).isEqualTo("CREDIT_RATING_CHANGE"));
        assertThat(february.riskSnapshot().liquidity().name()).isEqualTo("NORMAL");
        assertThat(february.riskSnapshot().credit().name()).isEqualTo("CAUTION");

        assertThat(currentSnapshotRepository.count()).isEqualTo(snapshotsBefore);
        assertThat(currentChangeRepository.count()).isEqualTo(changesBefore);
        assertThat(alertRepository.count()).isEqualTo(alertsBefore);

        mockMvc.perform(post("/api/admin/replay")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"issuerId":1,"cutoffDate":"2026-01-20"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.cutoffDate").value("2026-01-20"))
            .andExpect(jsonPath("$.disclosuresUsed[0].versionNumber").value(1))
            .andExpect(jsonPath("$.riskEvents[0].eventType").value("LIQUIDITY_WARNING"))
            .andExpect(jsonPath("$.financialSnapshot.period").value("2025-Q4"))
            .andExpect(jsonPath("$.riskSnapshot.liquidity").value("CAUTION"))
            .andExpect(jsonPath("$.metadata.riskRuleVersion").value("RISK_POLICY_V1"));
    }

    private Long correctionHistory() {
        String originalReceipt = "20260110009001";
        var original = ingestionService.ingest(
            1L,
            disclosure(originalReceipt, "유동성 위험 발생", "2026-01-10T00:00:00Z"),
            document(originalReceipt, "2026년 1월 10일 유동성 부족으로 상환에 어려움이 예상됩니다.")
        );
        String correctionReceipt = "20260203009001";
        ingestionService.ingest(
            1L,
            disclosure(correctionReceipt, "[기재정정] 유동성 위험 발생", "2026-02-03T00:00:00Z"),
            document(correctionReceipt, "2026년 2월 3일 회사채 신용등급이 A에서 BBB로 하향되었습니다.")
        );
        return original.disclosureId();
    }

    private DisclosureVersion futureDisclosure() {
        String receipt = "20260301009002";
        var ingestion = ingestionService.ingest(
            1L,
            disclosure(receipt, "단기차입금 증가결정", "2026-03-01T00:00:00Z"),
            document(receipt, "2025년 12월 1일 단기차입금이 800억원 증가했습니다.")
        );
        return versionRepository.findAllByDisclosureIdOrderByVersionNumberAsc(ingestion.disclosureId()).getFirst();
    }

    private void createCanonicalEvent(
        DisclosureVersion version,
        RiskEventType type,
        LocalDate eventDate,
        String evidence
    ) {
        Long runId = analysisLifecycle.start(
            version.getId(), version.getDocumentHash(), "replay-fixture-" + version.getId(), "RISK_EXTRACTION_V1"
        );
        var completion = analysisLifecycle.completeSuccess(
            runId,
            1L,
            version.getId(),
            new RiskEventExtractor.ExtractionResult(
                List.of(new RiskEventExtractor.ExtractedEvent(
                    type, eventDate, null, null, null, evidence, "replay fixture"
                )),
                20,
                10,
                1
            ),
            5
        );
        var validation = validationService.validate(completion.candidates().getFirst().getId());
        assertThat(validation.status()).isEqualTo("VERIFIED");
    }

    private DartClient.DartDisclosure disclosure(String receipt, String title, String publishedAt) {
        return new DartClient.DartDisclosure(receipt, title, Instant.parse(publishedAt), "", null);
    }

    private DartClient.DartDocument document(String receipt, String content) {
        return new DartClient.DartDocument(
            receipt,
            "<DOCUMENT><TITLE>" + content + "</TITLE><P>" + content + "</P></DOCUMENT>"
        );
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}
