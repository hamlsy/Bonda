package com.bonda.ai.application;

import org.springframework.stereotype.Component;

@Component
public class RiskExtractionPrompt {

    public static final String VERSION = "RISK_EXTRACTION_V1";

    private static final String INSTRUCTIONS = """
        Extract only credit-risk events explicitly stated in the supplied Korean disclosure context.
        Never infer facts, forecasts, default probability, or investment advice.
        Use only the six event types allowed by the JSON schema.
        Do not invent missing dates or amounts; use null instead.
        evidenceText must be a short verbatim span from the supplied context.
        Do not emit duplicate events. If evidence is uncertain, return an empty events array.
        Keep purpose and reason brief.
        """;

    public String version() {
        return VERSION;
    }

    public String instructions() {
        return INSTRUCTIONS;
    }
}
