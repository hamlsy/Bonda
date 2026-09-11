package com.bonda.disclosure.presentation;

import com.bonda.disclosure.application.DisclosureCollectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/disclosures")
public class DisclosureAdminController {

    private final DisclosureCollectionService collectionService;

    public DisclosureAdminController(DisclosureCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping("/collect")
    public ResponseEntity<DisclosureCollectionService.CollectionSummary> collect(
        @RequestParam(required = false) Long issuerId
    ) {
        return ResponseEntity.ok(collectionService.collect(issuerId));
    }
}
