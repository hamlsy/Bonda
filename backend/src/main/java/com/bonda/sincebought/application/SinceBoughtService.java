package com.bonda.sincebought.application;

import com.bonda.risk.domain.FinancialSnapshot;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
public class SinceBoughtService {

    private final SinceBoughtDataAssembler dataAssembler;
    private final CrossDocumentExplanationService explanationService;
    private final Clock clock;

    @Autowired
    public SinceBoughtService(
        SinceBoughtDataAssembler dataAssembler,
        CrossDocumentExplanationService explanationService
    ) {
        this(dataAssembler, explanationService, Clock.systemUTC());
    }

    SinceBoughtService(
        SinceBoughtDataAssembler dataAssembler,
        CrossDocumentExplanationService explanationService,
        Clock clock
    ) {
        this.dataAssembler = dataAssembler;
        this.explanationService = explanationService;
        this.clock = clock;
    }

    public SinceBoughtView find(Long holdingId) {
        SinceBoughtDataAssembler.SinceBoughtData data = dataAssembler.assemble(holdingId);
        CrossDocumentExplanationService.ExplanationView explanation = explanationService.explain(data);
        return new SinceBoughtView(
            data.holding(),
            data.currentRiskState(),
            data.timeline(),
            data.financialChanges(),
            new FinancialContext(
                FinancialPoint.from(data.baselineFinancial()),
                FinancialPoint.from(data.currentFinancial())
            ),
            explanation,
            clock.instant()
        );
    }

    public record FinancialPoint(Long id, String period, java.time.LocalDate statementDate) {
        static FinancialPoint from(FinancialSnapshot snapshot) {
            return snapshot == null ? null : new FinancialPoint(
                snapshot.getId(),
                snapshot.getPeriod(),
                snapshot.getStatementDate()
            );
        }
    }

    public record FinancialContext(FinancialPoint baseline, FinancialPoint current) {
    }

    public record SinceBoughtView(
        SinceBoughtDataAssembler.HoldingSummary holding,
        SinceBoughtDataAssembler.CurrentRiskState currentRiskState,
        List<SinceBoughtDataAssembler.TimelineItem> timeline,
        List<FinancialChangeCalculator.FinancialChange> financialChanges,
        FinancialContext financialContext,
        CrossDocumentExplanationService.ExplanationView explanation,
        Instant updatedAt
    ) {
        public SinceBoughtView {
            timeline = List.copyOf(timeline);
            financialChanges = List.copyOf(financialChanges);
        }
    }
}
