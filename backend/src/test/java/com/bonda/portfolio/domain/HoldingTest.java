package com.bonda.portfolio.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HoldingTest {

    @Test
    void purchaseAmountMustBePositive() {
        assertThatThrownBy(() -> Holding.create(
            1L,
            LocalDate.of(2026, 1, 10),
            BigDecimal.ZERO
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("purchaseAmount");
    }

    @Test
    void purchaseAmountSupportsAtMostTwoDecimalPlaces() {
        assertThatThrownBy(() -> Holding.create(
            1L,
            LocalDate.of(2026, 1, 10),
            new BigDecimal("1000.001")
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("decimal places");
    }
}
