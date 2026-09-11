package com.bonda.ai;

import com.bonda.ai.application.AnalysisRunLifecycle;
import com.bonda.ai.application.CandidateValidationService;
import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.domain.CandidateRiskEvent;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.ai.infrastructure.CandidateRiskEventRepository;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.disclosure.application.DartClient;
import com.bonda.disclosure.application.DisclosureIngestionService;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CandidateValidationIntegrationTest {

    @Autowired private DisclosureIngestionService ingestionService;
    @Autowired private DisclosureVersionRepository versionRepository;
    @Autowired private AnalysisRunLifecycle lifecycle;
    @Autowired private CandidateValidationService validationService;
    @Autowired private CandidateRiskEventRepository candidateRepository;
    @Autowired private RiskEventRepository riskEventRepository;
    @Autowired private RiskEventEvidenceRepository evidenceRepository;
    @Autowired private MockMvc mockMvc;

    @Test
    void validationTriggerPromotesCandidateWithEvidenceAndIsIdempotent() throws Exception {
        DisclosureVersion version = ingest(
            "20260912004001",
            "단기차입금 증가 결정",
            """
                <DOCUMENT><TITLE>차입금 변동</TITLE>
                <P>2026년 9월 12일 단기차입금이 300억원에서 800억원으로 증가했습니다.</P>
                </DOCUMENT>
                """
        );
        CandidateRiskEvent candidate = completeAnalysis(
            version,
            "validation-success-model",
            event(
                RiskEventType.DEBT_INCREASE,
                LocalDate.of(2026, 9, 12),
                new BigDecimal("80000000000"),
                "KRW",
                "2026년 9월 12일 단기차입금이 300억원에서 800억원으로 증가했습니다."
            )
        ).getFirst();

        mockMvc.perform(post("/api/admin/candidates/{candidateId}/validate", candidate.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("VERIFIED"))
            .andExpect(jsonPath("$.ruleVersion").value("RISK_VALIDATION_V1"))
            .andExpect(jsonPath("$.reasons[0]").value("VALIDATED"))
            .andExpect(jsonPath("$.duplicate").value(false))
            .andExpect(jsonPath("$.canonicalRiskEventId").isNumber());

        CandidateRiskEvent verified = candidateRepository.findById(candidate.getId()).orElseThrow();
        Long canonicalId = verified.getCanonicalRiskEventId();
        assertThat(verified.getStatus()).isEqualTo(CandidateRiskEvent.Status.VERIFIED);
        assertThat(riskEventRepository.findAllByDisclosureVersionIdOrderByIdAsc(version.getId()))
            .singleElement()
            .satisfies(event -> {
                assertThat(event.getId()).isEqualTo(canonicalId);
                assertThat(event.getCandidateRiskEventId()).isEqualTo(candidate.getId());
                assertThat(event.getAmount()).isEqualByComparingTo("80000000000");
            });
        assertThat(evidenceRepository.findAllByRiskEventIdOrderByIdAsc(canonicalId))
            .singleElement()
            .satisfies(evidence -> {
                assertThat(evidence.getSection()).isEqualTo("차입금 변동");
                assertThat(evidence.getEvidenceText()).contains("800억원");
            });

        CandidateValidationService.ValidationResponse repeated = validationService.validate(candidate.getId());
        assertThat(repeated.canonicalRiskEventId()).isEqualTo(canonicalId);
        assertThat(riskEventRepository.findAllByDisclosureVersionIdOrderByIdAsc(version.getId())).hasSize(1);
        assertThat(evidenceRepository.findAllByRiskEventIdOrderByIdAsc(canonicalId)).hasSize(1);
    }

    @Test
    void fabricatedEvidenceRejectsCandidateWithoutCanonicalEvent() {
        DisclosureVersion version = ingest(
            "20260912004002",
            "유동성 현황",
            "<DOCUMENT><TITLE>유동성 현황</TITLE><P>보유 자금을 공시합니다.</P></DOCUMENT>"
        );
        CandidateRiskEvent candidate = completeAnalysis(
            version,
            "validation-rejection-model",
            event(RiskEventType.LIQUIDITY_WARNING, null, null, null, "유동성 위기가 임박했습니다.")
        ).getFirst();

        CandidateValidationService.ValidationResponse response = validationService.validate(candidate.getId());

        assertThat(response.status()).isEqualTo("REJECTED");
        assertThat(response.reasons()).contains("EVIDENCE_NOT_FOUND_IN_SOURCE");
        assertThat(response.canonicalRiskEventId()).isNull();
        assertThat(candidateRepository.findById(candidate.getId()).orElseThrow().getStatus())
            .isEqualTo(CandidateRiskEvent.Status.REJECTED);
        assertThat(riskEventRepository.findAllByDisclosureVersionIdOrderByIdAsc(version.getId())).isEmpty();
    }

    @Test
    void sameCanonicalFingerprintLinksDuplicateCandidateWithoutCreatingAnotherEvent() {
        DisclosureVersion version = ingest(
            "20260912004003",
            "단기차입금 증가 결정",
            """
                <DOCUMENT><TITLE>차입금 변동</TITLE>
                <P>운영자금 확보를 위해 단기차입금 증가를 결정했습니다.</P>
                <P>이사회에서 신규 차입을 결정하였습니다.</P>
                </DOCUMENT>
                """
        );
        List<CandidateRiskEvent> candidates = completeAnalysis(
            version,
            "validation-duplicate-model",
            event(
                RiskEventType.DEBT_INCREASE,
                null,
                null,
                null,
                "운영자금 확보를 위해 단기차입금 증가를 결정했습니다."
            ),
            event(RiskEventType.DEBT_INCREASE, null, null, null, "이사회에서 신규 차입을 결정하였습니다.")
        );

        CandidateValidationService.ValidationResponse first = validationService.validate(candidates.get(0).getId());
        CandidateValidationService.ValidationResponse duplicate = validationService.validate(candidates.get(1).getId());

        assertThat(duplicate.status()).isEqualTo("VERIFIED");
        assertThat(duplicate.duplicate()).isTrue();
        assertThat(duplicate.canonicalRiskEventId()).isEqualTo(first.canonicalRiskEventId());
        assertThat(riskEventRepository.findAllByDisclosureVersionIdOrderByIdAsc(version.getId())).hasSize(1);
        assertThat(candidateRepository.findById(candidates.get(1).getId()).orElseThrow().getValidationReason())
            .isEqualTo("DUPLICATE_LINKED_TO_EXISTING_CANONICAL");
    }

    private List<CandidateRiskEvent> completeAnalysis(
        DisclosureVersion version,
        String model,
        RiskEventExtractor.ExtractedEvent... events
    ) {
        Long runId = lifecycle.start(version.getId(), version.getDocumentHash(), model, "RISK_EXTRACTION_V1");
        return lifecycle.completeSuccess(
            runId,
            1L,
            version.getId(),
            new RiskEventExtractor.ExtractionResult(List.of(events), 20, 10, 1),
            5
        ).candidates();
    }

    private RiskEventExtractor.ExtractedEvent event(
        RiskEventType type,
        LocalDate date,
        BigDecimal amount,
        String currency,
        String evidence
    ) {
        return new RiskEventExtractor.ExtractedEvent(
            type,
            date,
            amount,
            currency,
            null,
            evidence,
            "fixture extraction"
        );
    }

    private DisclosureVersion ingest(String receiptNo, String title, String rawContent) {
        var incoming = new DartClient.DartDisclosure(
            receiptNo,
            title,
            Instant.parse("2026-09-12T00:00:00Z"),
            "",
            null
        );
        var result = ingestionService.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(receiptNo, rawContent)
        );
        return versionRepository.findAllByDisclosureIdOrderByVersionNumberAsc(result.disclosureId()).getFirst();
    }
}
