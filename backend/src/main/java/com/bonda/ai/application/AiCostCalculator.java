package com.bonda.ai.application;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class AiCostCalculator {

    private static final BigDecimal ONE_MILLION = BigDecimal.valueOf(1_000_000);

    private final AiProperties properties;

    public AiCostCalculator(AiProperties properties) {
        this.properties = properties;
    }

    public BigDecimal estimate(String model, Integer inputTokens, Integer outputTokens) {
        if (!properties.pricingModel().equals(model) || inputTokens == null || outputTokens == null) {
            return null;
        }
        BigDecimal inputCost = properties.inputCostPerMillionTokens()
            .multiply(BigDecimal.valueOf(inputTokens));
        BigDecimal outputCost = properties.outputCostPerMillionTokens()
            .multiply(BigDecimal.valueOf(outputTokens));
        return inputCost.add(outputCost).divide(ONE_MILLION, 8, RoundingMode.HALF_UP);
    }
}
