package com.bonda.ai.infrastructure;

import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.domain.RiskEventType;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class FakeRiskEventExtractorTest {

    private final FakeRiskEventExtractor extractor = new FakeRiskEventExtractor();

    @Test
    void createsADeterministicCandidateWithoutCallingAnExternalApi() {
        RiskEventExtractor.ExtractionResult result = extractor.extract(new RiskEventExtractor.ExtractionRequest(
            "본다산업",
            "단기차입금 증가 결정",
            Instant.parse("2026-09-11T00:00:00Z"),
            "DART",
            "[Section] 차입금\n단기차입금이 300억원에서 800억원으로 증가했습니다."
        ));

        assertThat(extractor.model()).isEqualTo("fake-local-v1");
        assertThat(result.events()).singleElement().satisfies(event -> {
            assertThat(event.eventType()).isEqualTo(RiskEventType.DEBT_INCREASE);
            assertThat(event.evidenceText()).isEqualTo("단기차입금이 300억원에서 800억원으로 증가했습니다.");
            assertThat(event.amount()).isNull();
        });
        assertThat(result.inputTokens()).isZero();
        assertThat(result.outputTokens()).isZero();
    }
}
