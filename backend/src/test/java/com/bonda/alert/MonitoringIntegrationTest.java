package com.bonda.alert;

import com.bonda.ai.application.AnalysisRunLifecycle;
import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.alert.application.MonitoringService;
import com.bonda.alert.domain.AlertSeverity;
import com.bonda.alert.infrastructure.AlertRepository;
import com.bonda.disclosure.application.DartClient;
import com.bonda.disclosure.application.DisclosureIngestionService;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import com.bonda.portfolio.application.PortfolioService;
import com.bonda.risk.application.FinancialSnapshotService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties =
    "spring.datasource.url=jdbc:h2:mem:monitoring;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH"
)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class MonitoringIntegrationTest {

    @Autowired private PortfolioService portfolioService;
    @Autowired private FinancialSnapshotService financialService;
    @Autowired private MonitoringService monitoringService;
    @Autowired private DisclosureIngestionService ingestionService;
    @Autowired private DisclosureVersionRepository versionRepository;
    @Autowired private AnalysisRunLifecycle analysisLifecycle;
    @Autowired private AlertRepository alertRepository;
    @Autowired private MockMvc mockMvc;

    @Test
    void riskChangeCreatesHoldingAndWatchlistAlertsWithoutDuplicatesAndFeedsSummary() throws Exception {
        var holding = portfolioService.createHolding(
            1L, LocalDate.of(2026, 1, 10), new BigDecimal("10000000")
        );
        var watchlist = portfolioService.createWatchlist(1L);
        financialService.save(1L, new FinancialSnapshotService.SaveCommand(
            "2025-Q4", LocalDate.of(2025, 12, 31), new BigDecimal("100"),
            new BigDecimal("100"), new BigDecimal("100"), new BigDecimal("100"),
            new BigDecimal("100"), new BigDecimal("1000"), new BigDecimal("500")
        ));
        monitoringService.recalculateAndMonitor(1L);
        Long candidateId = liquidityWarningCandidate();

        var validation = monitoringService.validateAndMonitor(candidateId);

        assertThat(validation.status()).isEqualTo("VERIFIED");
        assertThat(alertRepository.findAll()).hasSize(2)
            .allSatisfy(alert -> assertThat(alert.getSeverity()).isEqualTo(AlertSeverity.IMPORTANT));
        assertThat(alertRepository.findAll()).anySatisfy(alert -> {
            assertThat(alert.getHoldingId()).isEqualTo(holding.id());
            assertThat(alert.getWatchlistId()).isNull();
        }).anySatisfy(alert -> {
            assertThat(alert.getHoldingId()).isNull();
            assertThat(alert.getWatchlistId()).isEqualTo(watchlist.id());
        });

        monitoringService.validateAndMonitor(candidateId);
        assertThat(alertRepository.findAll()).hasSize(2);

        mockMvc.perform(get("/api/holdings/summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].holdingId").value(holding.id()))
            .andExpect(jsonPath("$[0].currentRiskState.overall").value("CAUTION"))
            .andExpect(jsonPath("$[0].latestRiskChange.category").value("LIQUIDITY"))
            .andExpect(jsonPath("$[0].newEventCount").value(1))
            .andExpect(jsonPath("$[0].unreadAlertCount").value(1))
            .andExpect(jsonPath("$[0].latestAlert.severity").value("IMPORTANT"));

        Long holdingAlertId = alertRepository.findAll().stream()
            .filter(alert -> holding.id().equals(alert.getHoldingId())).findFirst().orElseThrow().getId();
        mockMvc.perform(patch("/api/alerts/{alertId}/read", holdingAlertId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.isRead").value(true))
            .andExpect(jsonPath("$.targetType").value("SINCE_BOUGHT"));
        mockMvc.perform(patch("/api/alerts/{alertId}/read", holdingAlertId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.isRead").value(true));
        mockMvc.perform(get("/api/alerts").param("unreadOnly", "true").param("limit", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].targetType").value("WATCHLIST"));
    }

    private Long liquidityWarningCandidate() {
        String receiptNo = "20310201007001";
        var ingestion = ingestionService.ingest(
            1L,
            new DartClient.DartDisclosure(
                receiptNo, "유동성 위험 발생", Instant.parse("2026-02-01T00:00:00Z"), "", null
            ),
            new DartClient.DartDocument(
                receiptNo,
                "<DOCUMENT><TITLE>유동성 위험</TITLE><P>2026년 2월 1일 유동성 부족으로 상환에 어려움이 예상됩니다.</P></DOCUMENT>"
            )
        );
        var version = versionRepository
            .findAllByDisclosureIdOrderByVersionNumberAsc(ingestion.disclosureId()).getFirst();
        Long runId = analysisLifecycle.start(
            version.getId(), version.getDocumentHash(), "monitoring-test-model", "RISK_EXTRACTION_V1"
        );
        return analysisLifecycle.completeSuccess(
            runId,
            1L,
            version.getId(),
            new RiskEventExtractor.ExtractionResult(
                List.of(new RiskEventExtractor.ExtractedEvent(
                    RiskEventType.LIQUIDITY_WARNING,
                    LocalDate.of(2026, 2, 1),
                    null,
                    null,
                    null,
                    "2026년 2월 1일 유동성 부족으로 상환에 어려움이 예상됩니다.",
                    "fixture extraction"
                )),
                10,
                5,
                1
            ),
            3
        ).candidates().getFirst().getId();
    }
}
