package com.bonda.ai.presentation;

import com.bonda.ai.application.RiskAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analysis")
public class AnalysisAdminController {

    private final RiskAnalysisService analysisService;

    public AnalysisAdminController(RiskAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/{disclosureVersionId}")
    public ResponseEntity<RiskAnalysisService.AnalysisResult> analyze(
        @PathVariable Long disclosureVersionId
    ) {
        return ResponseEntity.ok(analysisService.analyze(disclosureVersionId));
    }
}
