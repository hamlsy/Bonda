package com.bonda.ai.application;

import com.bonda.disclosure.application.DocumentContentNormalizer;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.issuer.domain.Issuer;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

@Component
public class AnalysisInputContextBuilder {

    private final DocumentContentNormalizer normalizer;
    private final AiProperties properties;

    public AnalysisInputContextBuilder(DocumentContentNormalizer normalizer, AiProperties properties) {
        this.normalizer = normalizer;
        this.properties = properties;
    }

    public RiskEventExtractor.ExtractionRequest build(
        Issuer issuer,
        Disclosure disclosure,
        DisclosureVersion version
    ) {
        DocumentContentNormalizer.NormalizedDocument document = normalizer.normalizeAndHash(
            disclosure.getTitle(),
            version.getRawContent()
        );
        Set<String> targets = splitLines(version.getPreFilterTargetSections());
        String selectedContent = selectContent(document, targets);

        String context = """
            Issuer: %s
            Disclosure title: %s
            Published at: %s
            Disclosure type: %s
            Selected document context:
            %s
            """.formatted(
            issuer.getName(),
            disclosure.getTitle(),
            version.getPublishedAt(),
            disclosure.getDisclosureType(),
            selectedContent
        ).trim();

        if (context.length() > properties.maxInputCharacters()) {
            context = context.substring(0, properties.maxInputCharacters()) + "\n[TRUNCATED]";
        }
        return new RiskEventExtractor.ExtractionRequest(
            issuer.getName(),
            disclosure.getTitle(),
            version.getPublishedAt(),
            disclosure.getDisclosureType(),
            context
        );
    }

    private String selectContent(
        DocumentContentNormalizer.NormalizedDocument document,
        Set<String> targets
    ) {
        if (targets.isEmpty()) {
            return document.plainText();
        }
        String selected = document.sections().stream()
            .filter(section -> targets.contains(section.heading()))
            .map(section -> "[Section] " + section.heading() + "\n" + section.content())
            .reduce((first, second) -> first + "\n\n" + second)
            .orElse("");
        return selected.isBlank() ? document.plainText() : selected;
    }

    private Set<String> splitLines(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(value.split("\\R"))
            .map(String::trim)
            .filter(line -> !line.isEmpty())
            .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }
}
