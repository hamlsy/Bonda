package com.bonda.alert.domain;

import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.risk.domain.RiskCategory;
import com.bonda.risk.domain.RiskChange;
import com.bonda.risk.domain.RiskState;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AlertPolicyTest {

    private final AlertPolicy policy = new AlertPolicy();

    @Test
    void mapsWatchAndCautionTransitionsConservatively() {
        RiskChange watch = change(RiskState.NORMAL, RiskState.WATCH);
        RiskChange important = change(RiskState.WATCH, RiskState.CAUTION);

        assertThat(policy.forRiskChange("한결산업", watch).severity()).isEqualTo(AlertSeverity.WATCH);
        assertThat(policy.forRiskChange("한결산업", important).severity()).isEqualTo(AlertSeverity.IMPORTANT);
    }

    @Test
    void aStrongEventWithoutAStateChangeNeverBecomesImportant() {
        RiskEvent event = mock(RiskEvent.class);
        when(event.getEventType()).thenReturn(RiskEventType.LIQUIDITY_WARNING);

        var decision = policy.forRiskEvent("한결산업", event, RiskState.NORMAL).orElseThrow();

        assertThat(decision.severity()).isEqualTo(AlertSeverity.WATCH);
        assertThat(decision.message()).doesNotContain("매도", "위험합니다");
    }

    @Test
    void anOrdinaryEventWithoutAStateChangeDoesNotNotify() {
        RiskEvent event = mock(RiskEvent.class);
        when(event.getEventType()).thenReturn(RiskEventType.DEBT_INCREASE);

        assertThat(policy.forRiskEvent("한결산업", event, RiskState.NORMAL)).isEmpty();
    }

    @Test
    void aSelectedEventCanRemainInformationalWhenTheRelatedStateIsNormal() {
        RiskEvent event = mock(RiskEvent.class);
        when(event.getEventType()).thenReturn(RiskEventType.CREDIT_RATING_CHANGE);

        var decision = policy.forRiskEvent("한결산업", event, RiskState.NORMAL).orElseThrow();

        assertThat(decision.severity()).isEqualTo(AlertSeverity.INFO);
    }

    private RiskChange change(RiskState previous, RiskState current) {
        RiskChange change = mock(RiskChange.class);
        when(change.getCategory()).thenReturn(RiskCategory.LIQUIDITY);
        when(change.getPreviousState()).thenReturn(previous);
        when(change.getCurrentState()).thenReturn(current);
        return change;
    }
}
