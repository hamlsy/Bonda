package com.bonda.ai.infrastructure;

import com.bonda.ai.application.AiProperties;
import com.bonda.ai.application.RiskEventExtractor;
import com.bonda.ai.application.RiskEventOutputParser;
import com.bonda.ai.application.RiskExtractionException;
import com.bonda.ai.application.RiskExtractionPrompt;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "bonda.ai.enabled", havingValue = "true")
public class OpenAiRiskEventExtractor implements RiskEventExtractor {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AiProperties properties;
    private final RiskExtractionPrompt prompt;
    private final RiskEventOutputParser outputParser;
    private final RetrySleeper sleeper;

    @Autowired
    public OpenAiRiskEventExtractor(
        RestClient.Builder builder,
        ObjectMapper objectMapper,
        AiProperties properties,
        RiskExtractionPrompt prompt,
        RiskEventOutputParser outputParser
    ) {
        this(
            buildRestClient(builder, properties),
            objectMapper,
            properties,
            prompt,
            outputParser,
            Thread::sleep
        );
    }

    OpenAiRiskEventExtractor(
        RestClient restClient,
        ObjectMapper objectMapper,
        AiProperties properties,
        RiskExtractionPrompt prompt,
        RiskEventOutputParser outputParser,
        RetrySleeper sleeper
    ) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.prompt = prompt;
        this.outputParser = outputParser;
        this.sleeper = sleeper;
    }

    @Override
    public String model() {
        return properties.model();
    }

    @Override
    public ExtractionResult extract(ExtractionRequest request) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new RiskExtractionException(
                RiskExtractionException.ErrorType.MISSING_API_KEY,
                "AI API key is not configured"
            );
        }

        for (int attempt = 1; attempt <= properties.maxAttempts(); attempt += 1) {
            try {
                String response = restClient.post()
                    .uri("/responses")
                    .header("Authorization", "Bearer " + properties.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody(request))
                    .retrieve()
                    .body(String.class);
                return parseResponse(response, attempt);
            } catch (RestClientResponseException exception) {
                int status = exception.getStatusCode().value();
                boolean retryable = status == 408 || status == 429 || status >= 500;
                RiskExtractionException.ErrorType type = httpErrorType(status);
                if (!retryable || attempt == properties.maxAttempts()) {
                    throw new RiskExtractionException(type, "AI provider returned HTTP " + status, attempt);
                }
                backoff(attempt);
            } catch (ResourceAccessException exception) {
                if (attempt == properties.maxAttempts()) {
                    throw new RiskExtractionException(
                        RiskExtractionException.ErrorType.TIMEOUT,
                        "AI provider timed out or could not connect",
                        attempt
                    );
                }
                backoff(attempt);
            } catch (RestClientException exception) {
                throw new RiskExtractionException(
                    RiskExtractionException.ErrorType.PROVIDER_ERROR,
                    "AI provider request failed",
                    attempt
                );
            }
        }
        throw new IllegalStateException("AI retry loop completed unexpectedly");
    }

    private Map<String, Object> requestBody(ExtractionRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("store", false);
        body.put("instructions", prompt.instructions());
        body.put("input", request.documentContext());
        body.put("max_output_tokens", properties.maxOutputTokens());
        body.put("reasoning", Map.of("effort", "none"));
        body.put("text", Map.of("format", structuredOutputFormat()));
        return body;
    }

    private Map<String, Object> structuredOutputFormat() {
        Map<String, Object> eventProperties = new LinkedHashMap<>();
        eventProperties.put("eventType", Map.of(
            "type", "string",
            "enum", List.of(
                "DEBT_INCREASE",
                "CASH_DECREASE",
                "OPERATING_LOSS",
                "CREDIT_RATING_CHANGE",
                "GUARANTEE_INCREASE",
                "LIQUIDITY_WARNING"
            )
        ));
        eventProperties.put("eventDate", nullableSchema("string"));
        eventProperties.put("amount", nullableSchema("number"));
        eventProperties.put("currency", nullableSchema("string"));
        eventProperties.put("purpose", nullableSchema("string"));
        eventProperties.put("evidenceText", Map.of("type", "string"));
        eventProperties.put("reason", nullableSchema("string"));

        Map<String, Object> eventSchema = new LinkedHashMap<>();
        eventSchema.put("type", "object");
        eventSchema.put("additionalProperties", false);
        eventSchema.put("properties", eventProperties);
        eventSchema.put("required", List.copyOf(eventProperties.keySet()));

        Map<String, Object> rootSchema = new LinkedHashMap<>();
        rootSchema.put("type", "object");
        rootSchema.put("additionalProperties", false);
        rootSchema.put("properties", Map.of(
            "events", Map.of("type", "array", "items", eventSchema)
        ));
        rootSchema.put("required", List.of("events"));

        Map<String, Object> format = new LinkedHashMap<>();
        format.put("type", "json_schema");
        format.put("name", "bonda_risk_events");
        format.put("strict", true);
        format.put("schema", rootSchema);
        return format;
    }

    private Map<String, Object> nullableSchema(String type) {
        return Map.of("anyOf", List.of(Map.of("type", type), Map.of("type", "null")));
    }

    private ExtractionResult parseResponse(String response, int attempts) {
        if (response == null || response.isBlank()) {
            throw new RiskExtractionException(
                RiskExtractionException.ErrorType.EMPTY_RESPONSE,
                "AI provider returned an empty response",
                attempts
            );
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(response);
        } catch (Exception exception) {
            throw new RiskExtractionException(
                RiskExtractionException.ErrorType.MALFORMED_JSON,
                "AI provider response envelope is malformed",
                attempts
            );
        }
        if (!"completed".equals(root.path("status").asText())) {
            throw new RiskExtractionException(
                RiskExtractionException.ErrorType.PROVIDER_ERROR,
                "AI provider did not complete the response",
                attempts
            );
        }

        String outputText = extractOutputText(root, attempts);
        List<ExtractedEvent> events;
        try {
            events = outputParser.parse(outputText);
        } catch (RiskExtractionException exception) {
            throw new RiskExtractionException(exception.getErrorType(), exception.getMessage(), attempts);
        }

        JsonNode usage = root.path("usage");
        Integer inputTokens = usage.has("input_tokens") ? usage.get("input_tokens").intValue() : null;
        Integer outputTokens = usage.has("output_tokens") ? usage.get("output_tokens").intValue() : null;
        return new ExtractionResult(events, inputTokens, outputTokens, attempts);
    }

    private String extractOutputText(JsonNode root, int attempts) {
        List<String> textParts = new ArrayList<>();
        for (JsonNode output : root.path("output")) {
            for (JsonNode content : output.path("content")) {
                if ("output_text".equals(content.path("type").asText()) && content.hasNonNull("text")) {
                    textParts.add(content.get("text").asText());
                }
            }
        }
        if (textParts.isEmpty()) {
            throw new RiskExtractionException(
                RiskExtractionException.ErrorType.EMPTY_RESPONSE,
                "AI provider response has no output text",
                attempts
            );
        }
        return String.join("", textParts);
    }

    private void backoff(int attempt) {
        try {
            sleeper.sleep(properties.initialBackoffMs() * (1L << (attempt - 1)));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new RiskExtractionException(
                RiskExtractionException.ErrorType.PROVIDER_ERROR,
                "AI retry was interrupted",
                attempt
            );
        }
    }

    private RiskExtractionException.ErrorType httpErrorType(int status) {
        if (status == 429) {
            return RiskExtractionException.ErrorType.RATE_LIMIT;
        }
        if (status == 408) {
            return RiskExtractionException.ErrorType.TIMEOUT;
        }
        return status >= 500
            ? RiskExtractionException.ErrorType.SERVER_ERROR
            : RiskExtractionException.ErrorType.CLIENT_ERROR;
    }

    private static RestClient buildRestClient(RestClient.Builder builder, AiProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.connectTimeout());
        requestFactory.setReadTimeout(properties.readTimeout());
        return builder
            .baseUrl(properties.baseUrl())
            .requestFactory(requestFactory)
            .build();
    }

    @FunctionalInterface
    interface RetrySleeper {
        void sleep(long millis) throws InterruptedException;
    }
}
