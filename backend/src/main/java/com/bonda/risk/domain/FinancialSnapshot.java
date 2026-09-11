package com.bonda.risk.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(
    name = "financial_snapshot",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_financial_snapshot_period_scope",
        columnNames = {"issuer_id", "period", "statement_scope"}
    )
)
public class FinancialSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issuer_id", nullable = false)
    private Long issuerId;

    @Column(nullable = false, length = 20)
    private String period;

    @Column(name = "statement_date", nullable = false)
    private LocalDate statementDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "statement_scope", nullable = false, length = 20)
    private StatementScope statementScope;

    @Column(nullable = false, precision = 30, scale = 4)
    private BigDecimal cash;

    @Column(name = "short_term_debt", nullable = false, precision = 30, scale = 4)
    private BigDecimal shortTermDebt;

    @Column(name = "long_term_debt", nullable = false, precision = 30, scale = 4)
    private BigDecimal longTermDebt;

    @Column(name = "total_debt", nullable = false, precision = 30, scale = 4)
    private BigDecimal totalDebt;

    @Column(name = "operating_cash_flow", nullable = false, precision = 30, scale = 4)
    private BigDecimal operatingCashFlow;

    @Column(name = "operating_profit", nullable = false, precision = 30, scale = 4)
    private BigDecimal operatingProfit;

    @Column(name = "total_assets", precision = 30, scale = 4)
    private BigDecimal totalAssets;

    @Column(name = "total_liabilities", precision = 30, scale = 4)
    private BigDecimal totalLiabilities;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected FinancialSnapshot() {
    }

    private FinancialSnapshot(
        Long issuerId,
        String period,
        LocalDate statementDate,
        BigDecimal cash,
        BigDecimal shortTermDebt,
        BigDecimal longTermDebt,
        BigDecimal operatingCashFlow,
        BigDecimal operatingProfit,
        BigDecimal totalAssets,
        BigDecimal totalLiabilities
    ) {
        this.issuerId = Objects.requireNonNull(issuerId, "issuerId must not be null");
        this.period = requireText(period, "period");
        this.statementDate = Objects.requireNonNull(statementDate, "statementDate must not be null");
        this.statementScope = StatementScope.CONSOLIDATED;
        this.cash = requireNonNegative(cash, "cash");
        this.shortTermDebt = requireNonNegative(shortTermDebt, "shortTermDebt");
        this.longTermDebt = requireNonNegative(longTermDebt, "longTermDebt");
        this.totalDebt = this.shortTermDebt.add(this.longTermDebt);
        this.operatingCashFlow = Objects.requireNonNull(operatingCashFlow, "operatingCashFlow must not be null");
        this.operatingProfit = Objects.requireNonNull(operatingProfit, "operatingProfit must not be null");
        this.totalAssets = optionalNonNegative(totalAssets, "totalAssets");
        this.totalLiabilities = optionalNonNegative(totalLiabilities, "totalLiabilities");
    }

    public static FinancialSnapshot create(
        Long issuerId,
        String period,
        LocalDate statementDate,
        BigDecimal cash,
        BigDecimal shortTermDebt,
        BigDecimal longTermDebt,
        BigDecimal operatingCashFlow,
        BigDecimal operatingProfit,
        BigDecimal totalAssets,
        BigDecimal totalLiabilities
    ) {
        return new FinancialSnapshot(
            issuerId,
            period,
            statementDate,
            cash,
            shortTermDebt,
            longTermDebt,
            operatingCashFlow,
            operatingProfit,
            totalAssets,
            totalLiabilities
        );
    }

    public boolean hasSameValues(FinancialSnapshot other) {
        return issuerId.equals(other.issuerId)
            && period.equals(other.period)
            && statementDate.equals(other.statementDate)
            && statementScope == other.statementScope
            && equalNumber(cash, other.cash)
            && equalNumber(shortTermDebt, other.shortTermDebt)
            && equalNumber(longTermDebt, other.longTermDebt)
            && equalNumber(operatingCashFlow, other.operatingCashFlow)
            && equalNumber(operatingProfit, other.operatingProfit)
            && equalNullableNumber(totalAssets, other.totalAssets)
            && equalNullableNumber(totalLiabilities, other.totalLiabilities);
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    private static BigDecimal requireNonNegative(BigDecimal value, String field) {
        Objects.requireNonNull(value, field + " must not be null");
        if (value.signum() < 0) {
            throw new IllegalArgumentException(field + " must not be negative");
        }
        return value;
    }

    private static BigDecimal optionalNonNegative(BigDecimal value, String field) {
        return value == null ? null : requireNonNegative(value, field);
    }

    private static boolean equalNumber(BigDecimal left, BigDecimal right) {
        return left.compareTo(right) == 0;
    }

    private static boolean equalNullableNumber(BigDecimal left, BigDecimal right) {
        return left == null ? right == null : right != null && left.compareTo(right) == 0;
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    public enum StatementScope {
        CONSOLIDATED
    }

    public Long getId() { return id; }
    public Long getIssuerId() { return issuerId; }
    public String getPeriod() { return period; }
    public LocalDate getStatementDate() { return statementDate; }
    public StatementScope getStatementScope() { return statementScope; }
    public BigDecimal getCash() { return cash; }
    public BigDecimal getShortTermDebt() { return shortTermDebt; }
    public BigDecimal getLongTermDebt() { return longTermDebt; }
    public BigDecimal getTotalDebt() { return totalDebt; }
    public BigDecimal getOperatingCashFlow() { return operatingCashFlow; }
    public BigDecimal getOperatingProfit() { return operatingProfit; }
    public BigDecimal getTotalAssets() { return totalAssets; }
    public BigDecimal getTotalLiabilities() { return totalLiabilities; }
    public Instant getCreatedAt() { return createdAt; }
}
