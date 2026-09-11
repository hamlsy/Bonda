package com.bonda.sincebought.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "since_bought_explanation")
public class SinceBoughtExplanation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "holding_id", nullable = false)
    private Long holdingId;

    @Column(name = "input_fingerprint", nullable = false, unique = true, length = 64)
    private String inputFingerprint;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "prompt_version", nullable = false, length = 50)
    private String promptVersion;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "related_event_ids", nullable = false, columnDefinition = "TEXT")
    private String relatedEventIds;

    @Column(name = "related_risk_change_ids", nullable = false, columnDefinition = "TEXT")
    private String relatedRiskChangeIds;

    @Column(name = "input_tokens")
    private Integer inputTokens;

    @Column(name = "output_tokens")
    private Integer outputTokens;

    @Column(name = "latency_ms", nullable = false)
    private Long latencyMs;

    @Column(name = "estimated_cost", precision = 18, scale = 8)
    private BigDecimal estimatedCost;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected SinceBoughtExplanation() {
    }

    private SinceBoughtExplanation(
        Long holdingId,
        String inputFingerprint,
        String model,
        String promptVersion,
        String summary,
        String relatedEventIds,
        String relatedRiskChangeIds,
        Integer inputTokens,
        Integer outputTokens,
        long latencyMs,
        BigDecimal estimatedCost
    ) {
        this.holdingId = Objects.requireNonNull(holdingId, "holdingId must not be null");
        this.inputFingerprint = requireText(inputFingerprint, "inputFingerprint");
        this.model = requireText(model, "model");
        this.promptVersion = requireText(promptVersion, "promptVersion");
        this.summary = requireText(summary, "summary");
        this.relatedEventIds = Objects.requireNonNull(relatedEventIds, "relatedEventIds must not be null");
        this.relatedRiskChangeIds = Objects.requireNonNull(
            relatedRiskChangeIds,
            "relatedRiskChangeIds must not be null"
        );
        this.inputTokens = inputTokens;
        this.outputTokens = outputTokens;
        if (latencyMs < 0) {
            throw new IllegalArgumentException("latencyMs must not be negative");
        }
        this.latencyMs = latencyMs;
        this.estimatedCost = estimatedCost;
    }

    public static SinceBoughtExplanation create(
        Long holdingId,
        String inputFingerprint,
        String model,
        String promptVersion,
        String summary,
        String relatedEventIds,
        String relatedRiskChangeIds,
        Integer inputTokens,
        Integer outputTokens,
        long latencyMs,
        BigDecimal estimatedCost
    ) {
        return new SinceBoughtExplanation(
            holdingId,
            inputFingerprint,
            model,
            promptVersion,
            summary,
            relatedEventIds,
            relatedRiskChangeIds,
            inputTokens,
            outputTokens,
            latencyMs,
            estimatedCost
        );
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    public Long getId() { return id; }
    public Long getHoldingId() { return holdingId; }
    public String getInputFingerprint() { return inputFingerprint; }
    public String getModel() { return model; }
    public String getPromptVersion() { return promptVersion; }
    public String getSummary() { return summary; }
    public String getRelatedEventIds() { return relatedEventIds; }
    public String getRelatedRiskChangeIds() { return relatedRiskChangeIds; }
    public Integer getInputTokens() { return inputTokens; }
    public Integer getOutputTokens() { return outputTokens; }
    public Long getLatencyMs() { return latencyMs; }
    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public Instant getCreatedAt() { return createdAt; }
}
