package com.bonda.disclosure.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
    name = "disclosure_version",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_disclosure_version_number",
            columnNames = {"disclosure_id", "version_number"}
        ),
        @UniqueConstraint(
            name = "uq_disclosure_version_hash",
            columnNames = {"disclosure_id", "document_hash"}
        )
    }
)
public class DisclosureVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disclosure_id", nullable = false)
    private Long disclosureId;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "source_receipt_no", nullable = false, length = 14)
    private String sourceReceiptNo;

    @Column(name = "document_hash", nullable = false, length = 64)
    private String documentHash;

    @Column(name = "raw_content", nullable = false, columnDefinition = "TEXT")
    private String rawContent;

    @Column(name = "normalized_content", columnDefinition = "TEXT")
    private String normalizedContent;

    @Column(name = "pre_filter_decision", length = 16)
    private String preFilterDecision;

    @Column(name = "pre_filter_matched_rules", columnDefinition = "TEXT")
    private String preFilterMatchedRules;

    @Column(name = "pre_filter_matched_keywords", columnDefinition = "TEXT")
    private String preFilterMatchedKeywords;

    @Column(name = "pre_filter_target_sections", columnDefinition = "TEXT")
    private String preFilterTargetSections;

    @Column(name = "pre_filter_evaluated_at")
    private Instant preFilterEvaluatedAt;

    @Column(name = "pre_filter_rule_version", length = 50)
    private String preFilterRuleVersion;

    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected DisclosureVersion() {
    }

    private DisclosureVersion(
        Long disclosureId,
        int versionNumber,
        String sourceReceiptNo,
        String documentHash,
        String rawContent,
        String normalizedContent,
        String preFilterDecision,
        String preFilterMatchedRules,
        String preFilterMatchedKeywords,
        String preFilterTargetSections,
        Instant preFilterEvaluatedAt,
        String preFilterRuleVersion,
        Instant publishedAt
    ) {
        if (versionNumber < 1) {
            throw new IllegalArgumentException("versionNumber must be positive");
        }
        this.disclosureId = Objects.requireNonNull(disclosureId, "disclosureId must not be null");
        this.versionNumber = versionNumber;
        this.sourceReceiptNo = requireText(sourceReceiptNo, "sourceReceiptNo");
        this.documentHash = requireText(documentHash, "documentHash");
        requireText(rawContent, "rawContent");
        this.rawContent = rawContent;
        this.normalizedContent = requireText(normalizedContent, "normalizedContent");
        this.preFilterDecision = requireText(preFilterDecision, "preFilterDecision");
        this.preFilterMatchedRules = Objects.requireNonNull(preFilterMatchedRules, "preFilterMatchedRules must not be null");
        this.preFilterMatchedKeywords = Objects.requireNonNull(
            preFilterMatchedKeywords,
            "preFilterMatchedKeywords must not be null"
        );
        this.preFilterTargetSections = Objects.requireNonNull(
            preFilterTargetSections,
            "preFilterTargetSections must not be null"
        );
        this.preFilterEvaluatedAt = Objects.requireNonNull(
            preFilterEvaluatedAt,
            "preFilterEvaluatedAt must not be null"
        );
        this.preFilterRuleVersion = requireText(preFilterRuleVersion, "preFilterRuleVersion");
        this.publishedAt = Objects.requireNonNull(publishedAt, "publishedAt must not be null");
    }

    public static DisclosureVersion create(
        Long disclosureId,
        int versionNumber,
        String sourceReceiptNo,
        String documentHash,
        String rawContent,
        String normalizedContent,
        String preFilterDecision,
        String preFilterMatchedRules,
        String preFilterMatchedKeywords,
        String preFilterTargetSections,
        Instant preFilterEvaluatedAt,
        String preFilterRuleVersion,
        Instant publishedAt
    ) {
        return new DisclosureVersion(
            disclosureId,
            versionNumber,
            sourceReceiptNo,
            documentHash,
            rawContent,
            normalizedContent,
            preFilterDecision,
            preFilterMatchedRules,
            preFilterMatchedKeywords,
            preFilterTargetSections,
            preFilterEvaluatedAt,
            preFilterRuleVersion,
            publishedAt
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

    public Long getId() {
        return id;
    }

    public Long getDisclosureId() {
        return disclosureId;
    }

    public int getVersionNumber() {
        return versionNumber;
    }

    public String getSourceReceiptNo() {
        return sourceReceiptNo;
    }

    public String getDocumentHash() {
        return documentHash;
    }

    public String getRawContent() {
        return rawContent;
    }

    public String getNormalizedContent() {
        return normalizedContent;
    }

    public String getPreFilterDecision() {
        return preFilterDecision;
    }

    public String getPreFilterMatchedRules() {
        return preFilterMatchedRules;
    }

    public String getPreFilterMatchedKeywords() {
        return preFilterMatchedKeywords;
    }

    public String getPreFilterTargetSections() {
        return preFilterTargetSections;
    }

    public Instant getPreFilterEvaluatedAt() {
        return preFilterEvaluatedAt;
    }

    public String getPreFilterRuleVersion() {
        return preFilterRuleVersion;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
