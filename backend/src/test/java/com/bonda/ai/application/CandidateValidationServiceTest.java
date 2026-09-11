package com.bonda.ai.application;

import com.bonda.ai.domain.AnalysisRun;
import com.bonda.ai.domain.CandidateRiskEvent;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.ai.infrastructure.AnalysisRunRepository;
import com.bonda.ai.infrastructure.CandidateRiskEventRepository;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CandidateValidationServiceTest {

    @Test
    void systemValidationErrorDoesNotTurnCandidateIntoARejection() {
        CandidateRiskEventRepository candidates = mock(CandidateRiskEventRepository.class);
        AnalysisRunRepository runs = mock(AnalysisRunRepository.class);
        DisclosureVersionRepository versions = mock(DisclosureVersionRepository.class);
        DisclosureRepository disclosures = mock(DisclosureRepository.class);
        RiskEventRepository riskEvents = mock(RiskEventRepository.class);
        RiskEventEvidenceRepository evidence = mock(RiskEventEvidenceRepository.class);
        CandidateRiskEventValidator validator = mock(CandidateRiskEventValidator.class);
        CandidateValidationService service = new CandidateValidationService(
            candidates,
            runs,
            versions,
            disclosures,
            riskEvents,
            evidence,
            validator,
            Clock.fixed(Instant.EPOCH, ZoneOffset.UTC)
        );
        CandidateRiskEvent candidate = CandidateRiskEvent.create(
            10L,
            1L,
            20L,
            RiskEventType.OPERATING_LOSS,
            null,
            null,
            null,
            null,
            "영업손실이 발생했습니다.",
            null
        );
        AnalysisRun run = mock(AnalysisRun.class);
        DisclosureVersion version = mock(DisclosureVersion.class);
        Disclosure disclosure = mock(Disclosure.class);
        when(candidates.findById(30L)).thenReturn(Optional.of(candidate));
        when(runs.findById(10L)).thenReturn(Optional.of(run));
        when(versions.findById(20L)).thenReturn(Optional.of(version));
        when(version.getDisclosureId()).thenReturn(40L);
        when(disclosures.findById(40L)).thenReturn(Optional.of(disclosure));
        when(validator.validate(candidate, run, disclosure, version))
            .thenThrow(new IllegalStateException("parser unavailable"));

        assertThatThrownBy(() -> service.validate(30L))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("parser unavailable");

        assertThat(candidate.getStatus()).isEqualTo(CandidateRiskEvent.Status.PENDING);
        assertThat(candidate.getValidationReason()).isNull();
        verify(riskEvents, never()).save(org.mockito.ArgumentMatchers.any());
        verify(evidence, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
