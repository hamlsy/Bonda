package com.bonda.ai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "risk_event_evidence")
public class RiskEventEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "risk_event_id", nullable = false)
    private Long riskEventId;

    @Column(name = "disclosure_version_id", nullable = false)
    private Long disclosureVersionId;

    @Column(length = 500)
    private String section;

    @Column(name = "evidence_text", nullable = false, columnDefinition = "TEXT")
    private String evidenceText;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RiskEventEvidence() {
    }

    private RiskEventEvidence(
        Long riskEventId,
        Long disclosureVersionId,
        String section,
        String evidenceText,
        String sourceUrl
    ) {
        this.riskEventId = Objects.requireNonNull(riskEventId, "riskEventId must not be null");
        this.disclosureVersionId = Objects.requireNonNull(
            disclosureVersionId,
            "disclosureVersionId must not be null"
        );
        this.section = trimToNull(section);
        this.evidenceText = requireText(evidenceText, "evidenceText");
        this.sourceUrl = trimToNull(sourceUrl);
    }

    public static RiskEventEvidence create(
        Long riskEventId,
        Long disclosureVersionId,
        String section,
        String evidenceText,
        String sourceUrl
    ) {
        return new RiskEventEvidence(riskEventId, disclosureVersionId, section, evidenceText, sourceUrl);
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

    public Long getId() {
        return id;
    }

    public Long getRiskEventId() {
        return riskEventId;
    }

    public Long getDisclosureVersionId() {
        return disclosureVersionId;
    }

    public String getSection() {
        return section;
    }

    public String getEvidenceText() {
        return evidenceText;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
