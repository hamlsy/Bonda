package com.bonda.sincebought.presentation;

import com.bonda.sincebought.application.SinceBoughtService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/holdings")
public class SinceBoughtController {

    private final SinceBoughtService service;

    public SinceBoughtController(SinceBoughtService service) {
        this.service = service;
    }

    @GetMapping("/{holdingId}/since-bought")
    public SinceBoughtService.SinceBoughtView find(@PathVariable Long holdingId) {
        return service.find(holdingId);
    }
}
