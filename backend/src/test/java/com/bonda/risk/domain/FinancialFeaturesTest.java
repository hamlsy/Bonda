package com.bonda.risk.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FinancialFeaturesTest {

    @Test
    void calculatesDeterministicRatesAndAbsoluteChanges() {
        FinancialSnapshot previous = snapshot("100", "100", "200", "50", "40");
        FinancialSnapshot current = snapshot("80", "130", "230", "20", "10");

        FinancialFeatures features = FinancialFeatures.calculate(current, previous);

        assertThat(features.cashChangeRate()).isEqualByComparingTo("-0.2");
        assertThat(features.shortTermDebtChangeRate()).isEqualByComparingTo("0.3");
        assertThat(features.totalDebtChangeRate()).isEqualByComparingTo("0.2");
        assertThat(features.operatingCashFlowChange()).isEqualByComparingTo("-30");
        assertThat(features.operatingProfitChange()).isEqualByComparingTo("-30");
    }

    @Test
    void returnsNullRateWhenPreviousValueIsZero() {
        FinancialSnapshot previous = snapshot("0", "0", "0", "0", "0");
        FinancialSnapshot current = snapshot("20", "30", "10", "10", "10");

        FinancialFeatures features = FinancialFeatures.calculate(current, previous);

        assertThat(features.cashChangeRate()).isNull();
        assertThat(features.shortTermDebtChangeRate()).isNull();
        assertThat(features.totalDebtChangeRate()).isNull();
        assertThat(features.operatingCashFlowChangeRate()).isNull();
        assertThat(features.operatingProfitChangeRate()).isNull();
    }

    @Test
    void handlesMissingPreviousPeriodWithoutInventingFeatures() {
        FinancialFeatures features = FinancialFeatures.calculate(
            snapshot("100", "100", "100", "10", "10"),
            null
        );

        assertThat(features.cashChangeRate()).isNull();
        assertThat(features.operatingCashFlowChange()).isNull();
        assertThat(features.operatingCashFlowTurnedNegative()).isFalse();
    }

    @Test
    void comparesNegativeFlowValuesAgainstAbsolutePreviousMagnitude() {
        FinancialSnapshot previous = snapshot("100", "100", "100", "-100", "-50");
        FinancialSnapshot current = snapshot("100", "100", "100", "-150", "-75");

        FinancialFeatures features = FinancialFeatures.calculate(current, previous);

        assertThat(features.operatingCashFlowChangeRate()).isEqualByComparingTo("-0.5");
        assertThat(features.operatingProfitChangeRate()).isEqualByComparingTo("-0.5");
    }

    @Test
    void rejectsNegativeBalanceValuesAndDerivesTotalDebt() {
        assertThatThrownBy(() -> snapshot("-1", "10", "10", "0", "0"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("cash");
        assertThat(snapshot("1", "10", "20", "0", "0").getTotalDebt())
            .isEqualByComparingTo("30");
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
