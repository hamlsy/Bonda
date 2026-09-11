package com.bonda.alert.presentation;

import com.bonda.alert.application.MyBondsSummaryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/holdings")
public class MyBondsController {

    private final MyBondsSummaryService summaryService;

    public MyBondsController(MyBondsSummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @GetMapping("/summary")
    public List<MyBondsSummaryService.MyBondSummary> findAll() {
        return summaryService.findAll();
    }
}

