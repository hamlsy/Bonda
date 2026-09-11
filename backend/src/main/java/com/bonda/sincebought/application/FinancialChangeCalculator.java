package com.bonda.sincebought.application;

import com.bonda.risk.domain.FinancialSnapshot;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Component
public class FinancialChangeCalculator {

    private static final BigDecimal MEANINGFUL_CHANGE_RATE = new BigDecimal("0.10");
    private static final int MAX_CHANGES = 4;

    public List<FinancialChange> calculate(FinancialSnapshot baseline, FinancialSnapshot current) {
        if (baseline == null || current == null || baseline == current
            || (baseline.getId() != null && baseline.getId().equals(current.getId()))) {
            return List.of();
        }
        List<FinancialChange> changes = new ArrayList<>();
        add(changes, "CASH", "현금성 자산", baseline.getCash(), current.getCash());
        add(changes, "SHORT_TERM_DEBT", "단기차입금", baseline.getShortTermDebt(), current.getShortTermDebt());
        add(changes, "OPERATING_CASH_FLOW", "영업현금흐름", baseline.getOperatingCashFlow(), current.getOperatingCashFlow());
        add(changes, "OPERATING_PROFIT", "영업이익", baseline.getOperatingProfit(), current.getOperatingProfit());
        return List.copyOf(changes.stream().limit(MAX_CHANGES).toList());
    }

    private void add(
        List<FinancialChange> changes,
        String metric,
        String label,
        BigDecimal baseline,
        BigDecimal current
    ) {
        BigDecimal rate = changeRate(baseline, current);
        boolean signChanged = baseline.signum() != current.signum();
        if (!signChanged && (rate == null || rate.abs().compareTo(MEANINGFUL_CHANGE_RATE) < 0)) {
            return;
        }
        Direction direction = current.compareTo(baseline) > 0 ? Direction.INCREASE : Direction.DECREASE;
        String summary = rate == null
            ? label + "이(가) " + amount(baseline) + "에서 " + amount(current) + "으로 변했습니다."
            : label + "이(가) 매수 기준점 대비 " + percentage(rate.abs()) + " "
                + (direction == Direction.INCREASE ? "증가했습니다." : "감소했습니다.");
        changes.add(new FinancialChange(metric, label, baseline, current, rate, direction, summary));
    }

    private BigDecimal changeRate(BigDecimal baseline, BigDecimal current) {
        if (baseline.signum() == 0) {
            return null;
        }
        return current.subtract(baseline).divide(baseline.abs(), 6, RoundingMode.HALF_UP);
    }

    private String amount(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString() + "원";
    }

    private String percentage(BigDecimal rate) {
        return rate.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP).stripTrailingZeros()
            .toPlainString() + "%";
    }

    public enum Direction {
        INCREASE,
        DECREASE
    }

    public record FinancialChange(
        String metric,
        String label,
        BigDecimal baselineValue,
        BigDecimal currentValue,
        BigDecimal changeRate,
        Direction direction,
        String summary
    ) {
    }
}
