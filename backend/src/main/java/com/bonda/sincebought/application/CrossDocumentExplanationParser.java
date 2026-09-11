package com.bonda.sincebought.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class CrossDocumentExplanationParser {

    private static final int MAX_SUMMARY_LENGTH = 1200;

    private final ObjectMapper objectMapper;

    public CrossDocumentExplanationParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ParsedExplanation parse(
        String json,
        List<Long> allowedEventIds,
        List<Long> allowedRiskChangeIds
    ) {
        JsonNode root;
        try {
            root = objectMapper.readTree(json);
        } catch (Exception exception) {
            throw new ExplanationException("Explanation output is malformed JSON", exception);
        }
        String summary = root.path("summary").asText("").trim();
        if (summary.isEmpty() || summary.length() > MAX_SUMMARY_LENGTH) {
            throw new ExplanationException("Explanation summary is blank or too long");
        }
        List<Long> eventIds = ids(root.get("relatedEventIds"), "relatedEventIds");
        List<Long> changeIds = ids(root.get("relatedRiskChangeIds"), "relatedRiskChangeIds");
        if (!allowedEventIds.containsAll(eventIds) || !allowedRiskChangeIds.containsAll(changeIds)) {
            throw new ExplanationException("Explanation referenced an ID outside verified input");
        }
        return new ParsedExplanation(summary, eventIds, changeIds);
    }

    private List<Long> ids(JsonNode node, String field) {
        if (node == null || !node.isArray()) {
            throw new ExplanationException(field + " must be an array");
        }
        Set<Long> values = new LinkedHashSet<>();
        for (JsonNode value : node) {
            if (!value.canConvertToLong()) {
                throw new ExplanationException(field + " must contain integer IDs");
            }
            values.add(value.longValue());
        }
        return new ArrayList<>(values);
    }

    public record ParsedExplanation(
        String summary,
        List<Long> relatedEventIds,
        List<Long> relatedRiskChangeIds
    ) {
        public ParsedExplanation {
            relatedEventIds = List.copyOf(relatedEventIds);
            relatedRiskChangeIds = List.copyOf(relatedRiskChangeIds);
        }
    }
}
