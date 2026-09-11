package com.bonda.portfolio.domain;

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
@Table(name = "watchlist")
public class Watchlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bond_id", nullable = false, unique = true)
    private Long bondId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Watchlist() {
    }

    private Watchlist(Long bondId) {
        this.bondId = Objects.requireNonNull(bondId, "bondId must not be null");
        this.createdAt = Instant.now();
    }

    public static Watchlist create(Long bondId) {
        return new Watchlist(bondId);
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
