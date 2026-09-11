package com.bonda.ai.application;

import com.bonda.ai.domain.AnalysisRun;
import com.bonda.ai.domain.CandidateRiskEvent;
import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.domain.RiskEventEvidence;
import com.bonda.ai.infrastructure.AnalysisRunRepository;
import com.bonda.ai.infrastructure.CandidateRiskEventRepository;
import com.bonda.ai.infrastructure.RiskEventEvidenceRepository;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.util.Arrays;
import java.util.List;

@Service
public class CandidateValidationService {

    private static final String VALIDATED = "VALIDATED";
    private static final String DUPLICATE_LINKED = "DUPLICATE_LINKED_TO_EXISTING_CANONICAL";

    private final CandidateRiskEventRepository candidateRepository;
    private final AnalysisRunRepository runRepository;
    private final DisclosureVersionRepository versionRepository;
    private final DisclosureRepository disclosureRepository;
    private final RiskEventRepository riskEventRepository;
    private final RiskEventEvidenceRepository evidenceRepository;
    private final CandidateRiskEventValidator validator;
    private final Clock clock;

    @Autowired
    public CandidateValidationService(
        CandidateRiskEventRepository candidateRepository,
        AnalysisRunRepository runRepository,
        DisclosureVersionRepository versionRepository,
        DisclosureRepository disclosureRepository,
        RiskEventRepository riskEventRepository,
        RiskEventEvidenceRepository evidenceRepository,
        CandidateRiskEventValidator validator
    ) {
        this(
            candidateRepository,
            runRepository,
            versionRepository,
            disclosureRepository,
            riskEventRepository,
            evidenceRepository,
            validator,
            Clock.systemUTC()
        );
    }

    CandidateValidationService(
        CandidateRiskEventRepository candidateRepository,
        AnalysisRunRepository runRepository,
        DisclosureVersionRepository versionRepository,
        DisclosureRepository disclosureRepository,
        RiskEventRepository riskEventRepository,
        RiskEventEvidenceRepository evidenceRepository,
        CandidateRiskEventValidator validator,
        Clock clock
    ) {
        this.candidateRepository = candidateRepository;
        this.runRepository = runRepository;
        this.versionRepository = versionRepository;
        this.disclosureRepository = disclosureRepository;
        this.riskEventRepository = riskEventRepository;
        this.evidenceRepository = evidenceRepository;
        this.validator = validator;
        this.clock = clock;
    }

    @Transactional
    public ValidationResponse validate(Long candidateId) {
        CandidateRiskEvent candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CandidateRiskEvent not found"));
        if (candidate.getStatus() != CandidateRiskEvent.Status.PENDING) {
            return existingResult(candidate);
        }

        AnalysisRun run = runRepository.findById(candidate.getAnalysisRunId())
            .orElseThrow(() -> new IllegalStateException("AnalysisRun not found for candidate"));
        DisclosureVersion version = versionRepository.findById(candidate.getDisclosureVersionId())
            .orElseThrow(() -> new IllegalStateException("DisclosureVersion not found for candidate"));
        Disclosure disclosure = disclosureRepository.findById(version.getDisclosureId())
            .orElseThrow(() -> new IllegalStateException("Disclosure not found for candidate"));

        CandidateRiskEventValidator.ValidationResult validation = validator.validate(
            candidate,
            run,
            disclosure,
            version
        );
        if (!validation.valid()) {
            candidate.reject(
                String.join("\n", validation.reasons()),
                validation.ruleVersion(),
                clock.instant()
            );
            return response(candidate, validation.reasons(), null, false, validation.matchedEvidence());
        }

        RiskEvent duplicate = riskEventRepository.findByEventFingerprint(validation.fingerprint()).orElse(null);
        if (duplicate != null) {
            candidate.verify(duplicate.getId(), DUPLICATE_LINKED, validation.ruleVersion(), clock.instant());
            return response(candidate, List.of(DUPLICATE_LINKED), duplicate.getId(), true, null);
        }

        RiskEvent riskEvent = riskEventRepository.save(RiskEvent.create(
            candidate.getIssuerId(),
            candidate.getDisclosureVersionId(),
            candidate.getId(),
            candidate.getEventType(),
            validation.normalizedEventDate(),
            validation.normalizedAmount(),
            validation.normalizedCurrency(),
            candidate.getPurpose(),
            validation.fingerprint()
        ));
        RiskEventEvidence evidence = evidenceRepository.save(RiskEventEvidence.create(
            riskEvent.getId(),
            candidate.getDisclosureVersionId(),
            validation.section(),
            validation.matchedEvidence(),
            null
        ));
        candidate.verify(riskEvent.getId(), VALIDATED, validation.ruleVersion(), clock.instant());
        return response(candidate, List.of(VALIDATED), riskEvent.getId(), false, evidence.getEvidenceText());
    }

    private ValidationResponse existingResult(CandidateRiskEvent candidate) {
        List<String> reasons = splitReasons(candidate.getValidationReason());
        return response(
            candidate,
            reasons,
            candidate.getCanonicalRiskEventId(),
            DUPLICATE_LINKED.equals(candidate.getValidationReason()),
            null
        );
    }

    private ValidationResponse response(
        CandidateRiskEvent candidate,
        List<String> reasons,
        Long canonicalRiskEventId,
        boolean duplicate,
        String evidenceText
    ) {
        return new ValidationResponse(
            candidate.getId(),
            candidate.getStatus().name(),
            reasons,
            candidate.getValidationRuleVersion(),
            canonicalRiskEventId,
            duplicate,
            evidenceText
        );
    }

    private List<String> splitReasons(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split("\\R")).toList();
    }

    public record ValidationResponse(
        Long candidateId,
        String status,
        List<String> reasons,
        String ruleVersion,
        Long canonicalRiskEventId,
        boolean duplicate,
        String evidenceText
    ) {
        public ValidationResponse {
            reasons = List.copyOf(reasons);
        }
    }
}
