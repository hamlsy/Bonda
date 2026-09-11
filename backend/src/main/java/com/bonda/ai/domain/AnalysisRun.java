package com.bonda.ai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Objects;

@Entity
@Table(name = "analysis_run")
public class AnalysisRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disclosure_version_id", nullable = false)
    private Long disclosureVersionId;

    @Column(name = "document_hash", nullable = false, length = 64)
    private String documentHash;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "prompt_version", nullable = false, length = 50)
    private String promptVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "input_tokens")
    private Integer inputTokens;

    @Column(name = "output_tokens")
    private Integer outputTokens;

    @Column(name = "latency_ms")
    private Long latencyMs;

    @Column(name = "estimated_cost", precision = 18, scale = 8)
    private BigDecimal estimatedCost;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "error_type", length = 50)
    private String errorType;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "success_key", unique = true, length = 64)
    private String successKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AnalysisRun() {
    }

    private AnalysisRun(Long disclosureVersionId, String documentHash, String model, String promptVersion) {
        this.disclosureVersionId = Objects.requireNonNull(
            disclosureVersionId,
            "disclosureVersionId must not be null"
        );
        this.documentHash = requireText(documentHash, "documentHash");
        this.model = requireText(model, "model");
        this.promptVersion = requireText(promptVersion, "promptVersion");
        this.status = Status.PENDING;
    }

    public static AnalysisRun create(
        Long disclosureVersionId,
        String documentHash,
        String model,
        String promptVersion
    ) {
        return new AnalysisRun(disclosureVersionId, documentHash, model, promptVersion);
    }

    public void markProcessing(Instant startedAt) {
        requireStatus(Status.PENDING);
        this.status = Status.PROCESSING;
        this.startedAt = Objects.requireNonNull(startedAt, "startedAt must not be null");
    }

    public void markSuccess(
        Integer inputTokens,
        Integer outputTokens,
        long latencyMs,
        BigDecimal estimatedCost,
        int retryCount,
        Instant completedAt
    ) {
        requireStatus(Status.PROCESSING);
        validateMetrics(inputTokens, outputTokens, latencyMs, retryCount);
        this.status = Status.SUCCESS;
        this.inputTokens = inputTokens;
        this.outputTokens = outputTokens;
        this.latencyMs = latencyMs;
        this.estimatedCost = estimatedCost;
        this.retryCount = retryCount;
        this.completedAt = Objects.requireNonNull(completedAt, "completedAt must not be null");
        this.successKey = sha256(documentHash + "|" + model + "|" + promptVersion);
    }

    public void markFailed(
        String errorType,
        String errorMessage,
        long latencyMs,
        int retryCount,
        Instant completedAt
    ) {
        if (status != Status.PENDING && status != Status.PROCESSING) {
            throw new IllegalStateException("AnalysisRun cannot fail from status " + status);
        }
        validateMetrics(null, null, latencyMs, retryCount);
        this.status = Status.FAILED;
        this.errorType = requireText(errorType, "errorType");
        this.errorMessage = truncate(requireText(errorMessage, "errorMessage"), 1000);
        this.latencyMs = latencyMs;
        this.retryCount = retryCount;
        this.completedAt = Objects.requireNonNull(completedAt, "completedAt must not be null");
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    private void requireStatus(Status expected) {
        if (status != expected) {
            throw new IllegalStateException("AnalysisRun status must be " + expected + " but was " + status);
        }
    }

    private void validateMetrics(Integer inputTokens, Integer outputTokens, long latencyMs, int retryCount) {
        if (inputTokens != null && inputTokens < 0) {
            throw new IllegalArgumentException("inputTokens must not be negative");
        }
        if (outputTokens != null && outputTokens < 0) {
            throw new IllegalArgumentException("outputTokens must not be negative");
        }
        if (latencyMs < 0 || retryCount < 0) {
            throw new IllegalArgumentException("latencyMs and retryCount must not be negative");
        }
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    private static String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public enum Status {
        PENDING,
        PROCESSING,
        SUCCESS,
        FAILED
    }

    public Long getId() {
        return id;
    }

    public Long getDisclosureVersionId() {
        return disclosureVersionId;
    }

    public String getDocumentHash() {
        return documentHash;
    }

    public String getModel() {
        return model;
    }

    public String getPromptVersion() {
        return promptVersion;
    }

    public Status getStatus() {
        return status;
    }

    public Integer getInputTokens() {
        return inputTokens;
    }

    public Integer getOutputTokens() {
        return outputTokens;
    }

    public Long getLatencyMs() {
        return latencyMs;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public String getErrorType() {
        return errorType;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
