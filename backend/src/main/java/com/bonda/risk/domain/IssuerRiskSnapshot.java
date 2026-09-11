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

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Objects;

@Entity
@Table(
    name = "issuer_risk_snapshot",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_issuer_risk_snapshot_date_rule",
        columnNames = {"issuer_id", "snapshot_date", "rule_version"}
    )
)
public class IssuerRiskSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issuer_id", nullable = false)
    private Long issuerId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "liquidity_state", nullable = false, length = 16)
    private RiskState liquidityState;

    @Enumerated(EnumType.STRING)
    @Column(name = "cash_flow_state", nullable = false, length = 16)
    private RiskState cashFlowState;

    @Enumerated(EnumType.STRING)
    @Column(name = "leverage_state", nullable = false, length = 16)
    private RiskState leverageState;

    @Enumerated(EnumType.STRING)
    @Column(name = "earnings_state", nullable = false, length = 16)
    private RiskState earningsState;

    @Enumerated(EnumType.STRING)
    @Column(name = "credit_state", nullable = false, length = 16)
    private RiskState creditState;

    @Column(name = "rule_version", nullable = false, length = 50)
    private String ruleVersion;

    @Column(name = "source_financial_snapshot_id")
    private Long sourceFinancialSnapshotId;

    @Column(name = "input_fingerprint", nullable = false, length = 64)
    private String inputFingerprint;

    @Column(name = "decision_trace", nullable = false, columnDefinition = "TEXT")
    private String decisionTrace;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected IssuerRiskSnapshot() {
    }

    private IssuerRiskSnapshot(
        Long issuerId,
        LocalDate snapshotDate,
        String ruleVersion,
        Long sourceFinancialSnapshotId,
        String inputFingerprint,
        String decisionTrace,
        Map<RiskCategory, RiskState> states
    ) {
        this.issuerId = Objects.requireNonNull(issuerId, "issuerId must not be null");
        this.snapshotDate = Objects.requireNonNull(snapshotDate, "snapshotDate must not be null");
        this.ruleVersion = requireText(ruleVersion, "ruleVersion");
        apply(sourceFinancialSnapshotId, inputFingerprint, decisionTrace, states);
    }

    public static IssuerRiskSnapshot create(
        Long issuerId,
        LocalDate snapshotDate,
        String ruleVersion,
        Long sourceFinancialSnapshotId,
        String inputFingerprint,
        String decisionTrace,
        Map<RiskCategory, RiskState> states
    ) {
        return new IssuerRiskSnapshot(
            issuerId,
            snapshotDate,
            ruleVersion,
            sourceFinancialSnapshotId,
            inputFingerprint,
            decisionTrace,
            states
        );
    }

    public void apply(
        Long sourceFinancialSnapshotId,
        String inputFingerprint,
        String decisionTrace,
        Map<RiskCategory, RiskState> states
    ) {
        this.sourceFinancialSnapshotId = sourceFinancialSnapshotId;
        this.inputFingerprint = requireText(inputFingerprint, "inputFingerprint");
        this.decisionTrace = requireText(decisionTrace, "decisionTrace");
        this.liquidityState = requireState(states, RiskCategory.LIQUIDITY);
        this.cashFlowState = requireState(states, RiskCategory.CASH_FLOW);
        this.leverageState = requireState(states, RiskCategory.LEVERAGE);
        this.earningsState = requireState(states, RiskCategory.EARNINGS);
        this.creditState = requireState(states, RiskCategory.CREDIT);
    }

    public RiskState state(RiskCategory category) {
        return switch (category) {
            case LIQUIDITY -> liquidityState;
            case CASH_FLOW -> cashFlowState;
            case LEVERAGE -> leverageState;
            case EARNINGS -> earningsState;
            case CREDIT -> creditState;
        };
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    private static RiskState requireState(Map<RiskCategory, RiskState> states, RiskCategory category) {
        Objects.requireNonNull(states, "states must not be null");
        return Objects.requireNonNull(states.get(category), "state missing for " + category);
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    public Long getId() { return id; }
    public Long getIssuerId() { return issuerId; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
    public RiskState getLiquidityState() { return liquidityState; }
    public RiskState getCashFlowState() { return cashFlowState; }
    public RiskState getLeverageState() { return leverageState; }
    public RiskState getEarningsState() { return earningsState; }
    public RiskState getCreditState() { return creditState; }
    public String getRuleVersion() { return ruleVersion; }
    public Long getSourceFinancialSnapshotId() { return sourceFinancialSnapshotId; }
    public String getInputFingerprint() { return inputFingerprint; }
    public String getDecisionTrace() { return decisionTrace; }
    public Instant getCreatedAt() { return createdAt; }
}
