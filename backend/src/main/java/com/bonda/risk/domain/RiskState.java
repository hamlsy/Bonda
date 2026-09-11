package com.bonda.risk.domain;

public enum RiskState {
    NORMAL,
    WATCH,
    CAUTION;

    public static RiskState max(RiskState left, RiskState right) {
        return left.ordinal() >= right.ordinal() ? left : right;
    }
}
