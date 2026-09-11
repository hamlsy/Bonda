package com.bonda.sincebought.infrastructure;

import com.bonda.ai.application.AiProperties;
import com.bonda.sincebought.application.CrossDocumentExplainer;
import com.bonda.sincebought.application.CrossDocumentExplanationParser;
import com.bonda.sincebought.application.CrossDocumentExplanationPrompt;
import com.bonda.sincebought.application.ExplanationException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "bonda.ai.enabled", havingValue = "true")
public class OpenAiCrossDocumentExplainer implements CrossDocumentExplainer {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AiProperties properties;
    private final CrossDocumentExplanationPrompt prompt;
    private final CrossDocumentExplanationParser parser;

    public OpenAiCrossDocumentExplainer(
        RestClient.Builder builder,
        ObjectMapper objectMapper,
        AiProperties properties,
        CrossDocumentExplanationPrompt prompt,
        CrossDocumentExplanationParser parser
    ) {
        this(buildRestClient(builder, properties), objectMapper, properties, prompt, parser);
    }

    OpenAiCrossDocumentExplainer(
        RestClient restClient,
        ObjectMapper objectMapper,
        AiProperties properties,
        CrossDocumentExplanationPrompt prompt,
        CrossDocumentExplanationParser parser
    ) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.prompt = prompt;
        this.parser = parser;
    }

    @Override
    public String model() {
        return properties.model();
    }

    @Override
    public ExplanationResult explain(ExplanationRequest request) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new ExplanationException("AI API key is not configured");
        }
        try {
            String response = restClient.post()
                .uri("/responses")
                .header("Authorization", "Bearer " + properties.apiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody(request))
                .retrieve()
                .body(String.class);
            return parseEnvelope(response, request);
        } catch (RestClientException exception) {
            throw new ExplanationException("Explanation provider request failed", exception);
        }
    }

    private Map<String, Object> requestBody(ExplanationRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.model());
        body.put("store", false);
        body.put("instructions", prompt.instructions());
        body.put("input", request.verifiedContext());
        body.put("max_output_tokens", properties.maxOutputTokens());
        body.put("reasoning", Map.of("effort", "none"));
        body.put("text", Map.of("format", structuredOutputFormat()));
        return body;
    }

    private Map<String, Object> structuredOutputFormat() {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("summary", Map.of("type", "string"));
        properties.put("relatedEventIds", Map.of("type", "array", "items", Map.of("type", "integer")));
        properties.put(
            "relatedRiskChangeIds",
            Map.of("type", "array", "items", Map.of("type", "integer"))
        );
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("properties", properties);
        schema.put("required", List.copyOf(properties.keySet()));
        return Map.of(
            "type", "json_schema",
            "name", "bonda_since_bought_explanation",
            "strict", true,
            "schema", schema
        );
    }

    private ExplanationResult parseEnvelope(String response, ExplanationRequest request) {
        if (response == null || response.isBlank()) {
            throw new ExplanationException("Explanation provider returned an empty response");
        }
        try {
            JsonNode root = objectMapper.readTree(response);
            if (!"completed".equals(root.path("status").asText())) {
                throw new ExplanationException("Explanation provider did not complete the response");
            }
            List<String> text = new ArrayList<>();
            for (JsonNode output : root.path("output")) {
                for (JsonNode content : output.path("content")) {
                    if ("output_text".equals(content.path("type").asText()) && content.hasNonNull("text")) {
                        text.add(content.get("text").asText());
                    }
                }
            }
            if (text.isEmpty()) {
                throw new ExplanationException("Explanation provider returned no output text");
            }
            var parsed = parser.parse(
                String.join("", text),
                request.allowedEventIds(),
                request.allowedRiskChangeIds()
            );
            JsonNode usage = root.path("usage");
            Integer inputTokens = usage.has("input_tokens") ? usage.get("input_tokens").intValue() : null;
            Integer outputTokens = usage.has("output_tokens") ? usage.get("output_tokens").intValue() : null;
            return new ExplanationResult(
                parsed.summary(),
                parsed.relatedEventIds(),
                parsed.relatedRiskChangeIds(),
                inputTokens,
                outputTokens
            );
        } catch (ExplanationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ExplanationException("Explanation provider response is malformed", exception);
        }
    }

    private static RestClient buildRestClient(RestClient.Builder builder, AiProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.connectTimeout());
        requestFactory.setReadTimeout(properties.readTimeout());
        return builder.baseUrl(properties.baseUrl()).requestFactory(requestFactory).build();
    }
}
