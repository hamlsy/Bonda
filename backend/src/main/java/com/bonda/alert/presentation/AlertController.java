package com.bonda.alert.presentation;

import com.bonda.alert.application.AlertService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<AlertService.AlertView> findAll(
        @RequestParam(defaultValue = "false") boolean unreadOnly,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return alertService.findAll(unreadOnly, limit);
    }

    @PatchMapping("/{alertId}/read")
    public AlertService.AlertView markRead(@PathVariable Long alertId) {
        return alertService.markRead(alertId);
    }
}

