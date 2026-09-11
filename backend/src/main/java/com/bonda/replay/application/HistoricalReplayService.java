package com.bonda.replay.application;

import com.bonda.ai.domain.AnalysisRun;
import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.domain.RiskEventEvidence;
import com.bonda.ai.infrastructure.AnalysisRunRepository;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import com.bonda.issuer.domain.Issuer;
import com.bonda.issuer.infrastructure.IssuerRepository;
import com.bonda.risk.domain.FinancialFeatures;
import com.bonda.risk.domain.FinancialSnapshot;
import com.bonda.risk.domain.RiskCategory;
import com.bonda.risk.domain.RiskPolicy;
import com.bonda.risk.domain.RiskState;
import com.bonda.risk.infrastructure.FinancialSnapshotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class HistoricalReplayService {

    private static final ZoneId PRODUCT_ZONE = ZoneId.of("Asia/Seoul");

    private final IssuerRepository issuerRepository;
    private final DisclosureRepository disclosureRepository;
    private final DisclosureVersionRepository versionRepository;
    private final RiskEventRepository eventRepository;
    private final RiskEventEvidenceRepository evidenceRepository;
    private final FinancialSnapshotRepository financialRepository;
    private final AnalysisRunRepository analysisRunRepository;
    private final RiskPolicy riskPolicy;
    private final Clock clock;

    @Autowired
    public HistoricalReplayService(
        IssuerRepository issuerRepository,
        DisclosureRepository disclosureRepository,
        DisclosureVersionRepository versionRepository,
        RiskEventRepository eventRepository,
        RiskEventEvidenceRepository evidenceRepository,
        FinancialSnapshotRepository financialRepository,
        AnalysisRunRepository analysisRunRepository,
        RiskPolicy riskPolicy
    ) {
        this(
            issuerRepository, disclosureRepository, versionRepository, eventRepository,
            evidenceRepository, financialRepository, analysisRunRepository, riskPolicy, Clock.systemUTC()
        );
    }

    HistoricalReplayService(
        IssuerRepository issuerRepository,
        DisclosureRepository disclosureRepository,
        DisclosureVersionRepository versionRepository,
        RiskEventRepository eventRepository,
        RiskEventEvidenceRepository evidenceRepository,
        FinancialSnapshotRepository financialRepository,
        AnalysisRunRepository analysisRunRepository,
        RiskPolicy riskPolicy,
        Clock clock
    ) {
        this.issuerRepository = issuerRepository;
        this.disclosureRepository = disclosureRepository;
        this.versionRepository = versionRepository;
        this.eventRepository = eventRepository;
        this.evidenceRepository = evidenceRepository;
        this.financialRepository = financialRepository;
        this.analysisRunRepository = analysisRunRepository;
        this.riskPolicy = riskPolicy;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ReplayResult replay(Long issuerId, LocalDate cutoffDate) {
        long startedNanos = System.nanoTime();
        if (cutoffDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cutoffDate is required");
        }
        Issuer issuer = issuerRepository.findById(issuerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issuer not found"));
        Instant cutoffInstant = endOfDay(cutoffDate);
        List<Disclosure> disclosures = disclosureRepository
            .findAllByIssuerIdAndPublishedAtLessThanEqualOrderByPublishedAtAscIdAsc(issuerId, cutoffInstant);
        Map<Long, List<DisclosureVersion>> versionsByDisclosure = disclosures.stream().collect(Collectors.toMap(
            Disclosure::getId,
            disclosure -> versionRepository
                .findAllByDisclosureIdAndPublishedAtLessThanEqualOrderByPublishedAtDescVersionNumberDesc(
                    disclosure.getId(), cutoffInstant
                )
        ));
        List<FinancialSnapshot> financials = financialRepository
            .findAllByIssuerIdAndPublishedOnLessThanEqualOrderByStatementDateDescIdDesc(issuerId, cutoffDate)
            .stream().filter(snapshot -> !snapshot.getStatementDate().isAfter(cutoffDate)).toList();
        List<RiskEventSource> allSources = eventRepository.findAllByIssuerIdOrderByEventDateAscIdAsc(issuerId)
            .stream().map(this::eventSource).toList();

        Map<Long, DisclosureVersion> selectedVersions = selectedVersionsAt(
            disclosures, versionsByDisclosure, cutoffDate
        );
        List<RiskEventSource> selectedEvents = selectedEventsAt(
            allSources, selectedVersions, cutoffDate
        );
        RiskPolicy.PolicyResult finalPolicy = evaluate(cutoffDate, financials, selectedEvents);
        List<ReplayRiskChange> changes = replayChanges(
            cutoffDate, disclosures, versionsByDisclosure, financials, allSources
        );
        List<DisclosureUsed> disclosuresUsed = disclosures.stream()
            .map(disclosure -> disclosureUsed(disclosure, selectedVersions.get(disclosure.getId())))
            .filter(java.util.Objects::nonNull)
            .toList();
        List<FinancialSnapshotView> financialViews = financials.stream().map(FinancialSnapshotView::from).toList();
        ReplayRiskSnapshot riskSnapshot = riskSnapshot(cutoffDate, finalPolicy);
        List<TimelineItem> timeline = timeline(disclosuresUsed, selectedEvents, financialViews, changes);
        Set<String> models = new TreeSet<>();
        Set<String> prompts = new TreeSet<>();
        selectedVersions.values().forEach(version -> analysisRunRepository
            .findFirstByDisclosureVersionIdAndStatusOrderByIdDesc(version.getId(), AnalysisRun.Status.SUCCESS)
            .ifPresent(run -> {
                models.add(run.getModel());
                prompts.add(run.getPromptVersion());
            }));
        String fingerprint = fingerprint(
            issuerId, cutoffDate, selectedVersions.values(), selectedEvents, financials
        );
        return new ReplayResult(
            new IssuerView(issuer.getId(), issuer.getName(), issuer.getCorpCode()),
            cutoffDate,
            disclosuresUsed,
            selectedEvents.stream().map(RiskEventSource::view).toList(),
            financialViews.isEmpty() ? null : financialViews.getFirst(),
            riskSnapshot,
            changes,
            timeline,
            new ReplayMetadata(
                RiskPolicy.RULE_VERSION,
                List.copyOf(prompts),
                List.copyOf(models),
                fingerprint,
                Instant.now(clock),
                Math.max(0, (System.nanoTime() - startedNanos) / 1_000_000)
            )
        );
    }

    private Map<Long, DisclosureVersion> selectedVersionsAt(
        List<Disclosure> disclosures,
        Map<Long, List<DisclosureVersion>> versionsByDisclosure,
        LocalDate point
    ) {
        Instant pointEnd = endOfDay(point);
        return disclosures.stream()
            .filter(disclosure -> !disclosure.getPublishedAt().isAfter(pointEnd))
            .map(disclosure -> versionsByDisclosure.getOrDefault(disclosure.getId(), List.of()).stream()
                .filter(version -> !version.getPublishedAt().isAfter(pointEnd))
                .max(Comparator.comparing(DisclosureVersion::getPublishedAt)
                    .thenComparingInt(DisclosureVersion::getVersionNumber))
                .orElse(null))
            .filter(java.util.Objects::nonNull)
            .collect(Collectors.toMap(DisclosureVersion::getDisclosureId, Function.identity()));
    }

    private List<RiskEventSource> selectedEventsAt(
        List<RiskEventSource> sources,
        Map<Long, DisclosureVersion> selectedVersions,
        LocalDate point
    ) {
        Set<Long> versionIds = selectedVersions.values().stream()
            .map(DisclosureVersion::getId).collect(Collectors.toSet());
        return sources.stream()
            .filter(source -> versionIds.contains(source.sourceVersionId()))
            .filter(source -> !source.effectiveDate().isAfter(point))
            .sorted(Comparator.comparing(RiskEventSource::effectiveDate).thenComparingLong(RiskEventSource::id))
            .toList();
    }

    private RiskPolicy.PolicyResult evaluate(
        LocalDate point,
        List<FinancialSnapshot> financials,
        List<RiskEventSource> events
    ) {
        List<FinancialSnapshot> available = financials.stream()
            .filter(snapshot -> !snapshot.getPublishedOn().isAfter(point))
            .filter(snapshot -> !snapshot.getStatementDate().isAfter(point))
            .sorted(Comparator.comparing(FinancialSnapshot::getStatementDate).reversed()
                .thenComparing(FinancialSnapshot::getPublishedOn, Comparator.reverseOrder())
                .thenComparing(FinancialSnapshot::getId, Comparator.reverseOrder()))
            .toList();
        FinancialSnapshot current = available.isEmpty() ? null : available.getFirst();
        FinancialSnapshot previous = available.size() < 2 ? null : available.get(1);
        return riskPolicy.evaluate(
            point,
            current,
            previous,
            events.stream().map(RiskEventSource::signal).toList()
        );
    }

    private List<ReplayRiskChange> replayChanges(
        LocalDate cutoffDate,
        List<Disclosure> disclosures,
        Map<Long, List<DisclosureVersion>> versionsByDisclosure,
        List<FinancialSnapshot> financials,
        List<RiskEventSource> allSources
    ) {
        TreeSet<LocalDate> points = new TreeSet<>();
        points.add(cutoffDate);
        financials.forEach(snapshot -> points.add(snapshot.getPublishedOn()));
        versionsByDisclosure.values().stream().flatMap(List::stream)
            .map(version -> publicationDate(version.getPublishedAt()))
            .filter(date -> !date.isAfter(cutoffDate))
            .forEach(points::add);
        allSources.stream().map(source -> source.effectiveDate().plusDays(181))
            .filter(date -> !date.isAfter(cutoffDate)).forEach(points::add);

        Map<RiskCategory, RiskState> previousStates = normalStates();
        List<ReplayRiskChange> changes = new ArrayList<>();
        for (LocalDate point : points) {
            Map<Long, DisclosureVersion> selected = selectedVersionsAt(disclosures, versionsByDisclosure, point);
            List<RiskEventSource> events = selectedEventsAt(allSources, selected, point);
            Map<RiskCategory, RiskState> currentStates = states(evaluate(point, financials, events));
            for (RiskCategory category : RiskCategory.values()) {
                RiskState previous = previousStates.get(category);
                RiskState current = currentStates.get(category);
                if (previous != current) {
                    changes.add(new ReplayRiskChange(point, category, previous, current));
                }
            }
            previousStates = currentStates;
        }
        return List.copyOf(changes);
    }

    private RiskEventSource eventSource(RiskEvent event) {
        DisclosureVersion version = versionRepository.findById(event.getDisclosureVersionId())
            .orElseThrow(() -> new IllegalStateException("DisclosureVersion not found for RiskEvent"));
        List<RiskEventEvidence> evidence = evidenceRepository.findAllByRiskEventIdOrderByIdAsc(event.getId());
        LocalDate sourcePublishedOn = publicationDate(version.getPublishedAt());
        LocalDate effectiveDate = event.getEventDate() == null ? sourcePublishedOn : event.getEventDate();
        String evidenceText = evidence.stream().map(RiskEventEvidence::getEvidenceText)
            .collect(Collectors.joining(" "));
        return new RiskEventSource(
            event.getId(), event.getDisclosureVersionId(), event.getEventType().name(),
            event.getEventDate(), effectiveDate, version.getPublishedAt(), event.getAmount(),
            event.getCurrency(), evidenceText
        );
    }

    private DisclosureUsed disclosureUsed(Disclosure disclosure, DisclosureVersion version) {
        if (version == null) return null;
        return new DisclosureUsed(
            disclosure.getId(), disclosure.getTitle(), disclosure.getReceiptNo(), disclosure.getPublishedAt(),
            version.getId(), version.getVersionNumber(), version.getSourceReceiptNo(), version.getPublishedAt(),
            version.getDocumentHash()
        );
    }

    private ReplayRiskSnapshot riskSnapshot(LocalDate cutoffDate, RiskPolicy.PolicyResult result) {
        Map<RiskCategory, RiskState> states = states(result);
        RiskState overall = states.values().stream().reduce(RiskState.NORMAL, RiskState::max);
        return new ReplayRiskSnapshot(
            cutoffDate, overall, states.get(RiskCategory.LIQUIDITY), states.get(RiskCategory.CASH_FLOW),
            states.get(RiskCategory.LEVERAGE), states.get(RiskCategory.EARNINGS),
            states.get(RiskCategory.CREDIT), result.features(), result.decisions(), result.ruleVersion()
        );
    }

    private Map<RiskCategory, RiskState> states(RiskPolicy.PolicyResult result) {
        Map<RiskCategory, RiskState> states = new EnumMap<>(RiskCategory.class);
        result.decisions().forEach(decision -> states.put(decision.category(), decision.state()));
        return states;
    }

    private Map<RiskCategory, RiskState> normalStates() {
        Map<RiskCategory, RiskState> states = new EnumMap<>(RiskCategory.class);
        for (RiskCategory category : RiskCategory.values()) states.put(category, RiskState.NORMAL);
        return states;
    }

    private List<TimelineItem> timeline(
        List<DisclosureUsed> disclosures,
        List<RiskEventSource> events,
        List<FinancialSnapshotView> financials,
        List<ReplayRiskChange> changes
    ) {
        List<TimelineItem> timeline = new ArrayList<>();
        disclosures.forEach(disclosure -> timeline.add(new TimelineItem(
            publicationDate(disclosure.versionPublishedAt()), "DISCLOSURE",
            disclosure.title(), "공개 당시 사용 가능한 Version " + disclosure.versionNumber(),
            disclosure.versionId(), null
        )));
        events.forEach(event -> timeline.add(new TimelineItem(
            publicationDate(event.sourcePublishedAt()), "RISK_EVENT", event.eventType(),
            event.evidenceText(), event.sourceVersionId(), event.id()
        )));
        financials.forEach(financial -> timeline.add(new TimelineItem(
            financial.publishedOn(), "FINANCIAL_SNAPSHOT", financial.period(),
            "기준일 " + financial.statementDate(), financial.id(), null
        )));
        changes.forEach(change -> timeline.add(new TimelineItem(
            change.detectedOn(), "RISK_CHANGE", change.category().name(),
            change.previousState() + " → " + change.currentState(), null, null
        )));
        return timeline.stream().sorted(
            Comparator.comparing(TimelineItem::date)
                .thenComparingInt(item -> timelineOrder(item.type()))
                .thenComparing(item -> item.sourceId() == null ? Long.MAX_VALUE : item.sourceId())
        ).toList();
    }

    private int timelineOrder(String type) {
        return switch (type) {
            case "DISCLOSURE" -> 0;
            case "RISK_EVENT" -> 1;
            case "FINANCIAL_SNAPSHOT" -> 2;
            case "RISK_CHANGE" -> 3;
            default -> 4;
        };
    }

    private String fingerprint(
        Long issuerId,
        LocalDate cutoffDate,
        java.util.Collection<DisclosureVersion> versions,
        List<RiskEventSource> events,
        List<FinancialSnapshot> financials
    ) {
        String input = issuerId + "|" + cutoffDate + "|" + RiskPolicy.RULE_VERSION
            + "|versions=" + joinIds(versions.stream().map(DisclosureVersion::getId).toList())
            + "|events=" + joinIds(events.stream().map(RiskEventSource::id).toList())
            + "|financials=" + joinIds(financials.stream().map(FinancialSnapshot::getId).toList());
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private String joinIds(List<Long> ids) {
        return ids.stream().sorted().map(String::valueOf).collect(Collectors.joining(","));
    }

    private Instant endOfDay(LocalDate date) {
        return date.plusDays(1).atStartOfDay(PRODUCT_ZONE).toInstant().minusNanos(1);
    }

    private LocalDate publicationDate(Instant publishedAt) {
        return publishedAt.atZone(PRODUCT_ZONE).toLocalDate();
    }

    private record RiskEventSource(
        long id,
        Long sourceVersionId,
        String eventType,
        LocalDate eventDate,
        LocalDate effectiveDate,
        Instant sourcePublishedAt,
        BigDecimal amount,
        String currency,
        String evidenceText
    ) {
        private RiskPolicy.EventSignal signal() {
            return new RiskPolicy.EventSignal(
                id,
                com.bonda.ai.domain.RiskEventType.valueOf(eventType),
                effectiveDate,
                evidenceText
            );
        }

        private RiskEventView view() {
            return new RiskEventView(
                id, sourceVersionId, eventType, eventDate, effectiveDate, sourcePublishedAt,
                amount, currency, evidenceText
            );
        }
    }

    public record ReplayResult(
        IssuerView issuer,
        LocalDate cutoffDate,
        List<DisclosureUsed> disclosuresUsed,
        List<RiskEventView> riskEvents,
        FinancialSnapshotView financialSnapshot,
        ReplayRiskSnapshot riskSnapshot,
        List<ReplayRiskChange> riskChanges,
        List<TimelineItem> timeline,
        ReplayMetadata metadata
    ) {
    }

    public record IssuerView(Long id, String name, String corpCode) {
    }

    public record DisclosureUsed(
        Long disclosureId,
        String title,
        String receiptNo,
        Instant publishedAt,
        Long versionId,
        int versionNumber,
        String sourceReceiptNo,
        Instant versionPublishedAt,
        String documentHash
    ) {
    }

    public record RiskEventView(
        Long id,
        Long sourceVersionId,
        String eventType,
        LocalDate eventDate,
        LocalDate effectiveDate,
        Instant sourcePublishedAt,
        BigDecimal amount,
        String currency,
        String evidenceText
    ) {
    }

    public record FinancialSnapshotView(
        Long id,
        String period,
        LocalDate statementDate,
        LocalDate publishedOn,
        BigDecimal cash,
        BigDecimal shortTermDebt,
        BigDecimal totalDebt,
        BigDecimal operatingCashFlow,
        BigDecimal operatingProfit
    ) {
        static FinancialSnapshotView from(FinancialSnapshot snapshot) {
            return new FinancialSnapshotView(
                snapshot.getId(), snapshot.getPeriod(), snapshot.getStatementDate(), snapshot.getPublishedOn(),
                snapshot.getCash(), snapshot.getShortTermDebt(), snapshot.getTotalDebt(),
                snapshot.getOperatingCashFlow(), snapshot.getOperatingProfit()
            );
        }
    }

    public record ReplayRiskSnapshot(
        LocalDate asOf,
        RiskState overall,
        RiskState liquidity,
        RiskState cashFlow,
        RiskState leverage,
        RiskState earnings,
        RiskState credit,
        FinancialFeatures features,
        List<RiskPolicy.RiskDecision> decisions,
        String ruleVersion
    ) {
    }

    public record ReplayRiskChange(
        LocalDate detectedOn,
        RiskCategory category,
        RiskState previousState,
        RiskState currentState
    ) {
    }

    public record TimelineItem(
        LocalDate date,
        String type,
        String title,
        String summary,
        Long sourceId,
        Long riskEventId
    ) {
    }

    public record ReplayMetadata(
        String riskRuleVersion,
        List<String> promptVersions,
        List<String> models,
        String inputFingerprint,
        Instant executedAt,
        long executionTimeMs
    ) {
    }
}
