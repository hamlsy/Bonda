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
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.Objects;

@Entity
@Table(name = "candidate_risk_event")
public class CandidateRiskEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "analysis_run_id", nullable = false)
    private Long analysisRunId;

    @Column(name = "issuer_id", nullable = false)
    private Long issuerId;

    @Column(name = "disclosure_version_id", nullable = false)
    private Long disclosureVersionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private RiskEventType eventType;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(precision = 30, scale = 4)
    private BigDecimal amount;

    @Column(length = 10)
    private String currency;

    @Column(length = 100)
    private String purpose;

    @Column(name = "evidence_text", nullable = false, columnDefinition = "TEXT")
    private String evidenceText;

    @Column(name = "extraction_reason", columnDefinition = "TEXT")
    private String extractionReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(nullable = false, unique = true, length = 64)
    private String fingerprint;

    @Column(name = "validation_reason", columnDefinition = "TEXT")
    private String validationReason;

    @Column(name = "validation_rule_version", length = 50)
    private String validationRuleVersion;

    @Column(name = "validated_at")
    private Instant validatedAt;

    @Column(name = "canonical_risk_event_id")
    private Long canonicalRiskEventId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CandidateRiskEvent() {
    }

    private CandidateRiskEvent(
        Long analysisRunId,
        Long issuerId,
        Long disclosureVersionId,
        RiskEventType eventType,
        LocalDate eventDate,
        BigDecimal amount,
        String currency,
        String purpose,
        String evidenceText,
        String extractionReason
    ) {
        this.analysisRunId = Objects.requireNonNull(analysisRunId, "analysisRunId must not be null");
        this.issuerId = Objects.requireNonNull(issuerId, "issuerId must not be null");
        this.disclosureVersionId = Objects.requireNonNull(
            disclosureVersionId,
            "disclosureVersionId must not be null"
        );
        this.eventType = Objects.requireNonNull(eventType, "eventType must not be null");
        this.eventDate = eventDate;
        this.amount = amount;
        this.currency = trimToNull(currency);
        this.purpose = trimToNull(purpose);
        this.evidenceText = requireText(evidenceText, "evidenceText");
        this.extractionReason = trimToNull(extractionReason);
        this.status = Status.PENDING;
        this.fingerprint = fingerprint(
            issuerId,
            disclosureVersionId,
            eventType,
            eventDate,
            amount,
            this.evidenceText
        );
    }

    public static CandidateRiskEvent create(
        Long analysisRunId,
        Long issuerId,
        Long disclosureVersionId,
        RiskEventType eventType,
        LocalDate eventDate,
        BigDecimal amount,
        String currency,
        String purpose,
        String evidenceText,
        String extractionReason
    ) {
        return new CandidateRiskEvent(
            analysisRunId,
            issuerId,
            disclosureVersionId,
            eventType,
            eventDate,
            amount,
            currency,
            purpose,
            evidenceText,
            extractionReason
        );
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void verify(
        Long canonicalRiskEventId,
        String validationReason,
        String validationRuleVersion,
        Instant validatedAt
    ) {
        requirePending();
        this.status = Status.VERIFIED;
        this.canonicalRiskEventId = Objects.requireNonNull(
            canonicalRiskEventId,
            "canonicalRiskEventId must not be null"
        );
        this.validationReason = requireText(validationReason, "validationReason");
        this.validationRuleVersion = requireText(validationRuleVersion, "validationRuleVersion");
        this.validatedAt = Objects.requireNonNull(validatedAt, "validatedAt must not be null");
    }

    public void reject(String validationReason, String validationRuleVersion, Instant validatedAt) {
        requirePending();
        this.status = Status.REJECTED;
        this.validationReason = requireText(validationReason, "validationReason");
        this.validationRuleVersion = requireText(validationRuleVersion, "validationRuleVersion");
        this.validatedAt = Objects.requireNonNull(validatedAt, "validatedAt must not be null");
    }

    private void requirePending() {
        if (status != Status.PENDING) {
            throw new IllegalStateException("CandidateRiskEvent status must be PENDING but was " + status);
        }
    }

    private static String fingerprint(
        Long issuerId,
        Long disclosureVersionId,
        RiskEventType eventType,
        LocalDate eventDate,
        BigDecimal amount,
        String evidenceText
    ) {
        String normalizedAmount = amount == null ? "" : amount.stripTrailingZeros().toPlainString();
        String normalizedEvidence = evidenceText.replaceAll("\\s+", " ").trim();
        String value = issuerId + "|" + disclosureVersionId + "|" + eventType + "|"
            + Objects.toString(eventDate, "") + "|" + normalizedAmount + "|" + normalizedEvidence;
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public enum Status {
        PENDING,
        VERIFIED,
        REJECTED,
        SUPERSEDED
    }

    public Long getId() {
        return id;
    }

    public Long getAnalysisRunId() {
        return analysisRunId;
    }

    public Long getIssuerId() {
        return issuerId;
    }

    public Long getDisclosureVersionId() {
        return disclosureVersionId;
    }

    public RiskEventType getEventType() {
        return eventType;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getPurpose() {
        return purpose;
    }

    public String getEvidenceText() {
        return evidenceText;
    }

    public String getExtractionReason() {
        return extractionReason;
    }

    public Status getStatus() {
        return status;
    }

    public String getFingerprint() {
        return fingerprint;
    }

    public String getValidationReason() {
        return validationReason;
    }

    public String getValidationRuleVersion() {
        return validationRuleVersion;
    }

    public Instant getValidatedAt() {
        return validatedAt;
    }

    public Long getCanonicalRiskEventId() {
        return canonicalRiskEventId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
