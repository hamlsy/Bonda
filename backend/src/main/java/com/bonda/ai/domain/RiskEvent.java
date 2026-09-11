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
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "risk_event")
public class RiskEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issuer_id", nullable = false)
    private Long issuerId;

    @Column(name = "disclosure_version_id", nullable = false)
    private Long disclosureVersionId;

    @Column(name = "candidate_risk_event_id", nullable = false, unique = true)
    private Long candidateRiskEventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private RiskEventType eventType;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Category category;

    @Column(precision = 30, scale = 4)
    private BigDecimal amount;

    @Column(length = 10)
    private String currency;

    @Column(length = 100)
    private String purpose;

    @Column(name = "event_fingerprint", nullable = false, unique = true, length = 64)
    private String eventFingerprint;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RiskEvent() {
    }

    private RiskEvent(
        Long issuerId,
        Long disclosureVersionId,
        Long candidateRiskEventId,
        RiskEventType eventType,
        LocalDate eventDate,
        Category category,
        BigDecimal amount,
        String currency,
        String purpose,
        String eventFingerprint
    ) {
        this.issuerId = Objects.requireNonNull(issuerId, "issuerId must not be null");
        this.disclosureVersionId = Objects.requireNonNull(
            disclosureVersionId,
            "disclosureVersionId must not be null"
        );
        this.candidateRiskEventId = Objects.requireNonNull(
            candidateRiskEventId,
            "candidateRiskEventId must not be null"
        );
        this.eventType = Objects.requireNonNull(eventType, "eventType must not be null");
        this.eventDate = eventDate;
        this.category = Objects.requireNonNull(category, "category must not be null");
        this.amount = amount;
        this.currency = trimToNull(currency);
        this.purpose = trimToNull(purpose);
        this.eventFingerprint = requireText(eventFingerprint, "eventFingerprint");
    }

    public static RiskEvent create(
        Long issuerId,
        Long disclosureVersionId,
        Long candidateRiskEventId,
        RiskEventType eventType,
        LocalDate eventDate,
        BigDecimal amount,
        String currency,
        String purpose,
        String eventFingerprint
    ) {
        return new RiskEvent(
            issuerId,
            disclosureVersionId,
            candidateRiskEventId,
            eventType,
            eventDate,
            categoryOf(eventType),
            amount,
            currency,
            purpose,
            eventFingerprint
        );
    }

    private static Category categoryOf(RiskEventType eventType) {
        return switch (eventType) {
            case DEBT_INCREASE -> Category.LEVERAGE;
            case CASH_DECREASE, LIQUIDITY_WARNING -> Category.LIQUIDITY;
            case OPERATING_LOSS -> Category.PROFITABILITY;
            case CREDIT_RATING_CHANGE -> Category.CREDIT_QUALITY;
            case GUARANTEE_INCREASE -> Category.CONTINGENT_LIABILITY;
        };
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

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public enum Category {
        LEVERAGE,
        LIQUIDITY,
        PROFITABILITY,
        CREDIT_QUALITY,
        CONTINGENT_LIABILITY
    }

    public Long getId() {
        return id;
    }

    public Long getIssuerId() {
        return issuerId;
    }

    public Long getDisclosureVersionId() {
        return disclosureVersionId;
    }

    public Long getCandidateRiskEventId() {
        return candidateRiskEventId;
    }

    public RiskEventType getEventType() {
        return eventType;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public Category getCategory() {
        return category;
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

    public String getEventFingerprint() {
        return eventFingerprint;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
