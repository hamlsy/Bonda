package com.bonda.ai.presentation;

import com.bonda.ai.application.CandidateValidationService;
import com.bonda.alert.application.MonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/candidates")
public class CandidateValidationAdminController {

    private final MonitoringService monitoringService;

    public CandidateValidationAdminController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @PostMapping("/{candidateId}/validate")
    public ResponseEntity<CandidateValidationService.ValidationResponse> validate(
        @PathVariable Long candidateId
    ) {
        return ResponseEntity.ok(monitoringService.validateAndMonitor(candidateId));
    }
}
