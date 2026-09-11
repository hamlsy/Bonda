package com.bonda.sincebought.application;

import com.bonda.ai.application.AiCostCalculator;
import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.risk.domain.RiskChange;
import com.bonda.sincebought.domain.SinceBoughtExplanation;
import com.bonda.sincebought.infrastructure.SinceBoughtExplanationRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CrossDocumentExplanationService {

    private static final int MAX_EVENTS_IN_CONTEXT = 10;
    private static final int MAX_CHANGES_IN_CONTEXT = 10;

    private final SinceBoughtExplanationRepository repository;
    private final RiskEventEvidenceRepository evidenceRepository;
    private final CrossDocumentExplainer explainer;
    private final AiCostCalculator costCalculator;

    public CrossDocumentExplanationService(
        SinceBoughtExplanationRepository repository,
        RiskEventEvidenceRepository evidenceRepository,
        CrossDocumentExplainer explainer,
        AiCostCalculator costCalculator
    ) {
        this.repository = repository;
        this.evidenceRepository = evidenceRepository;
        this.explainer = explainer;
        this.costCalculator = costCalculator;
    }

    public ExplanationView explain(SinceBoughtDataAssembler.SinceBoughtData data) {
        if (data.riskEvents().isEmpty() && data.riskChanges().isEmpty()) {
            return ExplanationView.notNeeded();
        }
        String fingerprint = fingerprint(data);
        SinceBoughtExplanation cached = repository.findByInputFingerprint(fingerprint).orElse(null);
        if (cached != null) {
            return view(cached, true);
        }

        List<RiskEvent> events = tail(data.riskEvents(), MAX_EVENTS_IN_CONTEXT);
        List<RiskChange> changes = tail(data.riskChanges(), MAX_CHANGES_IN_CONTEXT);
        List<Long> allowedEventIds = events.stream().map(RiskEvent::getId).toList();
        List<Long> allowedChangeIds = changes.stream().map(RiskChange::getId).toList();
        long started = System.nanoTime();
        try {
            CrossDocumentExplainer.ExplanationResult result = explainer.explain(
                new CrossDocumentExplainer.ExplanationRequest(
                    context(data, events, changes),
                    allowedEventIds,
                    allowedChangeIds
                )
            );
            long latencyMs = Math.max(0, (System.nanoTime() - started) / 1_000_000);
            SinceBoughtExplanation explanation = SinceBoughtExplanation.create(
                data.holding().id(),
                fingerprint,
                explainer.model(),
                CrossDocumentExplanationPrompt.VERSION,
                result.summary(),
                joinIds(result.relatedEventIds()),
                joinIds(result.relatedRiskChangeIds()),
                result.inputTokens(),
                result.outputTokens(),
                latencyMs,
                costCalculator.estimate(explainer.model(), result.inputTokens(), result.outputTokens())
            );
            try {
                return view(repository.saveAndFlush(explanation), false);
            } catch (DataIntegrityViolationException race) {
                return repository.findByInputFingerprint(fingerprint)
                    .map(value -> view(value, true))
                    .orElseThrow(() -> race);
            }
        } catch (RuntimeException exception) {
            return ExplanationView.failed();
        }
    }

    private String context(
        SinceBoughtDataAssembler.SinceBoughtData data,
        List<RiskEvent> events,
        List<RiskChange> changes
    ) {
        StringBuilder context = new StringBuilder();
        context.append("Holding purchaseDate: ").append(data.holding().purchaseDate()).append('\n');
        context.append("Canonical RiskEvents after purchase:\n");
        for (RiskEvent event : events) {
            String evidence = evidenceRepository.findAllByRiskEventIdOrderByIdAsc(event.getId()).stream()
                .map(item -> item.getEvidenceText()).collect(Collectors.joining(" "));
            context.append("- id=").append(event.getId())
                .append(", type=").append(event.getEventType())
                .append(", date=").append(event.getEventDate())
                .append(", amount=").append(event.getAmount())
                .append(", currency=").append(event.getCurrency())
                .append(", verifiedEvidence=").append(evidence).append('\n');
        }
        context.append("RiskChanges after purchase:\n");
        for (RiskChange change : changes) {
            context.append("- id=").append(change.getId())
                .append(", category=").append(change.getCategory())
                .append(", transition=").append(change.getPreviousState())
                .append("->").append(change.getCurrentState()).append('\n');
        }
        appendFinancial(context, "Purchase baseline", data.baselineFinancial());
        appendFinancial(context, "Latest financial", data.currentFinancial());
        if (data.currentRiskState() != null) {
            var risk = data.currentRiskState();
            context.append("Current risk states: liquidity=").append(risk.liquidity())
                .append(", cashFlow=").append(risk.cashFlow())
                .append(", leverage=").append(risk.leverage())
                .append(", earnings=").append(risk.earnings())
                .append(", credit=").append(risk.credit()).append('\n');
        }
        return context.toString();
    }

    private void appendFinancial(StringBuilder context, String label, com.bonda.risk.domain.FinancialSnapshot value) {
        if (value == null) {
            context.append(label).append(": unavailable\n");
            return;
        }
        context.append(label).append(": period=").append(value.getPeriod())
            .append(", date=").append(value.getStatementDate())
            .append(", cash=").append(value.getCash())
            .append(", shortTermDebt=").append(value.getShortTermDebt())
            .append(", totalDebt=").append(value.getTotalDebt())
            .append(", operatingCashFlow=").append(value.getOperatingCashFlow())
            .append(", operatingProfit=").append(value.getOperatingProfit()).append('\n');
    }

    private String fingerprint(SinceBoughtDataAssembler.SinceBoughtData data) {
        String value = data.holding().id() + "|" + explainer.model() + "|"
            + CrossDocumentExplanationPrompt.VERSION
            + "|events=" + joinIds(data.riskEvents().stream().map(RiskEvent::getId).toList())
            + "|changes=" + joinIds(data.riskChanges().stream().map(RiskChange::getId).toList())
            + "|baseline=" + (data.baselineFinancial() == null ? "" : data.baselineFinancial().getId())
            + "|current=" + (data.currentFinancial() == null ? "" : data.currentFinancial().getId())
            + "|risk=" + (data.currentRiskState() == null ? "" : data.currentRiskState().snapshotId())
            + "|rule=" + (data.currentRiskState() == null ? "" : data.currentRiskState().ruleVersion());
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private <T> List<T> tail(List<T> values, int limit) {
        return values.stream().skip(Math.max(0, values.size() - limit)).toList();
    }

    private String joinIds(List<Long> ids) {
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private List<Long> parseIds(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.split(",")).stream().map(Long::valueOf).toList();
    }

    private ExplanationView view(SinceBoughtExplanation explanation, boolean reused) {
        return new ExplanationView(
            "AVAILABLE",
            explanation.getSummary(),
            parseIds(explanation.getRelatedEventIds()),
            parseIds(explanation.getRelatedRiskChangeIds()),
            reused,
            explanation.getModel(),
            explanation.getPromptVersion()
        );
    }

    public record ExplanationView(
        String status,
        String summary,
        List<Long> relatedEventIds,
        List<Long> relatedRiskChangeIds,
        boolean reused,
        String model,
        String promptVersion
    ) {
        public ExplanationView {
            relatedEventIds = List.copyOf(relatedEventIds);
            relatedRiskChangeIds = List.copyOf(relatedRiskChangeIds);
        }

        static ExplanationView notNeeded() {
            return new ExplanationView("NOT_NEEDED", null, List.of(), List.of(), false, null, null);
        }

        static ExplanationView failed() {
            return new ExplanationView(
                "FAILED",
                null,
                List.of(),
                List.of(),
                false,
                null,
                CrossDocumentExplanationPrompt.VERSION
            );
        }
    }
}
