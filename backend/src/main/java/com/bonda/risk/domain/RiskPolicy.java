package com.bonda.risk.domain;

import com.bonda.ai.domain.RiskEventType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class RiskPolicy {

    public static final String RULE_VERSION = "RISK_POLICY_V1";

    private final RiskThresholds thresholds;

    public RiskPolicy() {
        this(RiskThresholds.v1());
    }

    RiskPolicy(RiskThresholds thresholds) {
        this.thresholds = thresholds;
    }

    public PolicyResult evaluate(
        LocalDate snapshotDate,
        FinancialSnapshot current,
        FinancialSnapshot previous,
        List<EventSignal> eventSignals
    ) {
        if (snapshotDate == null) {
            throw new IllegalArgumentException("snapshotDate must not be null");
        }
        FinancialFeatures features = current == null
            ? new FinancialFeatures(null, null, null, null, null, null, null, false, false)
            : FinancialFeatures.calculate(current, previous);
        LocalDate cutoff = snapshotDate.minusDays(thresholds.eventLookbackDays());
        List<EventSignal> events = eventSignals.stream()
            .filter(event -> !event.effectiveDate().isAfter(snapshotDate))
            .filter(event -> !event.effectiveDate().isBefore(cutoff))
            .toList();

        Map<RiskCategory, MutableDecision> decisions = new EnumMap<>(RiskCategory.class);
        for (RiskCategory category : RiskCategory.values()) {
            decisions.put(category, new MutableDecision(category));
        }
        applyLiquidity(decisions.get(RiskCategory.LIQUIDITY), features, events, current, previous);
        applyCashFlow(decisions.get(RiskCategory.CASH_FLOW), features, events, current, previous);
        applyLeverage(decisions.get(RiskCategory.LEVERAGE), features, events, current, previous);
        applyEarnings(decisions.get(RiskCategory.EARNINGS), features, events, current, previous);
        applyCredit(decisions.get(RiskCategory.CREDIT), events);

        List<RiskDecision> result = decisions.values().stream().map(MutableDecision::freeze).toList();
        return new PolicyResult(features, result, RULE_VERSION);
    }

    private void applyLiquidity(
        MutableDecision decision,
        FinancialFeatures features,
        List<EventSignal> events,
        FinancialSnapshot current,
        FinancialSnapshot previous
    ) {
        addFinancialSources(decision, current, previous);
        List<EventSignal> warnings = eventsOf(events, RiskEventType.LIQUIDITY_WARNING);
        if (!warnings.isEmpty()) {
            decision.add(RiskState.CAUTION, "LIQUIDITY_WARNING_EVENT", warnings);
        }
        boolean cashDown = atMost(features.cashChangeRate(), thresholds.cashDecreaseWatchRate());
        boolean shortDebtUp = atLeast(
            features.shortTermDebtChangeRate(),
            thresholds.shortTermDebtIncreaseWatchRate()
        );
        if (cashDown && shortDebtUp) {
            decision.add(RiskState.WATCH, "SHORT_TERM_DEBT_UP_AND_CASH_DOWN", List.of());
        }
        List<EventSignal> debtEvents = eventsOf(events, RiskEventType.DEBT_INCREASE);
        if (cashDown && !debtEvents.isEmpty()) {
            decision.add(RiskState.WATCH, "DEBT_EVENT_AND_CASH_DOWN", debtEvents);
        }
    }

    private void applyCashFlow(
        MutableDecision decision,
        FinancialFeatures features,
        List<EventSignal> events,
        FinancialSnapshot current,
        FinancialSnapshot previous
    ) {
        addFinancialSources(decision, current, previous);
        List<EventSignal> losses = eventsOf(events, RiskEventType.OPERATING_LOSS);
        if (features.operatingCashFlowTurnedNegative() && !losses.isEmpty()) {
            decision.add(RiskState.CAUTION, "OCF_TURNED_NEGATIVE_WITH_OPERATING_LOSS", losses);
        } else if (features.operatingCashFlowTurnedNegative()
            || atMost(features.operatingCashFlowChangeRate(), thresholds.operatingCashFlowDeteriorationRate())) {
            decision.add(RiskState.WATCH, "OPERATING_CASH_FLOW_DETERIORATED", List.of());
        }
    }

    private void applyLeverage(
        MutableDecision decision,
        FinancialFeatures features,
        List<EventSignal> events,
        FinancialSnapshot current,
        FinancialSnapshot previous
    ) {
        addFinancialSources(decision, current, previous);
        boolean debtUp = atLeast(features.totalDebtChangeRate(), thresholds.totalDebtIncreaseWatchRate());
        List<EventSignal> guarantees = eventsOf(events, RiskEventType.GUARANTEE_INCREASE);
        if (debtUp && !guarantees.isEmpty()) {
            decision.add(RiskState.CAUTION, "TOTAL_DEBT_UP_WITH_GUARANTEE_INCREASE", guarantees);
        } else {
            if (debtUp) {
                decision.add(RiskState.WATCH, "TOTAL_DEBT_INCREASED", List.of());
            }
            if (!guarantees.isEmpty()) {
                decision.add(RiskState.WATCH, "GUARANTEE_INCREASE_EVENT", guarantees);
            }
        }
    }

    private void applyEarnings(
        MutableDecision decision,
        FinancialFeatures features,
        List<EventSignal> events,
        FinancialSnapshot current,
        FinancialSnapshot previous
    ) {
        addFinancialSources(decision, current, previous);
        if (features.operatingProfitTurnedNegative()) {
            decision.add(RiskState.CAUTION, "OPERATING_PROFIT_TURNED_NEGATIVE", List.of());
            return;
        }
        List<EventSignal> losses = eventsOf(events, RiskEventType.OPERATING_LOSS);
        if (!losses.isEmpty()) {
            decision.add(RiskState.WATCH, "OPERATING_LOSS_EVENT", losses);
        }
        if (atMost(features.operatingProfitChangeRate(), thresholds.operatingProfitDeteriorationRate())) {
            decision.add(RiskState.WATCH, "OPERATING_PROFIT_DETERIORATED", List.of());
        }
    }

    private void applyCredit(MutableDecision decision, List<EventSignal> events) {
        List<EventSignal> ratingChanges = eventsOf(events, RiskEventType.CREDIT_RATING_CHANGE);
        for (EventSignal event : ratingChanges) {
            String evidence = event.evidenceText().toLowerCase(Locale.ROOT);
            if (containsAny(evidence, "하향", "강등", "부정적", "watch negative", "negative watch")) {
                decision.add(RiskState.CAUTION, "CREDIT_RATING_DOWNGRADE", List.of(event));
            } else {
                decision.add(RiskState.WATCH, "CREDIT_RATING_CHANGED", List.of(event));
            }
        }
    }

    private void addFinancialSources(
        MutableDecision decision,
        FinancialSnapshot current,
        FinancialSnapshot previous
    ) {
        if (current != null && current.getId() != null) {
            decision.financialSnapshotIds.add(current.getId());
        }
        if (previous != null && previous.getId() != null) {
            decision.financialSnapshotIds.add(previous.getId());
        }
    }

    private List<EventSignal> eventsOf(List<EventSignal> events, RiskEventType type) {
        return events.stream().filter(event -> event.eventType() == type).toList();
    }

    private boolean atMost(BigDecimal value, BigDecimal threshold) {
        return value != null && value.compareTo(threshold) <= 0;
    }

    private boolean atLeast(BigDecimal value, BigDecimal threshold) {
        return value != null && value.compareTo(threshold) >= 0;
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) {
                return true;
            }
        }
        return false;
    }

    public record EventSignal(
        Long eventId,
        RiskEventType eventType,
        LocalDate effectiveDate,
        String evidenceText
    ) {
        public EventSignal {
            if (eventId == null || eventType == null || effectiveDate == null) {
                throw new IllegalArgumentException("Event signal identity and date must not be null");
            }
            evidenceText = evidenceText == null ? "" : evidenceText;
        }
    }

    public record RiskDecision(
        RiskCategory category,
        RiskState state,
        List<String> reasons,
        List<Long> sourceEventIds,
        List<Long> sourceFinancialSnapshotIds
    ) {
        public RiskDecision {
            reasons = List.copyOf(reasons);
            sourceEventIds = List.copyOf(sourceEventIds);
            sourceFinancialSnapshotIds = List.copyOf(sourceFinancialSnapshotIds);
        }
    }

    public record PolicyResult(FinancialFeatures features, List<RiskDecision> decisions, String ruleVersion) {
        public PolicyResult {
            decisions = List.copyOf(decisions);
        }

        public RiskDecision decision(RiskCategory category) {
            return decisions.stream()
                .filter(decision -> decision.category() == category)
                .findFirst()
                .orElseThrow();
        }
    }

    private static final class MutableDecision {
        private final RiskCategory category;
        private RiskState state = RiskState.NORMAL;
        private final List<String> reasons = new ArrayList<>();
        private final List<Long> eventIds = new ArrayList<>();
        private final List<Long> financialSnapshotIds = new ArrayList<>();

        private MutableDecision(RiskCategory category) {
            this.category = category;
        }

        private void add(RiskState proposed, String reason, List<EventSignal> events) {
            state = RiskState.max(state, proposed);
            if (!reasons.contains(reason)) {
                reasons.add(reason);
            }
            events.stream().map(EventSignal::eventId).filter(id -> !eventIds.contains(id)).forEach(eventIds::add);
        }

        private RiskDecision freeze() {
            return new RiskDecision(category, state, reasons, eventIds, financialSnapshotIds);
        }
    }
}
