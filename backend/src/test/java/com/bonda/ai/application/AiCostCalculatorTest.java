package com.bonda.ai.application;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class AiCostCalculatorTest {

    private final AiCostCalculator calculator = new AiCostCalculator(new AiProperties(
        true,
        "https://openai.test/v1",
        "test-key",
        "configured-model",
        "configured-model",
        new BigDecimal("0.20"),
        new BigDecimal("1.20"),
        3,
        1,
        12000,
        800,
        Duration.ofSeconds(1),
        Duration.ofSeconds(1)
    ));

    @Test
    void estimatesConfiguredModelCostFromProviderTokenUsage() {
        assertThat(calculator.estimate("configured-model", 120, 35))
            .isEqualByComparingTo("0.00006600");
    }

    @Test
    void leavesCostUnknownForAnUnpricedModel() {
        assertThat(calculator.estimate("different-model", 120, 35)).isNull();
    }
}
