package com.bonda.ai.presentation;

import com.bonda.ai.application.CandidateValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/candidates")
public class CandidateValidationAdminController {

    private final CandidateValidationService validationService;

    public CandidateValidationAdminController(CandidateValidationService validationService) {
        this.validationService = validationService;
    }

    @PostMapping("/{candidateId}/validate")
    public ResponseEntity<CandidateValidationService.ValidationResponse> validate(
        @PathVariable Long candidateId
    ) {
        return ResponseEntity.ok(validationService.validate(candidateId));
    }
}
