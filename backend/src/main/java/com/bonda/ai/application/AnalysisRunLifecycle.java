package com.bonda.ai.application;

import com.bonda.ai.domain.AnalysisRun;
import com.bonda.ai.domain.CandidateRiskEvent;
import com.bonda.ai.infrastructure.AnalysisRunRepository;
import com.bonda.ai.infrastructure.CandidateRiskEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalysisRunLifecycle {

    private final AnalysisRunRepository runRepository;
    private final CandidateRiskEventRepository candidateRepository;
    private final AiCostCalculator costCalculator;
    private final Clock clock;

    @Autowired
    public AnalysisRunLifecycle(
        AnalysisRunRepository runRepository,
        CandidateRiskEventRepository candidateRepository,
        AiCostCalculator costCalculator
    ) {
        this(runRepository, candidateRepository, costCalculator, Clock.systemUTC());
    }

    AnalysisRunLifecycle(
        AnalysisRunRepository runRepository,
        CandidateRiskEventRepository candidateRepository,
        AiCostCalculator costCalculator,
        Clock clock
    ) {
        this.runRepository = runRepository;
        this.candidateRepository = candidateRepository;
        this.costCalculator = costCalculator;
        this.clock = clock;
    }

    @Transactional
    public Long start(Long disclosureVersionId, String documentHash, String model, String promptVersion) {
        AnalysisRun run = runRepository.save(AnalysisRun.create(
            disclosureVersionId,
            documentHash,
            model,
            promptVersion
        ));
        run.markProcessing(clock.instant());
        return run.getId();
    }

    @Transactional
    public Completion completeSuccess(
        Long runId,
        Long issuerId,
        Long disclosureVersionId,
        RiskEventExtractor.ExtractionResult extraction,
        long latencyMs
    ) {
        AnalysisRun run = requireRun(runId);
        Map<String, CandidateRiskEvent> uniqueCandidates = new LinkedHashMap<>();
        for (RiskEventExtractor.ExtractedEvent event : extraction.events()) {
            CandidateRiskEvent candidate = CandidateRiskEvent.create(
                runId,
                issuerId,
                disclosureVersionId,
                event.eventType(),
                event.eventDate(),
                event.amount(),
                event.currency(),
                event.purpose(),
                event.evidenceText(),
                event.extractionReason()
            );
            uniqueCandidates.putIfAbsent(candidate.getFingerprint(), candidate);
        }
        List<CandidateRiskEvent> saved = candidateRepository.saveAll(uniqueCandidates.values());
        run.markSuccess(
            extraction.inputTokens(),
            extraction.outputTokens(),
            latencyMs,
            costCalculator.estimate(run.getModel(), extraction.inputTokens(), extraction.outputTokens()),
            extraction.attempts() - 1,
            clock.instant()
        );
        return new Completion(run, saved);
    }

    @Transactional
    public AnalysisRun completeFailure(
        Long runId,
        RiskExtractionException.ErrorType errorType,
        String message,
        long latencyMs,
        int attempts
    ) {
        AnalysisRun run = requireRun(runId);
        run.markFailed(errorType.name(), message, latencyMs, Math.max(0, attempts - 1), clock.instant());
        return run;
    }

    private AnalysisRun requireRun(Long runId) {
        return runRepository.findById(runId)
            .orElseThrow(() -> new IllegalStateException("AnalysisRun not found: " + runId));
    }

    public record Completion(AnalysisRun run, List<CandidateRiskEvent> candidates) {
        public Completion {
            candidates = List.copyOf(candidates);
        }
    }
}
