package com.bonda.alert.application;

import com.bonda.ai.application.CandidateValidationService;
import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.infrastructure.RiskEventRepository;
import com.bonda.risk.application.RiskRecalculationService;
import com.bonda.risk.domain.RiskChange;
import com.bonda.risk.infrastructure.RiskChangeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MonitoringService {

    private final CandidateValidationService validationService;
    private final RiskEventRepository riskEventRepository;
    private final RiskRecalculationService recalculationService;
    private final RiskChangeRepository riskChangeRepository;
    private final AlertGenerationService alertGenerationService;

    public MonitoringService(
        CandidateValidationService validationService,
        RiskEventRepository riskEventRepository,
        RiskRecalculationService recalculationService,
        RiskChangeRepository riskChangeRepository,
        AlertGenerationService alertGenerationService
    ) {
        this.validationService = validationService;
        this.riskEventRepository = riskEventRepository;
        this.recalculationService = recalculationService;
        this.riskChangeRepository = riskChangeRepository;
        this.alertGenerationService = alertGenerationService;
    }

    public CandidateValidationService.ValidationResponse validateAndMonitor(Long candidateId) {
        CandidateValidationService.ValidationResponse validation = validationService.validate(candidateId);
        if (!"VERIFIED".equals(validation.status()) || validation.canonicalRiskEventId() == null) {
            return validation;
        }
        RiskEvent event = riskEventRepository.findById(validation.canonicalRiskEventId())
            .orElseThrow(() -> new IllegalStateException("Canonical RiskEvent not found after validation"));
        RiskRecalculationService.RecalculationResult recalculation = recalculationService.recalculate(
            event.getIssuerId()
        );
        alertGenerationService.generate(event, changes(recalculation));
        return validation;
    }

    public RiskRecalculationService.RecalculationResult recalculateAndMonitor(Long issuerId) {
        RiskRecalculationService.RecalculationResult recalculation = recalculationService.recalculate(issuerId);
        alertGenerationService.generate(null, changes(recalculation));
        return recalculation;
    }

    private List<RiskChange> changes(RiskRecalculationService.RecalculationResult result) {
        return riskChangeRepository.findAllById(
            result.changes().stream().map(RiskRecalculationService.ChangeResult::id).toList()
        );
    }
}

