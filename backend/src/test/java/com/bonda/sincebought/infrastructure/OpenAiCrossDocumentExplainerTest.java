package com.bonda.sincebought.infrastructure;

import com.bonda.ai.application.AiProperties;
import com.bonda.sincebought.application.CrossDocumentExplainer;
import com.bonda.sincebought.application.CrossDocumentExplanationParser;
import com.bonda.sincebought.application.CrossDocumentExplanationPrompt;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenAiCrossDocumentExplainerTest {

    @Test
    void requestsStrictJsonAndParsesFixtureWithoutRealApiCall() throws Exception {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://openai.test/v1");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ObjectMapper mapper = new ObjectMapper();
        OpenAiCrossDocumentExplainer explainer = new OpenAiCrossDocumentExplainer(
            builder.build(),
            mapper,
            properties(),
            new CrossDocumentExplanationPrompt(),
            new CrossDocumentExplanationParser(mapper)
        );
        server.expect(requestTo("https://openai.test/v1/responses"))
            .andExpect(jsonPath("$.model").value("gpt-5.6-luna"))
            .andExpect(jsonPath("$.text.format.type").value("json_schema"))
            .andExpect(jsonPath("$.text.format.strict").value(true))
            .andRespond(withSuccess(successResponse(mapper), MediaType.APPLICATION_JSON));

        CrossDocumentExplainer.ExplanationResult result = explainer.explain(
            new CrossDocumentExplainer.ExplanationRequest("verified data", List.of(1L), List.of(2L))
        );

        assertThat(result.relatedEventIds()).containsExactly(1L);
        assertThat(result.relatedRiskChangeIds()).containsExactly(2L);
        assertThat(result.inputTokens()).isEqualTo(80);
        assertThat(result.outputTokens()).isEqualTo(24);
        server.verify();
    }

    private String successResponse(ObjectMapper mapper) throws Exception {
        String outputText = mapper.writeValueAsString(Map.of(
            "summary", "매수 이후 차입 증가와 유동성 상태 변화가 확인됐습니다.",
            "relatedEventIds", List.of(1),
            "relatedRiskChangeIds", List.of(2)
        ));
        return mapper.writeValueAsString(Map.of(
            "status", "completed",
            "output", List.of(Map.of(
                "content", List.of(Map.of("type", "output_text", "text", outputText))
            )),
            "usage", Map.of("input_tokens", 80, "output_tokens", 24)
        ));
    }

    private AiProperties properties() {
        return new AiProperties(
            true,
            "https://openai.test/v1",
            "test-key",
            "gpt-5.6-luna",
            "gpt-5.6-luna",
            new BigDecimal("0.20"),
            new BigDecimal("1.20"),
            3,
            1,
            12000,
            800,
            Duration.ofSeconds(1),
            Duration.ofSeconds(1)
        );
    }
}
