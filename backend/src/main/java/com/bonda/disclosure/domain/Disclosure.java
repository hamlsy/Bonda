package com.bonda.disclosure.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
    name = "disclosure",
    uniqueConstraints = @UniqueConstraint(name = "uq_disclosure_receipt_no", columnNames = "receipt_no")
)
public class Disclosure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issuer_id", nullable = false)
    private Long issuerId;

    @Column(name = "receipt_no", nullable = false, length = 14)
    private String receiptNo;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(name = "disclosure_type", nullable = false, length = 100)
    private String disclosureType;

    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;

    @Column(name = "latest_version_number", nullable = false)
    private int latestVersionNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Disclosure() {
    }

    private Disclosure(Long issuerId, String receiptNo, String title, String disclosureType, Instant publishedAt) {
        this.issuerId = Objects.requireNonNull(issuerId, "issuerId must not be null");
        this.receiptNo = requireText(receiptNo, "receiptNo");
        this.title = requireText(title, "title");
        this.disclosureType = requireText(disclosureType, "disclosureType");
        this.publishedAt = Objects.requireNonNull(publishedAt, "publishedAt must not be null");
    }

    public static Disclosure create(
        Long issuerId,
        String receiptNo,
        String title,
        String disclosureType,
        Instant publishedAt
    ) {
        return new Disclosure(issuerId, receiptNo, title, disclosureType, publishedAt);
    }

    public int nextVersionNumber() {
        latestVersionNumber += 1;
        return latestVersionNumber;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
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

    public Long getIssuerId() {
        return issuerId;
    }

    public String getReceiptNo() {
        return receiptNo;
    }

    public String getTitle() {
        return title;
    }

    public String getDisclosureType() {
        return disclosureType;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public int getLatestVersionNumber() {
        return latestVersionNumber;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
