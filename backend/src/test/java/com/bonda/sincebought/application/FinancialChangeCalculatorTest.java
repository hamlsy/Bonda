package com.bonda.sincebought.application;

import com.bonda.risk.domain.FinancialSnapshot;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class FinancialChangeCalculatorTest {

    private final FinancialChangeCalculator calculator = new FinancialChangeCalculator();

    @Test
    void returnsOnlyMeaningfulChangesInStablePriorityOrder() {
        FinancialSnapshot baseline = snapshot(1L, "100", "100", "100", "100");
        FinancialSnapshot current = snapshot(2L, "85", "125", "95", "101");

        var changes = calculator.calculate(baseline, current);

        assertThat(changes).extracting(FinancialChangeCalculator.FinancialChange::metric)
            .containsExactly("CASH", "SHORT_TERM_DEBT");
        assertThat(changes.get(0).changeRate()).isEqualByComparingTo("-0.15");
        assertThat(changes.get(1).changeRate()).isEqualByComparingTo("0.25");
    }

    @Test
    void zeroBaselineDoesNotInventAPercentage() {
        FinancialSnapshot baseline = snapshot(1L, "0", "0", "0", "0");
        FinancialSnapshot current = snapshot(2L, "10", "10", "-10", "-10");

        var changes = calculator.calculate(baseline, current);

        assertThat(changes).hasSize(4).allMatch(change -> change.changeRate() == null);
    }

    @Test
    void missingOrSameSnapshotHasNoFinancialChange() {
        FinancialSnapshot snapshot = snapshot(1L, "100", "100", "100", "100");

        assertThat(calculator.calculate(null, snapshot)).isEmpty();
        assertThat(calculator.calculate(snapshot, snapshot)).isEmpty();
    }

    private FinancialSnapshot snapshot(Long id, String cash, String debt, String ocf, String profit) {
        FinancialSnapshot snapshot = FinancialSnapshot.create(
            1L,
            "2026-Q1",
            LocalDate.of(2026, 3, 31),
            new BigDecimal(cash),
            new BigDecimal(debt),
            BigDecimal.ZERO,
            new BigDecimal(ocf),
            new BigDecimal(profit),
            null,
            null
        );
        ReflectionTestUtils.setField(snapshot, "id", id);
        return snapshot;
    }
}
