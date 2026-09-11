package com.bonda.risk.domain;

import java.math.BigDecimal;

public record RiskThresholds(
    BigDecimal cashDecreaseWatchRate,
    BigDecimal shortTermDebtIncreaseWatchRate,
    BigDecimal totalDebtIncreaseWatchRate,
    BigDecimal operatingCashFlowDeteriorationRate,
    BigDecimal operatingProfitDeteriorationRate,
    int eventLookbackDays
) {
    public static RiskThresholds v1() {
        return new RiskThresholds(
            new BigDecimal("-0.20"),
            new BigDecimal("0.20"),
            new BigDecimal("0.20"),
            new BigDecimal("-0.30"),
            new BigDecimal("-0.30"),
            180
        );
    }
}
