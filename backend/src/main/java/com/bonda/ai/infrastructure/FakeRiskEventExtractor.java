package com.bonda.ai.infrastructure;

import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.domain.RiskEventType;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@ConditionalOnProperty(name = "bonda.ai.enabled", havingValue = "false", matchIfMissing = true)
public class FakeRiskEventExtractor implements RiskEventExtractor {

    public static final String MODEL = "fake-local-v1";

    @Override
    public String model() {
        return MODEL;
    }

    @Override
    public ExtractionResult extract(ExtractionRequest request) {
        String context = request.documentContext();
        String marker = "Selected document context:";
        int markerIndex = context.indexOf(marker);
        String documentOnly = markerIndex >= 0
            ? context.substring(markerIndex + marker.length())
            : context;
        if (!documentOnly.contains("단기차입") || !documentOnly.contains("증가")) {
            return new ExtractionResult(List.of(), 0, 0, 1);
        }
        String evidence = Arrays.stream(documentOnly.split("\\R"))
            .map(String::trim)
            .filter(line -> line.contains("단기차입") && line.contains("증가"))
            .findFirst()
            .orElse(null);
        if (evidence == null) {
            return new ExtractionResult(List.of(), 0, 0, 1);
        }
        return new ExtractionResult(
            List.of(new ExtractedEvent(
                RiskEventType.DEBT_INCREASE,
                null,
                null,
                null,
                null,
                evidence,
                "Local fake matched an explicit short-term debt increase statement"
            )),
            0,
            0,
            1
        );
    }
}
