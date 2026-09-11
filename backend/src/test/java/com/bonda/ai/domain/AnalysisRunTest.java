package com.bonda.ai.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AnalysisRunTest {

    @Test
    void movesFromPendingThroughProcessingToSuccess() {
        AnalysisRun run = AnalysisRun.create(1L, "a".repeat(64), "fake-local-v1", "RISK_EXTRACTION_V1");

        assertThat(run.getStatus()).isEqualTo(AnalysisRun.Status.PENDING);
        run.markProcessing(Instant.parse("2026-09-11T00:00:00Z"));
        run.markSuccess(
            100,
            20,
            250,
            new BigDecimal("0.00004400"),
            1,
            Instant.parse("2026-09-11T00:00:01Z")
        );

        assertThat(run.getStatus()).isEqualTo(AnalysisRun.Status.SUCCESS);
        assertThat(run.getRetryCount()).isEqualTo(1);
        assertThat(run.getEstimatedCost()).isEqualByComparingTo("0.00004400");
    }

    @Test
    void rejectsInvalidStatusTransitions() {
        AnalysisRun run = AnalysisRun.create(1L, "b".repeat(64), "model", "prompt");

        assertThatThrownBy(() -> run.markSuccess(null, null, 0, null, 0, Instant.now()))
            .isInstanceOf(IllegalStateException.class);
    }
}
