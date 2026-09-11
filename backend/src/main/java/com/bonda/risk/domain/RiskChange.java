package com.bonda.risk.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
    name = "risk_change",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_risk_change_current_category",
        columnNames = {"current_snapshot_id", "category"}
    )
)
public class RiskChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issuer_id", nullable = false)
    private Long issuerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RiskCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_state", nullable = false, length = 16)
    private RiskState previousState;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false, length = 16)
    private RiskState currentState;

    @Column(name = "previous_snapshot_id")
    private Long previousSnapshotId;

    @Column(name = "current_snapshot_id", nullable = false)
    private Long currentSnapshotId;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @Column(name = "rule_version", nullable = false, length = 50)
    private String ruleVersion;

    protected RiskChange() {
    }

    private RiskChange(
        Long issuerId,
        RiskCategory category,
        RiskState previousState,
        RiskState currentState,
        Long previousSnapshotId,
        Long currentSnapshotId,
        Instant detectedAt,
        String ruleVersion
    ) {
        this.issuerId = Objects.requireNonNull(issuerId, "issuerId must not be null");
        this.category = Objects.requireNonNull(category, "category must not be null");
        this.currentSnapshotId = Objects.requireNonNull(currentSnapshotId, "currentSnapshotId must not be null");
        apply(previousState, currentState, previousSnapshotId, detectedAt, ruleVersion);
    }

    public static RiskChange create(
        Long issuerId,
        RiskCategory category,
        RiskState previousState,
        RiskState currentState,
        Long previousSnapshotId,
        Long currentSnapshotId,
        Instant detectedAt,
        String ruleVersion
    ) {
        return new RiskChange(
            issuerId,
            category,
            previousState,
            currentState,
            previousSnapshotId,
            currentSnapshotId,
            detectedAt,
            ruleVersion
        );
    }

    public void apply(
        RiskState previousState,
        RiskState currentState,
        Long previousSnapshotId,
        Instant detectedAt,
        String ruleVersion
    ) {
        this.previousState = Objects.requireNonNull(previousState, "previousState must not be null");
        this.currentState = Objects.requireNonNull(currentState, "currentState must not be null");
        if (previousState == currentState) {
            throw new IllegalArgumentException("RiskChange requires an actual state transition");
        }
        this.previousSnapshotId = previousSnapshotId;
        this.detectedAt = Objects.requireNonNull(detectedAt, "detectedAt must not be null");
        this.ruleVersion = requireText(ruleVersion, "ruleVersion");
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    public Long getId() { return id; }
    public Long getIssuerId() { return issuerId; }
    public RiskCategory getCategory() { return category; }
    public RiskState getPreviousState() { return previousState; }
    public RiskState getCurrentState() { return currentState; }
    public Long getPreviousSnapshotId() { return previousSnapshotId; }
    public Long getCurrentSnapshotId() { return currentSnapshotId; }
    public Instant getDetectedAt() { return detectedAt; }
    public String getRuleVersion() { return ruleVersion; }
}
