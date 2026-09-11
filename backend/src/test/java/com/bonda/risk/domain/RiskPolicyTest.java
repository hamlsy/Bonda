package com.bonda.risk.domain;

import com.bonda.ai.domain.RiskEventType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RiskPolicyTest {

    private static final LocalDate AS_OF = LocalDate.of(2026, 9, 30);
    private final RiskPolicy policy = new RiskPolicy(RiskThresholds.v1());

    @Test
    void noSignalProducesOnlyNormalStates() {
        RiskPolicy.PolicyResult result = policy.evaluate(
            AS_OF,
            snapshot("100", "100", "100", "100", "100"),
            snapshot("100", "100", "100", "100", "100"),
            List.of()
        );

        assertThat(result.decisions()).allMatch(decision -> decision.state() == RiskState.NORMAL);
        assertThat(result.ruleVersion()).isEqualTo("RISK_POLICY_V1");
    }

    @Test
    void shortTermDebtIncreaseAndCashDecreaseProduceLiquidityWatch() {
        RiskPolicy.PolicyResult result = policy.evaluate(
            AS_OF,
            snapshot("75", "130", "100", "100", "100"),
            snapshot("100", "100", "100", "100", "100"),
            List.of()
        );

        assertThat(result.decision(RiskCategory.LIQUIDITY).state()).isEqualTo(RiskState.WATCH);
        assertThat(result.decision(RiskCategory.LIQUIDITY).reasons())
            .contains("SHORT_TERM_DEBT_UP_AND_CASH_DOWN");
    }

    @Test
    void liquidityWarningIsAStandaloneStrongSignal() {
        RiskPolicy.PolicyResult result = policy.evaluate(
            AS_OF,
            null,
            null,
            List.of(signal(1L, RiskEventType.LIQUIDITY_WARNING, "유동성 부족이 발생했습니다."))
        );

        assertThat(result.decision(RiskCategory.LIQUIDITY).state()).isEqualTo(RiskState.CAUTION);
        assertThat(result.decision(RiskCategory.LIQUIDITY).sourceEventIds()).containsExactly(1L);
    }

    @Test
    void operatingCashFlowDeteriorationProducesCashFlowWatch() {
        RiskPolicy.PolicyResult result = policy.evaluate(
            AS_OF,
            snapshot("100", "100", "100", "60", "100"),
            snapshot("100", "100", "100", "100", "100"),
            List.of()
        );

        assertThat(result.decision(RiskCategory.CASH_FLOW).state()).isEqualTo(RiskState.WATCH);
    }

    @Test
    void explicitRatingDowngradeProducesCreditCaution() {
        RiskPolicy.PolicyResult result = policy.evaluate(
            AS_OF,
            null,
            null,
            List.of(signal(2L, RiskEventType.CREDIT_RATING_CHANGE, "신용등급이 A에서 BBB로 하향되었습니다."))
        );

        assertThat(result.decision(RiskCategory.CREDIT).state()).isEqualTo(RiskState.CAUTION);
        assertThat(result.decision(RiskCategory.CREDIT).reasons()).contains("CREDIT_RATING_DOWNGRADE");
    }

    @Test
    void improvedFinancialSignalsReturnToNormal() {
        RiskPolicy.PolicyResult result = policy.evaluate(
            AS_OF,
            snapshot("120", "80", "80", "120", "120"),
            snapshot("100", "100", "100", "100", "100"),
            List.of()
        );

        assertThat(result.decision(RiskCategory.LIQUIDITY).state()).isEqualTo(RiskState.NORMAL);
        assertThat(result.decision(RiskCategory.CASH_FLOW).state()).isEqualTo(RiskState.NORMAL);
        assertThat(result.decision(RiskCategory.LEVERAGE).state()).isEqualTo(RiskState.NORMAL);
        assertThat(result.decision(RiskCategory.EARNINGS).state()).isEqualTo(RiskState.NORMAL);
    }

    @Test
    void eventsOutsideLookbackDoNotAffectCurrentState() {
        RiskPolicy.EventSignal oldWarning = new RiskPolicy.EventSignal(
            3L,
            RiskEventType.LIQUIDITY_WARNING,
            AS_OF.minusDays(181),
            "유동성 부족"
        );

        assertThat(policy.evaluate(AS_OF, null, null, List.of(oldWarning))
            .decision(RiskCategory.LIQUIDITY).state()).isEqualTo(RiskState.NORMAL);
    }

    private RiskPolicy.EventSignal signal(Long id, RiskEventType type, String evidence) {
        return new RiskPolicy.EventSignal(id, type, AS_OF.minusDays(1), evidence);
    }

    private FinancialSnapshot snapshot(
        String cash,
        String shortDebt,
        String longDebt,
        String operatingCashFlow,
        String operatingProfit
    ) {
        return FinancialSnapshot.create(
            1L,
            "2026-Q2",
            LocalDate.of(2026, 6, 30),
            new BigDecimal(cash),
            new BigDecimal(shortDebt),
            new BigDecimal(longDebt),
            new BigDecimal(operatingCashFlow),
            new BigDecimal(operatingProfit),
            null,
            null
        );
    }
}
