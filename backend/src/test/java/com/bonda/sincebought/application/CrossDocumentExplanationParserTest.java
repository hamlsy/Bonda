package com.bonda.sincebought.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CrossDocumentExplanationParserTest {

    private final CrossDocumentExplanationParser parser = new CrossDocumentExplanationParser(new ObjectMapper());

    @Test
    void parsesStructuredExplanationAndDeduplicatesIds() {
        var result = parser.parse(
            """
                {
                  "summary": "매수 이후 단기차입 증가가 확인됐습니다.",
                  "relatedEventIds": [1, 1],
                  "relatedRiskChangeIds": [2]
                }
                """,
            List.of(1L),
            List.of(2L)
        );

        assertThat(result.summary()).contains("단기차입");
        assertThat(result.relatedEventIds()).containsExactly(1L);
        assertThat(result.relatedRiskChangeIds()).containsExactly(2L);
    }

    @Test
    void rejectsMalformedJsonAndUnverifiedIds() {
        assertThatThrownBy(() -> parser.parse("not-json", List.of(1L), List.of()))
            .isInstanceOf(ExplanationException.class);
        assertThatThrownBy(() -> parser.parse(
            "{\"summary\":\"설명\",\"relatedEventIds\":[99],\"relatedRiskChangeIds\":[]}",
            List.of(1L),
            List.of()
        )).isInstanceOf(ExplanationException.class)
            .hasMessageContaining("outside verified input");
    }
}
