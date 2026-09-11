package com.bonda.risk.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record FinancialFeatures(
    BigDecimal cashChangeRate,
    BigDecimal shortTermDebtChangeRate,
    BigDecimal totalDebtChangeRate,
    BigDecimal operatingCashFlowChange,
    BigDecimal operatingCashFlowChangeRate,
    BigDecimal operatingProfitChange,
    BigDecimal operatingProfitChangeRate,
    boolean operatingCashFlowTurnedNegative,
    boolean operatingProfitTurnedNegative
) {
    private static final int RATE_SCALE = 8;

    public static FinancialFeatures calculate(FinancialSnapshot current, FinancialSnapshot previous) {
        if (current == null) {
            throw new IllegalArgumentException("current FinancialSnapshot must not be null");
        }
        if (previous == null) {
            return new FinancialFeatures(null, null, null, null, null, null, null, false, false);
        }
        return new FinancialFeatures(
            changeRate(current.getCash(), previous.getCash()),
            changeRate(current.getShortTermDebt(), previous.getShortTermDebt()),
            changeRate(current.getTotalDebt(), previous.getTotalDebt()),
            difference(current.getOperatingCashFlow(), previous.getOperatingCashFlow()),
            signedChangeRate(current.getOperatingCashFlow(), previous.getOperatingCashFlow()),
            difference(current.getOperatingProfit(), previous.getOperatingProfit()),
            signedChangeRate(current.getOperatingProfit(), previous.getOperatingProfit()),
            previous.getOperatingCashFlow().signum() > 0 && current.getOperatingCashFlow().signum() < 0,
            previous.getOperatingProfit().signum() >= 0 && current.getOperatingProfit().signum() < 0
        );
    }

    private static BigDecimal difference(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null) {
            return null;
        }
        return current.subtract(previous);
    }

    private static BigDecimal changeRate(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null || previous.signum() <= 0 || current.signum() < 0) {
            return null;
        }
        return current.subtract(previous).divide(previous, RATE_SCALE, RoundingMode.HALF_UP);
    }

    private static BigDecimal signedChangeRate(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null || previous.signum() == 0) {
            return null;
        }
        return current.subtract(previous).divide(previous.abs(), RATE_SCALE, RoundingMode.HALF_UP);
    }
}
