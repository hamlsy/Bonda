package com.bonda.sincebought.application;

import com.bonda.ai.application.AiCostCalculator;
import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.sincebought.domain.SinceBoughtExplanation;
import com.bonda.sincebought.infrastructure.SinceBoughtExplanationRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CrossDocumentExplanationServiceTest {

    @Test
    void cacheHitDoesNotCallAiAgain() {
        SinceBoughtExplanationRepository repository = mock(SinceBoughtExplanationRepository.class);
        CrossDocumentExplainer explainer = mock(CrossDocumentExplainer.class);
        when(explainer.model()).thenReturn("fake-local-v1");
        SinceBoughtExplanation cached = mock(SinceBoughtExplanation.class);
        when(cached.getSummary()).thenReturn("기존 설명");
        when(cached.getRelatedEventIds()).thenReturn("1");
        when(cached.getRelatedRiskChangeIds()).thenReturn("");
        when(cached.getModel()).thenReturn("fake-local-v1");
        when(cached.getPromptVersion()).thenReturn("SINCE_BOUGHT_EXPLANATION_V1");
        when(repository.findByInputFingerprint(anyString())).thenReturn(Optional.of(cached));
        CrossDocumentExplanationService service = service(repository, explainer);

        var result = service.explain(data(List.of(event(1L)), List.of()));

        assertThat(result.status()).isEqualTo("AVAILABLE");
        assertThat(result.reused()).isTrue();
        assertThat(result.summary()).isEqualTo("기존 설명");
        verify(explainer, never()).explain(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void noEventOrRiskChangeSkipsCacheAndAi() {
        SinceBoughtExplanationRepository repository = mock(SinceBoughtExplanationRepository.class);
        CrossDocumentExplainer explainer = mock(CrossDocumentExplainer.class);
        CrossDocumentExplanationService service = service(repository, explainer);

        var result = service.explain(data(List.of(), List.of()));

        assertThat(result.status()).isEqualTo("NOT_NEEDED");
        verify(repository, never()).findByInputFingerprint(anyString());
        verify(explainer, never()).explain(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void aiFailureDoesNotFailDeterministicSinceBoughtData() {
        SinceBoughtExplanationRepository repository = mock(SinceBoughtExplanationRepository.class);
        CrossDocumentExplainer explainer = mock(CrossDocumentExplainer.class);
        when(explainer.model()).thenReturn("failed-model");
        when(repository.findByInputFingerprint(anyString())).thenReturn(Optional.empty());
        when(explainer.explain(org.mockito.ArgumentMatchers.any()))
            .thenThrow(new ExplanationException("provider unavailable"));
        CrossDocumentExplanationService service = service(repository, explainer);

        assertThat(service.explain(data(List.of(event(1L)), List.of())).status()).isEqualTo("FAILED");
    }

    private CrossDocumentExplanationService service(
        SinceBoughtExplanationRepository repository,
        CrossDocumentExplainer explainer
    ) {
        return new CrossDocumentExplanationService(
            repository,
            mock(RiskEventEvidenceRepository.class),
            explainer,
            mock(AiCostCalculator.class)
        );
    }

    private SinceBoughtDataAssembler.SinceBoughtData data(
        List<RiskEvent> events,
        List<com.bonda.risk.domain.RiskChange> changes
    ) {
        return new SinceBoughtDataAssembler.SinceBoughtData(
            new SinceBoughtDataAssembler.HoldingSummary(
                7L,
                2L,
                "테스트 채권",
                3L,
                "테스트 발행사",
                LocalDate.of(2026, 3, 12),
                new BigDecimal("10000000")
            ),
            events,
            changes,
            null,
            null,
            List.of(),
            null,
            List.of()
        );
    }

    private RiskEvent event(Long id) {
        RiskEvent event = mock(RiskEvent.class);
        when(event.getId()).thenReturn(id);
        return event;
    }
}
