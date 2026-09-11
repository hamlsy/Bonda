package com.bonda.risk.application;

import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.issuer.infrastructure.IssuerRepository;
import com.bonda.risk.domain.FinancialFeatures;
import com.bonda.risk.domain.FinancialSnapshot;
import com.bonda.risk.domain.IssuerRiskSnapshot;
import com.bonda.risk.domain.RiskCategory;
import com.bonda.risk.domain.RiskChange;
import com.bonda.risk.domain.RiskChangeDetector;
import com.bonda.risk.domain.RiskPolicy;
import com.bonda.risk.domain.RiskState;
import com.bonda.risk.infrastructure.FinancialSnapshotRepository;
import com.bonda.risk.infrastructure.IssuerRiskSnapshotRepository;
import com.bonda.risk.infrastructure.RiskChangeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class RiskRecalculationService {

    private final IssuerRepository issuerRepository;
    private final FinancialSnapshotRepository financialRepository;
    private final RiskEventRepository riskEventRepository;
    private final RiskEventEvidenceRepository evidenceRepository;
    private final IssuerRiskSnapshotRepository snapshotRepository;
    private final RiskChangeRepository changeRepository;
    private final RiskChangeDetector changeDetector;
    private final RiskPolicy riskPolicy;
    private final Clock clock;

    @Autowired
    public RiskRecalculationService(
        IssuerRepository issuerRepository,
        FinancialSnapshotRepository financialRepository,
        RiskEventRepository riskEventRepository,
        RiskEventEvidenceRepository evidenceRepository,
        IssuerRiskSnapshotRepository snapshotRepository,
        RiskChangeRepository changeRepository,
        RiskChangeDetector changeDetector,
        RiskPolicy riskPolicy
    ) {
        this(
            issuerRepository,
            financialRepository,
            riskEventRepository,
            evidenceRepository,
            snapshotRepository,
            changeRepository,
            changeDetector,
            riskPolicy,
            Clock.systemUTC()
        );
    }

    RiskRecalculationService(
        IssuerRepository issuerRepository,
        FinancialSnapshotRepository financialRepository,
        RiskEventRepository riskEventRepository,
        RiskEventEvidenceRepository evidenceRepository,
        IssuerRiskSnapshotRepository snapshotRepository,
        RiskChangeRepository changeRepository,
        RiskChangeDetector changeDetector,
        RiskPolicy riskPolicy,
        Clock clock
    ) {
        this.issuerRepository = issuerRepository;
        this.financialRepository = financialRepository;
        this.riskEventRepository = riskEventRepository;
        this.evidenceRepository = evidenceRepository;
        this.snapshotRepository = snapshotRepository;
        this.changeRepository = changeRepository;
        this.changeDetector = changeDetector;
        this.riskPolicy = riskPolicy;
        this.clock = clock;
    }

    @Transactional
    public RecalculationResult recalculate(Long issuerId) {
        if (!issuerRepository.existsById(issuerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issuer not found");
        }
        List<FinancialSnapshot> financials = financialRepository
            .findAllByIssuerIdOrderByStatementDateDescIdDesc(issuerId);
        FinancialSnapshot currentFinancial = financials.isEmpty() ? null : financials.getFirst();
        FinancialSnapshot previousFinancial = financials.size() < 2 ? null : financials.get(1);

        List<RiskEvent> riskEvents = riskEventRepository.findAllByIssuerIdOrderByEventDateAscIdAsc(issuerId);
        if (currentFinancial == null && riskEvents.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No financial snapshot or canonical risk event");
        }
        LocalDate snapshotDate = effectiveSnapshotDate(currentFinancial, riskEvents);
        List<RiskPolicy.EventSignal> signals = riskPolicy.relevantEvents(
            snapshotDate,
            eventSignals(riskEvents)
        );
        RiskPolicy.PolicyResult policyResult = riskPolicy.evaluate(
            snapshotDate,
            currentFinancial,
            previousFinancial,
            signals
        );
        String inputFingerprint = inputFingerprint(currentFinancial, previousFinancial, signals, snapshotDate);
        String trace = trace(policyResult.decisions());
        Map<RiskCategory, RiskState> states = policyResult.decisions().stream().collect(Collectors.toMap(
            RiskPolicy.RiskDecision::category,
            RiskPolicy.RiskDecision::state,
            (left, right) -> left,
            () -> new EnumMap<>(RiskCategory.class)
        ));

        IssuerRiskSnapshot snapshot = snapshotRepository.findByIssuerIdAndSnapshotDateAndRuleVersion(
            issuerId,
            snapshotDate,
            policyResult.ruleVersion()
        ).orElse(null);
        if (snapshot != null && snapshot.getInputFingerprint().equals(inputFingerprint)) {
            return result(snapshot, policyResult, changeRepository
                .findAllByCurrentSnapshotIdOrderByCategoryAsc(snapshot.getId()), true);
        }

        if (snapshot == null) {
            snapshot = snapshotRepository.save(IssuerRiskSnapshot.create(
                issuerId,
                snapshotDate,
                policyResult.ruleVersion(),
                currentFinancial == null ? null : currentFinancial.getId(),
                inputFingerprint,
                trace,
                states
            ));
        } else {
            snapshot.apply(
                currentFinancial == null ? null : currentFinancial.getId(),
                inputFingerprint,
                trace,
                states
            );
        }
        IssuerRiskSnapshot previousSnapshot = snapshotRepository
            .findFirstByIssuerIdAndSnapshotDateLessThanOrderBySnapshotDateDescIdDesc(issuerId, snapshotDate)
            .orElse(null);
        List<RiskChange> changes = reconcileChanges(snapshot, previousSnapshot, policyResult.ruleVersion());
        return result(snapshot, policyResult, changes, false);
    }

    private LocalDate effectiveSnapshotDate(FinancialSnapshot financial, List<RiskEvent> events) {
        LocalDate result = financial == null ? null : financial.getStatementDate();
        for (RiskEvent event : events) {
            LocalDate eventDate = eventDate(event);
            if (result == null || eventDate.isAfter(result)) {
                result = eventDate;
            }
        }
        return Objects.requireNonNull(result);
    }

    private List<RiskPolicy.EventSignal> eventSignals(List<RiskEvent> events) {
        return events.stream().map(event -> new RiskPolicy.EventSignal(
            event.getId(),
            event.getEventType(),
            eventDate(event),
            evidenceRepository.findAllByRiskEventIdOrderByIdAsc(event.getId()).stream()
                .map(evidence -> evidence.getEvidenceText())
                .collect(Collectors.joining(" "))
        )).toList();
    }

    private LocalDate eventDate(RiskEvent event) {
        return event.getEventDate() != null
            ? event.getEventDate()
            : event.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
    }

    private List<RiskChange> reconcileChanges(
        IssuerRiskSnapshot current,
        IssuerRiskSnapshot previous,
        String ruleVersion
    ) {
        Map<RiskCategory, RiskChangeDetector.Transition> transitions = changeDetector.detect(current, previous)
            .stream().collect(Collectors.toMap(RiskChangeDetector.Transition::category, transition -> transition));
        for (RiskCategory category : RiskCategory.values()) {
            RiskChange existing = changeRepository.findByCurrentSnapshotIdAndCategory(current.getId(), category)
                .orElse(null);
            RiskChangeDetector.Transition transition = transitions.get(category);
            if (transition == null) {
                if (existing != null) {
                    changeRepository.delete(existing);
                }
                continue;
            }
            if (existing == null) {
                changeRepository.save(RiskChange.create(
                    current.getIssuerId(),
                    category,
                    transition.previousState(),
                    transition.currentState(),
                    previous == null ? null : previous.getId(),
                    current.getId(),
                    clock.instant(),
                    ruleVersion
                ));
            } else {
                existing.apply(
                    transition.previousState(),
                    transition.currentState(),
                    previous == null ? null : previous.getId(),
                    clock.instant(),
                    ruleVersion
                );
            }
        }
        return changeRepository.findAllByCurrentSnapshotIdOrderByCategoryAsc(current.getId());
    }

    private RecalculationResult result(
        IssuerRiskSnapshot snapshot,
        RiskPolicy.PolicyResult policyResult,
        List<RiskChange> changes,
        boolean reused
    ) {
        return new RecalculationResult(
            snapshot.getId(),
            snapshot.getIssuerId(),
            snapshot.getSnapshotDate(),
            snapshot.getRuleVersion(),
            snapshot.getSourceFinancialSnapshotId(),
            reused,
            policyResult.features(),
            policyResult.decisions(),
            changes.stream().map(ChangeResult::from).toList()
        );
    }

    private String trace(List<RiskPolicy.RiskDecision> decisions) {
        return decisions.stream().map(decision ->
            decision.category() + "|" + decision.state()
                + "|reasons=" + String.join(",", decision.reasons())
                + "|events=" + joinIds(decision.sourceEventIds())
                + "|financial=" + joinIds(decision.sourceFinancialSnapshotIds())
        ).collect(Collectors.joining("\n"));
    }

    private String joinIds(List<Long> values) {
        return values.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private String inputFingerprint(
        FinancialSnapshot current,
        FinancialSnapshot previous,
        List<RiskPolicy.EventSignal> signals,
        LocalDate snapshotDate
    ) {
        String value = RiskPolicy.RULE_VERSION + "|" + snapshotDate
            + "|current=" + (current == null ? "" : current.getId())
            + "|previous=" + (previous == null ? "" : previous.getId())
            + "|events=" + signals.stream().map(signal -> String.valueOf(signal.eventId()))
                .sorted().collect(Collectors.joining(","));
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public record RecalculationResult(
        Long snapshotId,
        Long issuerId,
        LocalDate snapshotDate,
        String ruleVersion,
        Long sourceFinancialSnapshotId,
        boolean reused,
        FinancialFeatures features,
        List<RiskPolicy.RiskDecision> decisions,
        List<ChangeResult> changes
    ) {
        public RecalculationResult {
            decisions = List.copyOf(decisions);
            changes = List.copyOf(changes);
        }
    }

    public record ChangeResult(
        Long id,
        RiskCategory category,
        RiskState previousState,
        RiskState currentState,
        Long previousSnapshotId,
        Long currentSnapshotId
    ) {
        static ChangeResult from(RiskChange change) {
            return new ChangeResult(
                change.getId(),
                change.getCategory(),
                change.getPreviousState(),
                change.getCurrentState(),
                change.getPreviousSnapshotId(),
                change.getCurrentSnapshotId()
            );
        }
    }
}
