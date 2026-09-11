package com.bonda.sincebought.presentation;

import com.bonda.sincebought.application.RiskEventDetailService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/risk-events")
public class RiskEventController {

    private final RiskEventDetailService detailService;

    public RiskEventController(RiskEventDetailService detailService) {
        this.detailService = detailService;
    }

    @GetMapping("/{riskEventId}")
    public RiskEventDetailService.RiskEventDetail find(@PathVariable Long riskEventId) {
        return detailService.find(riskEventId);
    }
}
