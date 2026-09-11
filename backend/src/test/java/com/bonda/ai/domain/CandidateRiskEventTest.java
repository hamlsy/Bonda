package com.bonda.ai.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CandidateRiskEventTest {

    @Test
    void verifiesOnceAndKeepsCanonicalTrace() {
        CandidateRiskEvent candidate = candidate();

        candidate.verify(90L, "VALIDATED", "RISK_VALIDATION_V1", Instant.EPOCH);

        assertThat(candidate.getStatus()).isEqualTo(CandidateRiskEvent.Status.VERIFIED);
        assertThat(candidate.getCanonicalRiskEventId()).isEqualTo(90L);
        assertThat(candidate.getValidationReason()).isEqualTo("VALIDATED");
        assertThat(candidate.getValidationRuleVersion()).isEqualTo("RISK_VALIDATION_V1");
        assertThatThrownBy(() -> candidate.reject("later", "V2", Instant.EPOCH))
            .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejectionRecordsReasonWithoutCanonicalReference() {
        CandidateRiskEvent candidate = candidate();

        candidate.reject("EVIDENCE_NOT_FOUND_IN_SOURCE", "RISK_VALIDATION_V1", Instant.EPOCH);

        assertThat(candidate.getStatus()).isEqualTo(CandidateRiskEvent.Status.REJECTED);
        assertThat(candidate.getCanonicalRiskEventId()).isNull();
        assertThat(candidate.getValidationReason()).isEqualTo("EVIDENCE_NOT_FOUND_IN_SOURCE");
    }

    private CandidateRiskEvent candidate() {
        return CandidateRiskEvent.create(
            1L,
            1L,
            1L,
            RiskEventType.OPERATING_LOSS,
            null,
            null,
            null,
            null,
            "영업손실이 발생했습니다.",
            null
        );
    }
}
