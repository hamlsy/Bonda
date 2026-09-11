package com.bonda.risk.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RiskChangeDetectorTest {

    private final RiskChangeDetector detector = new RiskChangeDetector();

    @Test
    void detectsNormalToWatchFromInitialBaseline() {
        IssuerRiskSnapshot current = snapshot(RiskState.WATCH);

        assertThat(detector.detect(current, null))
            .containsExactly(new RiskChangeDetector.Transition(
                RiskCategory.LIQUIDITY,
                RiskState.NORMAL,
                RiskState.WATCH
            ));
    }

    @Test
    void doesNotCreateTransitionWhenStateRemainsWatch() {
        assertThat(detector.detect(snapshot(RiskState.WATCH), snapshot(RiskState.WATCH))).isEmpty();
    }

    @Test
    void detectsImprovementFromCautionToWatch() {
        assertThat(detector.detect(snapshot(RiskState.WATCH), snapshot(RiskState.CAUTION)))
            .containsExactly(new RiskChangeDetector.Transition(
                RiskCategory.LIQUIDITY,
                RiskState.CAUTION,
                RiskState.WATCH
            ));
    }

    private IssuerRiskSnapshot snapshot(RiskState liquidity) {
        Map<RiskCategory, RiskState> states = new EnumMap<>(RiskCategory.class);
        for (RiskCategory category : RiskCategory.values()) {
            states.put(category, category == RiskCategory.LIQUIDITY ? liquidity : RiskState.NORMAL);
        }
        return IssuerRiskSnapshot.create(
            1L,
            LocalDate.of(2026, 9, 30),
            "RISK_POLICY_V1",
            null,
            "fingerprint",
            "trace",
            states
        );
    }
}
