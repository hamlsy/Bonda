package com.bonda.disclosure.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class DisclosurePreFilter {

    public static final String RULE_VERSION = "PRE_FILTER_V1";

    private static final List<String> RISK_KEYWORDS = List.of(
        "단기차입", "차입금", "채무보증", "지급보증", "손실", "적자", "유동성", "회생",
        "신용등급", "등급전망", "현금성자산", "영업현금흐름"
    );
    private static final List<String> STRONG_TITLE_CONTEXTS = List.of(
        "단기차입금증가", "채무보증결정", "지급보증", "회생절차", "신용등급", "등급전망"
    );
    private static final List<String> CHANGE_CONTEXTS = List.of(
        "증가", "감소", "발생", "악화", "하락", "변경", "결정", "신청", "부담", "체결", "제공", "전환"
    );
    private static final Pattern QUANTITATIVE_EVIDENCE = Pattern.compile(
        "(?:\\d[\\d,.]*\\s*(?:원|억원|조원|%|퍼센트)|\\d{4}[./-]\\d{1,2}[./-]\\d{1,2})"
    );
    private static final int MIN_DOCUMENT_LENGTH = 30;

    private final Clock clock;

    @Autowired
    public DisclosurePreFilter() {
        this(Clock.systemUTC());
    }

    DisclosurePreFilter(Clock clock) {
        this.clock = clock;
    }

    public PreFilterResult evaluate(
        String disclosureType,
        DocumentContentNormalizer.NormalizedDocument document
    ) {
        if (disclosureType == null || disclosureType.isBlank()) {
            throw new IllegalArgumentException("disclosureType must not be blank");
        }
        if (document == null) {
            throw new IllegalArgumentException("document must not be null");
        }

        String title = compact(document.title());
        String content = document.plainText();
        LinkedHashSet<String> matchedKeywords = findKeywords(title + "\n" + content);
        LinkedHashSet<String> matchedRules = new LinkedHashSet<>();
        List<String> targetSections = findTargetSections(document.sections());

        boolean supportedDisclosureType = "DART".equalsIgnoreCase(disclosureType.trim());
        if (!supportedDisclosureType) {
            matchedRules.add("UNSUPPORTED_DISCLOSURE_TYPE");
        }

        boolean titleHasRiskKeyword = RISK_KEYWORDS.stream().anyMatch(title::contains);
        boolean strongTitle = titleHasRiskKeyword && (
            STRONG_TITLE_CONTEXTS.stream().anyMatch(title::contains)
                || CHANGE_CONTEXTS.stream().anyMatch(title::contains)
        );
        if (strongTitle) {
            matchedRules.add("RISK_DISCLOSURE_TITLE");
        }

        boolean hasChangeContext = CHANGE_CONTEXTS.stream().anyMatch(content::contains);
        boolean hasQuantitativeEvidence = QUANTITATIVE_EVIDENCE.matcher(content).find();
        boolean riskSectionWithContext = document.sections().stream().anyMatch(section -> {
            boolean riskHeading = RISK_KEYWORDS.stream().anyMatch(section.heading()::contains);
            boolean contextualBody = CHANGE_CONTEXTS.stream().anyMatch(section.content()::contains)
                || QUANTITATIVE_EVIDENCE.matcher(section.content()).find();
            return riskHeading && contextualBody;
        });
        if (riskSectionWithContext) {
            matchedRules.add("RISK_SECTION_WITH_CONTEXT");
        }

        boolean contextualBody = !matchedKeywords.isEmpty() && hasChangeContext && hasQuantitativeEvidence;
        if (contextualBody) {
            matchedRules.add("RISK_TERM_WITH_CHANGE_AND_VALUE");
        }

        int distinctSignalCount = matchedKeywords.size();
        if (matchedKeywords.contains("단기차입") && matchedKeywords.contains("차입금")) {
            distinctSignalCount -= 1;
        }
        boolean multipleSignals = distinctSignalCount >= 2 && hasChangeContext;
        if (multipleSignals) {
            matchedRules.add("MULTIPLE_RISK_SIGNALS");
        }

        boolean tooShort = content.length() < MIN_DOCUMENT_LENGTH;
        if (tooShort && !strongTitle) {
            matchedRules.add("DOCUMENT_TOO_SHORT");
        }

        boolean shouldAnalyze = supportedDisclosureType && (
            strongTitle || (!tooShort && (riskSectionWithContext || contextualBody || multipleSignals))
        );
        return new PreFilterResult(
            shouldAnalyze ? Decision.ANALYZE : Decision.SKIP,
            List.copyOf(matchedRules),
            List.copyOf(matchedKeywords),
            shouldAnalyze ? targetSections : List.of(),
            Instant.now(clock),
            RULE_VERSION
        );
    }

    private LinkedHashSet<String> findKeywords(String value) {
        LinkedHashSet<String> result = new LinkedHashSet<>();
        for (String keyword : RISK_KEYWORDS) {
            if (value.contains(keyword)) {
                result.add(keyword);
            }
        }
        return result;
    }

    private List<String> findTargetSections(List<DocumentContentNormalizer.NormalizedSection> sections) {
        Set<String> result = new LinkedHashSet<>();
        for (DocumentContentNormalizer.NormalizedSection section : sections) {
            String searchable = section.heading() + "\n" + section.content();
            if (RISK_KEYWORDS.stream().anyMatch(searchable::contains)) {
                result.add(section.heading());
            }
        }
        return new ArrayList<>(result);
    }

    private String compact(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    public enum Decision {
        ANALYZE,
        SKIP
    }

    public record PreFilterResult(
        Decision decision,
        List<String> matchedRules,
        List<String> matchedKeywords,
        List<String> targetSections,
        Instant evaluatedAt,
        String ruleVersion
    ) {
        public PreFilterResult {
            matchedRules = List.copyOf(matchedRules);
            matchedKeywords = List.copyOf(matchedKeywords);
            targetSections = List.copyOf(targetSections);
        }
    }
}
