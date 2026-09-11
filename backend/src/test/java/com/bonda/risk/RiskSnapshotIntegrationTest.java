package com.bonda.risk;

import com.bonda.ai.application.AnalysisRunLifecycle;
import com.bonda.ai.application.CandidateValidationService;
import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.disclosure.application.DartClient;
import com.bonda.disclosure.application.DisclosureIngestionService;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import com.bonda.risk.application.RiskRecalculationService;
import com.bonda.risk.domain.RiskCategory;
import com.bonda.risk.domain.RiskState;
import com.bonda.risk.infrastructure.FinancialSnapshotRepository;
import com.bonda.risk.infrastructure.IssuerRiskSnapshotRepository;
import com.bonda.risk.infrastructure.RiskChangeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

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
class RiskSnapshotIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private FinancialSnapshotRepository financialRepository;
    @Autowired private IssuerRiskSnapshotRepository snapshotRepository;
    @Autowired private RiskChangeRepository changeRepository;
    @Autowired private DisclosureIngestionService ingestionService;
    @Autowired private DisclosureVersionRepository disclosureVersionRepository;
    @Autowired private AnalysisRunLifecycle analysisLifecycle;
    @Autowired private CandidateValidationService candidateValidationService;
    @Autowired private RiskEventRepository riskEventRepository;
    @Autowired private RiskRecalculationService recalculationService;

    @Test
    void storesFinancialsCalculatesRiskChangesAndReusesSameInputs() throws Exception {
        saveFinancial(1L, "2027-Q1", "2027-03-31", "100", "100", "100", "100", "100")
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statementScope").value("CONSOLIDATED"))
            .andExpect(jsonPath("$.totalDebt").value(200))
            .andExpect(jsonPath("$.reused").value(false));

        MvcResult baseline = mockMvc.perform(post("/api/admin/issuers/1/risk/recalculate"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.snapshotDate").value("2027-03-31"))
            .andExpect(jsonPath("$.decisions[0].state").value("NORMAL"))
            .andExpect(jsonPath("$.changes").isEmpty())
            .andReturn();
        long baselineId = jsonLong(baseline, "snapshotId");

        saveFinancial(1L, "2027-Q2", "2027-06-30", "70", "150", "100", "50", "80")
            .andExpect(status().isCreated());

        MvcResult changed = mockMvc.perform(post("/api/admin/issuers/1/risk/recalculate"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.snapshotDate").value("2027-06-30"))
            .andExpect(jsonPath("$.ruleVersion").value("RISK_POLICY_V1"))
            .andExpect(jsonPath("$.reused").value(false))
            .andExpect(jsonPath("$.decisions[0].category").value("LIQUIDITY"))
            .andExpect(jsonPath("$.decisions[0].state").value("WATCH"))
            .andExpect(jsonPath("$.decisions[0].reasons[0]").value("SHORT_TERM_DEBT_UP_AND_CASH_DOWN"))
            .andExpect(jsonPath("$.features.cashChangeRate").value(-0.3))
            .andReturn();
        long changedId = jsonLong(changed, "snapshotId");

        assertThat(changedId).isNotEqualTo(baselineId);
        assertThat(snapshotRepository.findAllByIssuerIdOrderBySnapshotDateAscIdAsc(1L))
            .filteredOn(snapshot -> snapshot.getSnapshotDate().getYear() == 2027)
            .hasSize(2)
            .last()
            .satisfies(snapshot -> {
                assertThat(snapshot.getLiquidityState()).isEqualTo(RiskState.WATCH);
                assertThat(snapshot.getCashFlowState()).isEqualTo(RiskState.WATCH);
                assertThat(snapshot.getLeverageState()).isEqualTo(RiskState.WATCH);
                assertThat(snapshot.getDecisionTrace()).contains("SHORT_TERM_DEBT_UP_AND_CASH_DOWN");
            });
        assertThat(changeRepository.findAllByCurrentSnapshotIdOrderByCategoryAsc(changedId))
            .extracting(change -> change.getCategory())
            .containsExactly(RiskCategory.CASH_FLOW, RiskCategory.LEVERAGE, RiskCategory.LIQUIDITY);

        MvcResult repeated = mockMvc.perform(post("/api/admin/issuers/1/risk/recalculate"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.snapshotId").value(changedId))
            .andExpect(jsonPath("$.reused").value(true))
            .andReturn();
        assertThat(jsonLong(repeated, "snapshotId")).isEqualTo(changedId);
        assertThat(changeRepository.findAllByCurrentSnapshotIdOrderByCategoryAsc(changedId)).hasSize(3);
    }

    @Test
    void sameFinancialPeriodIsIdempotentButConflictingValuesAreRejected() throws Exception {
        saveFinancial(2L, "2028-Q1", "2028-03-31", "100", "10", "20", "30", "40")
            .andExpect(status().isCreated());
        long count = financialRepository.count();

        saveFinancial(2L, "2028-Q1", "2028-03-31", "100.00", "10", "20", "30", "40")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reused").value(true));
        saveFinancial(2L, "2028-Q1", "2028-03-31", "99", "10", "20", "30", "40")
            .andExpect(status().isConflict());

        assertThat(financialRepository.count()).isEqualTo(count);
    }

    @Test
    void canonicalLiquidityWarningIsUsedByRiskPolicy() {
        String receiptNo = "20300701005001";
        var ingestion = ingestionService.ingest(
            2L,
            new DartClient.DartDisclosure(
                receiptNo,
                "유동성 위험 발생",
                Instant.parse("2030-07-01T00:00:00Z"),
                "",
                null
            ),
            new DartClient.DartDocument(
                receiptNo,
                "<DOCUMENT><TITLE>유동성 위험</TITLE><P>2030년 7월 1일 유동성 부족으로 상환에 어려움이 예상됩니다.</P></DOCUMENT>"
            )
        );
        var version = disclosureVersionRepository
            .findAllByDisclosureIdOrderByVersionNumberAsc(ingestion.disclosureId()).getFirst();
        Long runId = analysisLifecycle.start(
            version.getId(),
            version.getDocumentHash(),
            "risk-policy-canonical-test",
            "RISK_EXTRACTION_V1"
        );
        var completion = analysisLifecycle.completeSuccess(
            runId,
            2L,
            version.getId(),
            new RiskEventExtractor.ExtractionResult(
                List.of(new RiskEventExtractor.ExtractedEvent(
                    RiskEventType.LIQUIDITY_WARNING,
                    LocalDate.of(2030, 7, 1),
                    null,
                    null,
                    null,
                    "2030년 7월 1일 유동성 부족으로 상환에 어려움이 예상됩니다.",
                    "fixture extraction"
                )),
                10,
                5,
                1
            ),
            3
        );
        var validation = candidateValidationService.validate(completion.candidates().getFirst().getId());
        Long canonicalId = validation.canonicalRiskEventId();

        RiskRecalculationService.RecalculationResult result = recalculationService.recalculate(2L);

        assertThat(validation.status()).isEqualTo("VERIFIED");
        assertThat(riskEventRepository.findById(canonicalId)).isPresent();
        assertThat(result.decisions()).filteredOn(decision -> decision.category() == RiskCategory.LIQUIDITY)
            .singleElement()
            .satisfies(decision -> {
                assertThat(decision.state()).isEqualTo(RiskState.CAUTION);
                assertThat(decision.reasons()).contains("LIQUIDITY_WARNING_EVENT");
                assertThat(decision.sourceEventIds()).containsExactly(canonicalId);
            });
    }

    private org.springframework.test.web.servlet.ResultActions saveFinancial(
        Long issuerId,
        String period,
        String statementDate,
        String cash,
        String shortDebt,
        String longDebt,
        String operatingCashFlow,
        String operatingProfit
    ) throws Exception {
        String body = """
            {
              "period": "%s",
              "statementDate": "%s",
              "cash": %s,
              "shortTermDebt": %s,
              "longTermDebt": %s,
              "operatingCashFlow": %s,
              "operatingProfit": %s,
              "totalAssets": 1000,
              "totalLiabilities": 500
            }
            """.formatted(
            period,
            statementDate,
            cash,
            shortDebt,
            longDebt,
            operatingCashFlow,
            operatingProfit
        );
        return mockMvc.perform(post("/api/admin/issuers/{issuerId}/financial-snapshots", issuerId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body));
    }

    private long jsonLong(MvcResult result, String field) throws Exception {
        return new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(result.getResponse().getContentAsString())
            .get(field)
            .asLong();
    }
}
