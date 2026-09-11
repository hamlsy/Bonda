package com.bonda.sincebought.application;

import java.util.List;

public interface CrossDocumentExplainer {

    String model();

    ExplanationResult explain(ExplanationRequest request);

    record ExplanationRequest(String verifiedContext, List<Long> allowedEventIds, List<Long> allowedRiskChangeIds) {
        public ExplanationRequest {
            allowedEventIds = List.copyOf(allowedEventIds);
            allowedRiskChangeIds = List.copyOf(allowedRiskChangeIds);
        }
    }

    record ExplanationResult(
        String summary,
        List<Long> relatedEventIds,
        List<Long> relatedRiskChangeIds,
        Integer inputTokens,
        Integer outputTokens
    ) {
        public ExplanationResult {
            relatedEventIds = List.copyOf(relatedEventIds);
            relatedRiskChangeIds = List.copyOf(relatedRiskChangeIds);
        }
    }
}
