package com.bonda.ai;

import com.bonda.ai.application.AnalysisRunLifecycle;
import com.bonda.ai.application.RiskAnalysisService;
import com.bonda.ai.application.RiskExtractionException;
import com.bonda.ai.domain.AnalysisRun;
import com.bonda.ai.infrastructure.AnalysisRunRepository;
import com.bonda.ai.infrastructure.CandidateRiskEventRepository;
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

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiExtractionIntegrationTest {

    @Autowired private DisclosureIngestionService ingestionService;
    @Autowired private DisclosureVersionRepository versionRepository;
    @Autowired private RiskAnalysisService analysisService;
    @Autowired private AnalysisRunLifecycle lifecycle;
    @Autowired private AnalysisRunRepository runRepository;
    @Autowired private CandidateRiskEventRepository candidateRepository;
    @Autowired private MockMvc mockMvc;

    @Test
    void manualTriggerUsesFakeExtractorStoresCandidateAndReusesSuccess() throws Exception {
        DisclosureVersion version = ingestRiskDisclosure("20260911003001");

        mockMvc.perform(post("/api/admin/analysis/{disclosureVersionId}", version.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SUCCESS"))
            .andExpect(jsonPath("$.reused").value(false))
            .andExpect(jsonPath("$.model").value("fake-local-v1"))
            .andExpect(jsonPath("$.promptVersion").value("RISK_EXTRACTION_V1"))
            .andExpect(jsonPath("$.candidates[0].eventType").value("DEBT_INCREASE"))
            .andExpect(jsonPath("$.candidates[0].status").value("PENDING"));

        AnalysisRun run = runRepository
            .findFirstByDocumentHashAndModelAndPromptVersionAndStatusOrderByIdDesc(
                version.getDocumentHash(),
                "fake-local-v1",
                "RISK_EXTRACTION_V1",
                AnalysisRun.Status.SUCCESS
            )
            .orElseThrow();
        assertThat(run.getInputTokens()).isZero();
        assertThat(run.getOutputTokens()).isZero();
        assertThat(run.getLatencyMs()).isNotNegative();
        assertThat(run.getEstimatedCost()).isNull();
        assertThat(candidateRepository.findAllByAnalysisRunIdOrderByIdAsc(run.getId()))
            .singleElement()
            .satisfies(candidate -> {
                assertThat(candidate.getDisclosureVersionId()).isEqualTo(version.getId());
                assertThat(candidate.getEvidenceText()).contains("단기차입금", "800억원");
            });

        RiskAnalysisService.AnalysisResult reused = analysisService.analyze(version.getId());
        assertThat(reused.reused()).isTrue();
        assertThat(reused.analysisRunId()).isEqualTo(run.getId());
        assertThat(runRepository.findAll()).filteredOn(candidate ->
            candidate.getDisclosureVersionId().equals(version.getId())).hasSize(1);
    }

    @Test
    void skipDoesNotCreateAnAnalysisRun() {
        DisclosureVersion version = ingestUnrelatedDisclosure("20260911003002");
        long before = runRepository.count();

        RiskAnalysisService.AnalysisResult result = analysisService.analyze(version.getId());

        assertThat(result.status()).isEqualTo("SKIPPED");
        assertThat(result.analysisRunId()).isNull();
        assertThat(runRepository.count()).isEqualTo(before);
    }

    @Test
    void failedRunIsPersistedWithoutCandidates() {
        DisclosureVersion version = ingestRiskDisclosure("20260911003003");
        Long runId = lifecycle.start(
            version.getId(),
            version.getDocumentHash(),
            "failure-test-model",
            "RISK_EXTRACTION_V1"
        );

        lifecycle.completeFailure(
            runId,
            RiskExtractionException.ErrorType.TIMEOUT,
            "AI provider timed out",
            250,
            3
        );

        AnalysisRun failed = runRepository.findById(runId).orElseThrow();
        assertThat(failed.getStatus()).isEqualTo(AnalysisRun.Status.FAILED);
        assertThat(failed.getErrorType()).isEqualTo("TIMEOUT");
        assertThat(failed.getRetryCount()).isEqualTo(2);
        assertThat(candidateRepository.findAllByAnalysisRunIdOrderByIdAsc(runId)).isEmpty();
    }

    private DisclosureVersion ingestRiskDisclosure(String receiptNo) {
        var incoming = disclosure(receiptNo, "단기차입금 증가 결정");
        var result = ingestionService.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(receiptNo, """
                <DOCUMENT>
                  <TITLE>차입금 및 유동성</TITLE>
                  <P>2026년 9월 11일 단기차입금이 300억원에서 800억원으로 증가했습니다.</P>
                </DOCUMENT>
                """)
        );
        return versionRepository.findAllByDisclosureIdOrderByVersionNumberAsc(result.disclosureId()).getFirst();
    }

    private DisclosureVersion ingestUnrelatedDisclosure(String receiptNo) {
        var incoming = disclosure(receiptNo, "주주총회소집공고");
        var result = ingestionService.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(receiptNo, """
                <DOCUMENT><TITLE>주주총회 안내</TITLE>
                <P>2026년 9월 30일 서울 본사에서 정기 주주총회를 개최합니다.</P></DOCUMENT>
                """)
        );
        return versionRepository.findAllByDisclosureIdOrderByVersionNumberAsc(result.disclosureId()).getFirst();
    }

    private DartClient.DartDisclosure disclosure(String receiptNo, String title) {
        return new DartClient.DartDisclosure(
            receiptNo,
            title,
            Instant.parse("2026-09-11T00:00:00Z"),
            "",
            null
        );
    }
}
