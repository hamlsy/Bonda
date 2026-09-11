package com.bonda.ai.application;

import com.bonda.ai.domain.RiskEventType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Component
public class RiskEventOutputParser {

    private final ObjectMapper objectMapper;

    public RiskEventOutputParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<RiskEventExtractor.ExtractedEvent> parse(String json) {
        if (json == null || json.isBlank()) {
            throw failure(RiskExtractionException.ErrorType.EMPTY_RESPONSE, "AI response text is empty");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(json);
        } catch (Exception exception) {
            throw failure(RiskExtractionException.ErrorType.MALFORMED_JSON, "AI response is not valid JSON");
        }

        JsonNode events = root.get("events");
        if (!root.isObject() || events == null || !events.isArray()) {
            throw failure(
                RiskExtractionException.ErrorType.SCHEMA_VALIDATION,
                "AI response must contain an events array"
            );
        }

        List<RiskEventExtractor.ExtractedEvent> result = new ArrayList<>();
        for (JsonNode event : events) {
            if (!event.isObject()) {
                throw schemaFailure("Each event must be an object");
            }
            result.add(parseEvent(event));
        }
        return List.copyOf(result);
    }

    private RiskEventExtractor.ExtractedEvent parseEvent(JsonNode event) {
        RiskEventType eventType;
        try {
            eventType = RiskEventType.valueOf(requiredText(event, "eventType"));
        } catch (IllegalArgumentException exception) {
            throw schemaFailure("eventType is unknown or missing");
        }

        LocalDate eventDate = null;
        String dateValue = nullableText(event, "eventDate");
        if (dateValue != null) {
            try {
                eventDate = LocalDate.parse(dateValue);
            } catch (DateTimeParseException exception) {
                throw schemaFailure("eventDate must use ISO-8601 format");
            }
        }

        BigDecimal amount = null;
        JsonNode amountNode = event.get("amount");
        if (amountNode != null && !amountNode.isNull()) {
            if (!amountNode.isNumber()) {
                throw schemaFailure("amount must be a number or null");
            }
            amount = amountNode.decimalValue();
            if (amount.signum() < 0) {
                throw schemaFailure("amount must not be negative");
            }
        }

        String evidenceText = requiredText(event, "evidenceText");
        return new RiskEventExtractor.ExtractedEvent(
            eventType,
            eventDate,
            amount,
            nullableText(event, "currency"),
            nullableText(event, "purpose"),
            evidenceText,
            nullableText(event, "reason")
        );
    }

    private String requiredText(JsonNode node, String field) {
        String value = nullableText(node, field);
        if (value == null) {
            throw schemaFailure(field + " must be a non-blank string");
        }
        return value;
    }

    private String nullableText(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isTextual() || value.asText().isBlank()) {
            throw schemaFailure(field + " must be a string or null");
        }
        return value.asText().trim();
    }

    private RiskExtractionException schemaFailure(String message) {
        return failure(RiskExtractionException.ErrorType.SCHEMA_VALIDATION, message);
    }

    private RiskExtractionException failure(RiskExtractionException.ErrorType type, String message) {
        return new RiskExtractionException(type, message);
    }
}
