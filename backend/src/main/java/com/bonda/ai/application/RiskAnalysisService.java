package com.bonda.ai.application;

import com.bonda.ai.domain.AnalysisRun;
import com.bonda.ai.domain.CandidateRiskEvent;
import com.bonda.ai.infrastructure.AnalysisRunRepository;
import com.bonda.ai.infrastructure.CandidateRiskEventRepository;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import com.bonda.issuer.domain.Issuer;
import com.bonda.issuer.infrastructure.IssuerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class RiskAnalysisService {

    private static final String ANALYZE = "ANALYZE";

    private final DisclosureVersionRepository versionRepository;
    private final DisclosureRepository disclosureRepository;
    private final IssuerRepository issuerRepository;
    private final AnalysisRunRepository runRepository;
    private final CandidateRiskEventRepository candidateRepository;
    private final RiskEventExtractor extractor;
    private final RiskExtractionPrompt prompt;
    private final AnalysisInputContextBuilder contextBuilder;
    private final AnalysisRunLifecycle lifecycle;

    public RiskAnalysisService(
        DisclosureVersionRepository versionRepository,
        DisclosureRepository disclosureRepository,
        IssuerRepository issuerRepository,
        AnalysisRunRepository runRepository,
        CandidateRiskEventRepository candidateRepository,
        RiskEventExtractor extractor,
        RiskExtractionPrompt prompt,
        AnalysisInputContextBuilder contextBuilder,
        AnalysisRunLifecycle lifecycle
    ) {
        this.versionRepository = versionRepository;
        this.disclosureRepository = disclosureRepository;
        this.issuerRepository = issuerRepository;
        this.runRepository = runRepository;
        this.candidateRepository = candidateRepository;
        this.extractor = extractor;
        this.prompt = prompt;
        this.contextBuilder = contextBuilder;
        this.lifecycle = lifecycle;
    }

    public AnalysisResult analyze(Long disclosureVersionId) {
        DisclosureVersion version = versionRepository.findById(disclosureVersionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "DisclosureVersion not found"));
        if (!ANALYZE.equals(version.getPreFilterDecision())) {
            return AnalysisResult.skipped(disclosureVersionId, "PRE_FILTER_NOT_ANALYZE");
        }

        String model = extractor.model();
        AnalysisRun existing = runRepository
            .findFirstByDocumentHashAndModelAndPromptVersionAndStatusOrderByIdDesc(
                version.getDocumentHash(),
                model,
                prompt.version(),
                AnalysisRun.Status.SUCCESS
            )
            .orElse(null);
        if (existing != null) {
            return AnalysisResult.from(
                existing,
                candidateRepository.findAllByAnalysisRunIdOrderByIdAsc(existing.getId()),
                true
            );
        }

        Disclosure disclosure = disclosureRepository.findById(version.getDisclosureId())
            .orElseThrow(() -> new IllegalStateException("Disclosure not found for version"));
        Issuer issuer = issuerRepository.findById(disclosure.getIssuerId())
            .orElseThrow(() -> new IllegalStateException("Issuer not found for disclosure"));
        RiskEventExtractor.ExtractionRequest request = contextBuilder.build(issuer, disclosure, version);

        Long runId = lifecycle.start(disclosureVersionId, version.getDocumentHash(), model, prompt.version());
        long startedNanos = System.nanoTime();
        try {
            RiskEventExtractor.ExtractionResult extraction = extractor.extract(request);
            long latencyMs = elapsedMillis(startedNanos);
            AnalysisRunLifecycle.Completion completion = lifecycle.completeSuccess(
                runId,
                issuer.getId(),
                disclosureVersionId,
                extraction,
                latencyMs
            );
            return AnalysisResult.from(completion.run(), completion.candidates(), false);
        } catch (RiskExtractionException exception) {
            long latencyMs = elapsedMillis(startedNanos);
            AnalysisRun failed = lifecycle.completeFailure(
                runId,
                exception.getErrorType(),
                exception.getMessage(),
                latencyMs,
                exception.getAttempts()
            );
            return AnalysisResult.from(failed, List.of(), false);
        } catch (RuntimeException exception) {
            long latencyMs = elapsedMillis(startedNanos);
            AnalysisRun failed = lifecycle.completeFailure(
                runId,
                RiskExtractionException.ErrorType.INTERNAL_ERROR,
                "Unexpected extraction failure",
                latencyMs,
                1
            );
            return AnalysisResult.from(failed, List.of(), false);
        }
    }

    private long elapsedMillis(long startedNanos) {
        return Math.max(0, (System.nanoTime() - startedNanos) / 1_000_000);
    }

    public record AnalysisResult(
        Long analysisRunId,
        Long disclosureVersionId,
        String status,
        boolean reused,
        String model,
        String promptVersion,
        Integer inputTokens,
        Integer outputTokens,
        Long latencyMs,
        BigDecimal estimatedCost,
        int retryCount,
        String errorType,
        String message,
        List<CandidateResult> candidates
    ) {
        static AnalysisResult skipped(Long disclosureVersionId, String message) {
            return new AnalysisResult(
                null, disclosureVersionId, "SKIPPED", false, null, RiskExtractionPrompt.VERSION,
                null, null, null, null, 0, null, message, List.of()
            );
        }

        static AnalysisResult from(AnalysisRun run, List<CandidateRiskEvent> candidates, boolean reused) {
            return new AnalysisResult(
                run.getId(),
                run.getDisclosureVersionId(),
                run.getStatus().name(),
                reused,
                run.getModel(),
                run.getPromptVersion(),
                run.getInputTokens(),
                run.getOutputTokens(),
                run.getLatencyMs(),
                run.getEstimatedCost(),
                run.getRetryCount(),
                run.getErrorType(),
                run.getErrorMessage(),
                candidates.stream().map(CandidateResult::from).toList()
            );
        }
    }

    public record CandidateResult(
        Long id,
        String eventType,
        LocalDate eventDate,
        BigDecimal amount,
        String currency,
        String purpose,
        String evidenceText,
        String extractionReason,
        String status,
        Instant createdAt
    ) {
        static CandidateResult from(CandidateRiskEvent candidate) {
            return new CandidateResult(
                candidate.getId(),
                candidate.getEventType().name(),
                candidate.getEventDate(),
                candidate.getAmount(),
                candidate.getCurrency(),
                candidate.getPurpose(),
                candidate.getEvidenceText(),
                candidate.getExtractionReason(),
                candidate.getStatus().name(),
                candidate.getCreatedAt()
            );
        }
    }
}
