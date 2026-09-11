package com.bonda.bond.presentation;

import com.bonda.bond.application.BondService;
import com.bonda.bond.application.BondService.BondView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bonds")
class BondController {

    private final BondService bondService;

    BondController(BondService bondService) {
        this.bondService = bondService;
    }

    @GetMapping
    List<BondView> findAll() {
        return bondService.findAll();
    }

    @GetMapping("/{bondId}")
    BondView findById(@PathVariable Long bondId) {
        return bondService.findById(bondId);
    }
}
