package com.bonda.sincebought;

import com.bonda.ai.application.AnalysisRunLifecycle;
import com.bonda.ai.application.CandidateValidationService;
import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.disclosure.application.DartClient;
import com.bonda.disclosure.application.DisclosureIngestionService;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import com.bonda.portfolio.application.PortfolioService;
import com.bonda.risk.application.FinancialSnapshotService;
import com.bonda.risk.application.RiskRecalculationService;
import com.bonda.sincebought.infrastructure.SinceBoughtExplanationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties =
    "spring.datasource.url=jdbc:h2:mem:since_bought;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH"
)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class SinceBoughtIntegrationTest {

    @Autowired private PortfolioService portfolioService;
    @Autowired private FinancialSnapshotService financialService;
    @Autowired private RiskRecalculationService recalculationService;
    @Autowired private DisclosureIngestionService ingestionService;
    @Autowired private DisclosureVersionRepository versionRepository;
    @Autowired private AnalysisRunLifecycle analysisLifecycle;
    @Autowired private CandidateValidationService validationService;
    @Autowired private SinceBoughtExplanationRepository explanationRepository;
    @Autowired private MockMvc mockMvc;

    @Test
    void holdingToIssuerTimelineExplanationCacheAndEvidenceAreConnected() throws Exception {
        var holding = portfolioService.createHolding(
            1L,
            LocalDate.of(2026, 1, 10),
            new BigDecimal("10000000")
        );
        financialService.save(1L, financial(
            "2025-Q4", LocalDate.of(2025, 12, 31), "100", "100", "100", "100", "100"
        ));
        financialService.save(1L, financial(
            "2026-Q1", LocalDate.of(2026, 3, 31), "70", "150", "100", "50", "80"
        ));
        Long canonicalEventId = canonicalDebtEvent();
        recalculationService.recalculate(1L);

        mockMvc.perform(get("/api/holdings/{holdingId}/since-bought", holding.id()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.holding.bondName").value("[데모] 한결산업 1회 회사채"))
            .andExpect(jsonPath("$.holding.purchaseDate").value("2026-01-10"))
            .andExpect(jsonPath("$.timeline[0].type").value("PURCHASE"))
            .andExpect(jsonPath("$.timeline[1].type").value("RISK_EVENT"))
            .andExpect(jsonPath("$.timeline[1].riskEventId").value(canonicalEventId))
            .andExpect(jsonPath("$.timeline[1].evidenceAvailable").value(true))
            .andExpect(jsonPath("$.financialContext.baseline.period").value("2025-Q4"))
            .andExpect(jsonPath("$.financialContext.current.period").value("2026-Q1"))
            .andExpect(jsonPath("$.currentRiskState.liquidity").value("WATCH"))
            .andExpect(jsonPath("$.explanation.status").value("AVAILABLE"))
            .andExpect(jsonPath("$.explanation.reused").value(false));

        mockMvc.perform(get("/api/holdings/{holdingId}/since-bought", holding.id()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.explanation.status").value("AVAILABLE"))
            .andExpect(jsonPath("$.explanation.reused").value(true));
        assertThat(explanationRepository.count()).isEqualTo(1);

        mockMvc.perform(get("/api/risk-events/{riskEventId}", canonicalEventId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.eventType").value("DEBT_INCREASE"))
            .andExpect(jsonPath("$.disclosureTitle").value("단기차입금 증가 결정"))
            .andExpect(jsonPath("$.sourceReceiptNo").value("20260201006001"))
            .andExpect(jsonPath("$.evidence[0].evidenceText").value(
                "2026년 2월 1일 단기차입금 증가를 결정했습니다."
            ));
    }

    private Long canonicalDebtEvent() {
        String receiptNo = "20260201006001";
        var ingestion = ingestionService.ingest(
            1L,
            new DartClient.DartDisclosure(
                receiptNo,
                "단기차입금 증가 결정",
                Instant.parse("2026-02-01T00:00:00Z"),
                "",
                null
            ),
            new DartClient.DartDocument(
                receiptNo,
                "<DOCUMENT><TITLE>차입금 변동</TITLE><P>2026년 2월 1일 단기차입금 증가를 결정했습니다.</P></DOCUMENT>"
            )
        );
        var version = versionRepository
            .findAllByDisclosureIdOrderByVersionNumberAsc(ingestion.disclosureId()).getFirst();
        Long runId = analysisLifecycle.start(
            version.getId(),
            version.getDocumentHash(),
            "since-bought-integration-model",
            "RISK_EXTRACTION_V1"
        );
        var completion = analysisLifecycle.completeSuccess(
            runId,
            1L,
            version.getId(),
            new RiskEventExtractor.ExtractionResult(
                List.of(new RiskEventExtractor.ExtractedEvent(
                    RiskEventType.DEBT_INCREASE,
                    LocalDate.of(2026, 2, 1),
                    null,
                    null,
                    null,
                    "2026년 2월 1일 단기차입금 증가를 결정했습니다.",
                    "fixture extraction"
                )),
                10,
                5,
                1
            ),
            3
        );
        return validationService.validate(completion.candidates().getFirst().getId()).canonicalRiskEventId();
    }

    private FinancialSnapshotService.SaveCommand financial(
        String period,
        LocalDate date,
        String cash,
        String shortDebt,
        String longDebt,
        String operatingCashFlow,
        String operatingProfit
    ) {
        return new FinancialSnapshotService.SaveCommand(
            period,
            date,
            new BigDecimal(cash),
            new BigDecimal(shortDebt),
            new BigDecimal(longDebt),
            new BigDecimal(operatingCashFlow),
            new BigDecimal(operatingProfit),
            new BigDecimal("1000"),
            new BigDecimal("500")
        );
    }
}
