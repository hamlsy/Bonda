package com.bonda.alert.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "alert")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "holding_id")
    private Long holdingId;

    @Column(name = "watchlist_id")
    private Long watchlistId;

    @Column(name = "bond_id", nullable = false)
    private Long bondId;

    @Column(name = "issuer_id", nullable = false)
    private Long issuerId;

    @Column(name = "risk_event_id")
    private Long riskEventId;

    @Column(name = "risk_change_id")
    private Long riskChangeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AlertSeverity severity;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 800)
    private String message;

    @Column(nullable = false, unique = true, length = 64)
    private String fingerprint;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "read_at")
    private Instant readAt;

    protected Alert() {
    }

    private Alert(
        Long holdingId,
        Long watchlistId,
        Long bondId,
        Long issuerId,
        Long riskEventId,
        Long riskChangeId,
        AlertSeverity severity,
        String title,
        String message,
        String fingerprint,
        Instant createdAt
    ) {
        if ((holdingId == null) == (watchlistId == null)) {
            throw new IllegalArgumentException("Alert requires exactly one portfolio target");
        }
        if (riskEventId == null && riskChangeId == null) {
            throw new IllegalArgumentException("Alert requires a verified source");
        }
        this.holdingId = holdingId;
        this.watchlistId = watchlistId;
        this.bondId = Objects.requireNonNull(bondId, "bondId must not be null");
        this.issuerId = Objects.requireNonNull(issuerId, "issuerId must not be null");
        this.riskEventId = riskEventId;
        this.riskChangeId = riskChangeId;
        this.severity = Objects.requireNonNull(severity, "severity must not be null");
        this.title = requireText(title, "title");
        this.message = requireText(message, "message");
        this.fingerprint = requireText(fingerprint, "fingerprint");
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
    }

    public static Alert create(
        Long holdingId,
        Long watchlistId,
        Long bondId,
        Long issuerId,
        Long riskEventId,
        Long riskChangeId,
        AlertSeverity severity,
        String title,
        String message,
        String fingerprint,
        Instant createdAt
    ) {
        return new Alert(
            holdingId, watchlistId, bondId, issuerId, riskEventId, riskChangeId,
            severity, title, message, fingerprint, createdAt
        );
    }

    public void markRead(Instant now) {
        if (read) {
            return;
        }
        read = true;
        readAt = Objects.requireNonNull(now, "readAt must not be null");
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    public Long getId() { return id; }
    public Long getHoldingId() { return holdingId; }
    public Long getWatchlistId() { return watchlistId; }
    public Long getBondId() { return bondId; }
    public Long getIssuerId() { return issuerId; }
    public Long getRiskEventId() { return riskEventId; }
    public Long getRiskChangeId() { return riskChangeId; }
    public AlertSeverity getSeverity() { return severity; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getFingerprint() { return fingerprint; }
    public boolean isRead() { return read; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReadAt() { return readAt; }
}

