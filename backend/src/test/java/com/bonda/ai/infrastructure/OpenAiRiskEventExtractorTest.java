package com.bonda.ai.infrastructure;

import com.bonda.ai.application.AiProperties;
import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.application.RiskEventOutputParser;
import com.bonda.ai.application.RiskExtractionPrompt;
import com.bonda.ai.domain.RiskEventType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenAiRiskEventExtractorTest {

    private MockRestServiceServer server;
    private OpenAiRiskEventExtractor extractor;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://openai.test/v1");
        server = MockRestServiceServer.bindTo(builder).build();
        ObjectMapper objectMapper = new ObjectMapper();
        extractor = new OpenAiRiskEventExtractor(
            builder.build(),
            objectMapper,
            properties(),
            new RiskExtractionPrompt(),
            new RiskEventOutputParser(objectMapper),
            millis -> { }
        );
    }

    @Test
    void sendsStructuredOutputRequestAndReadsEventsAndUsage() {
        server.expect(requestTo("https://openai.test/v1/responses"))
            .andExpect(header("Authorization", "Bearer test-key"))
            .andExpect(jsonPath("$.model").value("gpt-5.6-luna"))
            .andExpect(jsonPath("$.store").value(false))
            .andExpect(jsonPath("$.reasoning.effort").value("none"))
            .andExpect(jsonPath("$.text.format.type").value("json_schema"))
            .andExpect(jsonPath("$.text.format.strict").value(true))
            .andRespond(withSuccess(successResponse(), MediaType.APPLICATION_JSON));

        RiskEventExtractor.ExtractionResult result = extractor.extract(request());

        assertThat(result.events()).singleElement().satisfies(event -> {
            assertThat(event.eventType()).isEqualTo(RiskEventType.DEBT_INCREASE);
            assertThat(event.amount()).isEqualByComparingTo("80000000000");
        });
        assertThat(result.inputTokens()).isEqualTo(120);
        assertThat(result.outputTokens()).isEqualTo(35);
        assertThat(result.attempts()).isEqualTo(1);
        server.verify();
    }

    @Test
    void retriesRateLimitsWithBoundedBackoff() {
        server.expect(requestTo("https://openai.test/v1/responses"))
            .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        server.expect(requestTo("https://openai.test/v1/responses"))
            .andRespond(withSuccess(successResponse(), MediaType.APPLICATION_JSON));

        RiskEventExtractor.ExtractionResult result = extractor.extract(request());

        assertThat(result.attempts()).isEqualTo(2);
        server.verify();
    }

    private RiskEventExtractor.ExtractionRequest request() {
        return new RiskEventExtractor.ExtractionRequest(
            "본다산업",
            "단기차입금 증가 결정",
            java.time.Instant.parse("2026-09-11T00:00:00Z"),
            "DART",
            "단기차입금이 300억원에서 800억원으로 증가했습니다."
        );
    }

    private String successResponse() {
        return """
            {
              "status": "completed",
              "output": [{
                "type": "message",
                "content": [{
                  "type": "output_text",
                  "text": "{\\\"events\\\":[{\\\"eventType\\\":\\\"DEBT_INCREASE\\\",\\\"eventDate\\\":\\\"2026-09-11\\\",\\\"amount\\\":80000000000,\\\"currency\\\":\\\"KRW\\\",\\\"purpose\\\":\\\"OPERATING_CAPITAL\\\",\\\"evidenceText\\\":\\\"단기차입금이 300억원에서 800억원으로 증가했습니다.\\\",\\\"reason\\\":\\\"차입 증가 명시\\\"}]}"
                }]
              }],
              "usage": {"input_tokens": 120, "output_tokens": 35, "total_tokens": 155}
            }
            """;
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
