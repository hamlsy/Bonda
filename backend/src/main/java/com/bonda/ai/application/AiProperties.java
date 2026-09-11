package com.bonda.ai.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.time.Duration;

@ConfigurationProperties("bonda.ai")
public record AiProperties(
    boolean enabled,
    String baseUrl,
    String apiKey,
    String model,
    String pricingModel,
    BigDecimal inputCostPerMillionTokens,
    BigDecimal outputCostPerMillionTokens,
    int maxAttempts,
    long initialBackoffMs,
    int maxInputCharacters,
    int maxOutputTokens,
    Duration connectTimeout,
    Duration readTimeout
) {
    public AiProperties {
        if (maxAttempts < 1 || maxAttempts > 3) {
            throw new IllegalArgumentException("bonda.ai.max-attempts must be between 1 and 3");
        }
        if (initialBackoffMs < 0 || maxInputCharacters < 100 || maxOutputTokens < 1) {
            throw new IllegalArgumentException("bonda.ai limits must be positive");
        }
    }
}
