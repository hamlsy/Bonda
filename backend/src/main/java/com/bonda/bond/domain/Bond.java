package com.bonda.bond.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "bond")
public class Bond {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issuer_id", nullable = false)
    private Long issuerId;

    @Column(nullable = false, unique = true, length = 32)
    private String isin;

    @Column(name = "bond_code", nullable = false, unique = true, length = 40)
    private String bondCode;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "maturity_date", nullable = false)
    private LocalDate maturityDate;

    @Column(name = "coupon_rate", nullable = false, precision = 7, scale = 4)
    private BigDecimal couponRate;

    @Column(name = "credit_rating", nullable = false, length = 20)
    private String creditRating;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Bond() {
    }

    private Bond(
        Long issuerId,
        String isin,
        String bondCode,
        String name,
        LocalDate issueDate,
        LocalDate maturityDate,
        BigDecimal couponRate,
        String creditRating
    ) {
        this.issuerId = Objects.requireNonNull(issuerId, "issuerId must not be null");
        this.isin = requireText(isin, "isin");
        this.bondCode = requireText(bondCode, "bondCode");
        this.name = requireText(name, "name");
        this.issueDate = Objects.requireNonNull(issueDate, "issueDate must not be null");
        this.maturityDate = Objects.requireNonNull(maturityDate, "maturityDate must not be null");
        this.couponRate = Objects.requireNonNull(couponRate, "couponRate must not be null");
        this.creditRating = requireText(creditRating, "creditRating");

        if (!maturityDate.isAfter(issueDate)) {
            throw new IllegalArgumentException("maturityDate must be after issueDate");
        }
        if (couponRate.signum() < 0) {
            throw new IllegalArgumentException("couponRate must not be negative");
        }

        this.createdAt = Instant.now();
    }

    public static Bond create(
        Long issuerId,
        String isin,
        String bondCode,
        String name,
        LocalDate issueDate,
        LocalDate maturityDate,
        BigDecimal couponRate,
        String creditRating
    ) {
        return new Bond(
            issuerId,
            isin,
            bondCode,
            name,
            issueDate,
            maturityDate,
            couponRate,
            creditRating
        );
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value;
    }

    public Long getId() {
        return id;
    }

    public Long getIssuerId() {
        return issuerId;
    }

    public String getIsin() {
        return isin;
    }

    public String getBondCode() {
        return bondCode;
    }

    public String getName() {
        return name;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public LocalDate getMaturityDate() {
        return maturityDate;
    }

    public BigDecimal getCouponRate() {
        return couponRate;
    }

    public String getCreditRating() {
        return creditRating;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
