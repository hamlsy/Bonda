package com.bonda.ai.application;

import com.bonda.ai.infrastructure.AnalysisRunRepository;
import com.bonda.ai.infrastructure.CandidateRiskEventRepository;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import com.bonda.issuer.infrastructure.IssuerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RiskAnalysisServiceTest {

    @Mock private DisclosureVersionRepository versionRepository;
    @Mock private DisclosureRepository disclosureRepository;
    @Mock private IssuerRepository issuerRepository;
    @Mock private AnalysisRunRepository runRepository;
    @Mock private CandidateRiskEventRepository candidateRepository;
    @Mock private RiskEventExtractor extractor;
    @Mock private AnalysisInputContextBuilder contextBuilder;
    @Mock private AnalysisRunLifecycle lifecycle;

    private RiskAnalysisService service;

    @BeforeEach
    void setUp() {
        service = new RiskAnalysisService(
            versionRepository,
            disclosureRepository,
            issuerRepository,
            runRepository,
            candidateRepository,
            extractor,
            new RiskExtractionPrompt(),
            contextBuilder,
            lifecycle
        );
    }

    @Test
    void doesNotCallExtractorWhenPreFilterSaysSkip() {
        DisclosureVersion version = version("SKIP");
        when(versionRepository.findById(1L)).thenReturn(Optional.of(version));

        RiskAnalysisService.AnalysisResult result = service.analyze(1L);

        assertThat(result.status()).isEqualTo("SKIPPED");
        verifyNoInteractions(extractor, runRepository, lifecycle);
    }

    @Test
    void checksForSuccessfulAnalysisBeforeCallingExtractor() {
        DisclosureVersion version = version("ANALYZE");
        com.bonda.ai.domain.AnalysisRun existing = com.bonda.ai.domain.AnalysisRun.create(
            1L,
            version.getDocumentHash(),
            "fake-local-v1",
            "RISK_EXTRACTION_V1"
        );
        existing.markProcessing(Instant.parse("2026-09-11T00:00:00Z"));
        existing.markSuccess(0, 0, 1, null, 0, Instant.parse("2026-09-11T00:00:01Z"));
        ReflectionTestUtils.setField(existing, "id", 10L);
        when(versionRepository.findById(1L)).thenReturn(Optional.of(version));
        when(extractor.model()).thenReturn("fake-local-v1");
        when(runRepository.findFirstByDocumentHashAndModelAndPromptVersionAndStatusOrderByIdDesc(
            version.getDocumentHash(),
            "fake-local-v1",
            "RISK_EXTRACTION_V1",
            com.bonda.ai.domain.AnalysisRun.Status.SUCCESS
        )).thenReturn(Optional.of(existing));
        when(candidateRepository.findAllByAnalysisRunIdOrderByIdAsc(10L)).thenReturn(List.of());

        RiskAnalysisService.AnalysisResult result = service.analyze(1L);

        assertThat(result.reused()).isTrue();
        assertThat(result.analysisRunId()).isEqualTo(10L);
        verify(extractor, never()).extract(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void recordsExtractorFailureOnTheStartedRun() {
        DisclosureVersion version = version("ANALYZE");
        com.bonda.disclosure.domain.Disclosure disclosure = mock(com.bonda.disclosure.domain.Disclosure.class);
        com.bonda.issuer.domain.Issuer issuer = mock(com.bonda.issuer.domain.Issuer.class);
        RiskEventExtractor.ExtractionRequest request = new RiskEventExtractor.ExtractionRequest(
            "본다산업",
            "단기차입금 증가 결정",
            Instant.parse("2026-09-11T00:00:00Z"),
            "DART",
            "단기차입금이 증가했습니다."
        );
        com.bonda.ai.domain.AnalysisRun failed = com.bonda.ai.domain.AnalysisRun.create(
            1L,
            version.getDocumentHash(),
            "test-model",
            "RISK_EXTRACTION_V1"
        );
        failed.markProcessing(Instant.parse("2026-09-11T00:00:00Z"));
        failed.markFailed("TIMEOUT", "AI provider timed out", 10, 2, Instant.parse("2026-09-11T00:00:01Z"));
        ReflectionTestUtils.setField(failed, "id", 20L);

        when(versionRepository.findById(1L)).thenReturn(Optional.of(version));
        when(extractor.model()).thenReturn("test-model");
        when(runRepository.findFirstByDocumentHashAndModelAndPromptVersionAndStatusOrderByIdDesc(
            version.getDocumentHash(),
            "test-model",
            "RISK_EXTRACTION_V1",
            com.bonda.ai.domain.AnalysisRun.Status.SUCCESS
        )).thenReturn(Optional.empty());
        when(disclosureRepository.findById(1L)).thenReturn(Optional.of(disclosure));
        when(disclosure.getIssuerId()).thenReturn(1L);
        when(issuerRepository.findById(1L)).thenReturn(Optional.of(issuer));
        when(contextBuilder.build(issuer, disclosure, version)).thenReturn(request);
        when(lifecycle.start(1L, version.getDocumentHash(), "test-model", "RISK_EXTRACTION_V1"))
            .thenReturn(20L);
        when(extractor.extract(request)).thenThrow(new RiskExtractionException(
            RiskExtractionException.ErrorType.TIMEOUT,
            "AI provider timed out",
            3
        ));
        when(lifecycle.completeFailure(
            org.mockito.ArgumentMatchers.eq(20L),
            org.mockito.ArgumentMatchers.eq(RiskExtractionException.ErrorType.TIMEOUT),
            org.mockito.ArgumentMatchers.eq("AI provider timed out"),
            org.mockito.ArgumentMatchers.anyLong(),
            org.mockito.ArgumentMatchers.eq(3)
        )).thenReturn(failed);

        RiskAnalysisService.AnalysisResult result = service.analyze(1L);

        assertThat(result.status()).isEqualTo("FAILED");
        assertThat(result.errorType()).isEqualTo("TIMEOUT");
        assertThat(result.candidates()).isEmpty();
        verify(lifecycle).completeFailure(
            org.mockito.ArgumentMatchers.eq(20L),
            org.mockito.ArgumentMatchers.eq(RiskExtractionException.ErrorType.TIMEOUT),
            org.mockito.ArgumentMatchers.eq("AI provider timed out"),
            org.mockito.ArgumentMatchers.anyLong(),
            org.mockito.ArgumentMatchers.eq(3)
        );
    }

    private DisclosureVersion version(String decision) {
        return DisclosureVersion.create(
            1L,
            1,
            "20260911000001",
            "a".repeat(64),
            "<DOCUMENT>본문</DOCUMENT>",
            "본문",
            decision,
            "",
            "",
            "",
            Instant.parse("2026-09-11T00:00:00Z"),
            "PRE_FILTER_V1",
            Instant.parse("2026-09-11T00:00:00Z")
        );
    }
}
