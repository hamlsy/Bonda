package com.bonda.portfolio.domain;

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
@Table(name = "holding")
public class Holding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bond_id", nullable = false)
    private Long bondId;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "purchase_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal purchaseAmount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Holding() {
    }

    private Holding(Long bondId, LocalDate purchaseDate, BigDecimal purchaseAmount) {
        this.bondId = Objects.requireNonNull(bondId, "bondId must not be null");
        this.purchaseDate = Objects.requireNonNull(purchaseDate, "purchaseDate must not be null");
        this.purchaseAmount = Objects.requireNonNull(purchaseAmount, "purchaseAmount must not be null");

        if (purchaseAmount.signum() <= 0) {
            throw new IllegalArgumentException("purchaseAmount must be positive");
        }
        if (purchaseAmount.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("purchaseAmount must have at most 2 decimal places");
        }

        this.createdAt = Instant.now();
    }

    public static Holding create(Long bondId, LocalDate purchaseDate, BigDecimal purchaseAmount) {
        return new Holding(bondId, purchaseDate, purchaseAmount);
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getBondId() {
        return bondId;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public BigDecimal getPurchaseAmount() {
        return purchaseAmount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
