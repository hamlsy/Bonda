package com.bonda.bond.domain;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BondTest {

    @Test
    void maturityDateMustBeAfterIssueDate() {
        LocalDate issueDate = LocalDate.of(2026, 1, 10);

        assertThatThrownBy(() -> Bond.create(
            1L,
            "DEMO-ISIN",
            "DEMO-CODE",
            "[데모] 테스트 채권",
            issueDate,
            issueDate,
            new BigDecimal("4.25"),
            "AA-"
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("maturityDate");
    }

    @Test
    void couponRateCannotBeNegative() {
        assertThatThrownBy(() -> Bond.create(
            1L,
            "DEMO-ISIN",
            "DEMO-CODE",
            "[데모] 테스트 채권",
            LocalDate.of(2026, 1, 10),
            LocalDate.of(2027, 1, 10),
            new BigDecimal("-0.01"),
            "AA-"
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("couponRate");
    }
}
