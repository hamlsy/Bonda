package com.bonda.ai.application;

import com.bonda.ai.domain.RiskEventType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RiskEventOutputParserTest {

    private final RiskEventOutputParser parser = new RiskEventOutputParser(new ObjectMapper());

    @Test
    void parsesStructuredRiskEvents() {
        var result = parser.parse("""
            {
              "events": [{
                "eventType": "DEBT_INCREASE",
                "eventDate": "2026-04-19",
                "amount": 80000000000,
                "currency": "KRW",
                "purpose": "OPERATING_CAPITAL",
                "evidenceText": "단기차입금이 800억원으로 증가했다.",
                "reason": "단기차입 증가 사실이 명시됨"
              }]
            }
            """);

        assertThat(result).singleElement().satisfies(event -> {
            assertThat(event.eventType()).isEqualTo(RiskEventType.DEBT_INCREASE);
            assertThat(event.eventDate()).hasToString("2026-04-19");
            assertThat(event.amount()).isEqualByComparingTo("80000000000");
            assertThat(event.currency()).isEqualTo("KRW");
            assertThat(event.evidenceText()).isEqualTo("단기차입금이 800억원으로 증가했다.");
        });
    }

    @Test
    void allowsAnEmptyEventsArray() {
        assertThat(parser.parse("{\"events\":[]}")).isEmpty();
    }

    @Test
    void rejectsUnknownEventTypes() {
        assertThatThrownBy(() -> parser.parse("""
            {"events":[{
              "eventType":"BANKRUPTCY_GUESS",
              "eventDate":null,
              "amount":null,
              "currency":null,
              "purpose":null,
              "evidenceText":"추정 문장",
              "reason":null
            }]}
            """))
            .isInstanceOfSatisfying(RiskExtractionException.class, exception ->
                assertThat(exception.getErrorType())
                    .isEqualTo(RiskExtractionException.ErrorType.SCHEMA_VALIDATION));
    }

    @Test
    void rejectsMalformedJson() {
        assertThatThrownBy(() -> parser.parse("{\"events\":["))
            .isInstanceOfSatisfying(RiskExtractionException.class, exception ->
                assertThat(exception.getErrorType())
                    .isEqualTo(RiskExtractionException.ErrorType.MALFORMED_JSON));
    }
}
