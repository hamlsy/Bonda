package com.bonda.ai.application;

import com.bonda.ai.domain.RiskEventType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface RiskEventExtractor {

    String model();

    ExtractionResult extract(ExtractionRequest request);

    record ExtractionRequest(
        String issuerName,
        String disclosureTitle,
        Instant publishedAt,
        String disclosureType,
        String documentContext
    ) {
    }

    record ExtractionResult(
        List<ExtractedEvent> events,
        Integer inputTokens,
        Integer outputTokens,
        int attempts
    ) {
        public ExtractionResult {
            events = List.copyOf(events);
            if (attempts < 1) {
                throw new IllegalArgumentException("attempts must be positive");
            }
        }
    }

    record ExtractedEvent(
        RiskEventType eventType,
        LocalDate eventDate,
        BigDecimal amount,
        String currency,
        String purpose,
        String evidenceText,
        String extractionReason
    ) {
    }
}
