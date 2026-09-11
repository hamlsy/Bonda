package com.bonda.disclosure.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class DisclosurePreFilterTest {

    private static final Instant EVALUATED_AT = Instant.parse("2026-09-11T12:00:00Z");

    private final DocumentContentNormalizer normalizer = new DocumentContentNormalizer();
    private DisclosurePreFilter preFilter;

    @BeforeEach
    void setUp() {
        preFilter = new DisclosurePreFilter(Clock.fixed(EVALUATED_AT, ZoneOffset.UTC));
    }

    @Test
    void analyzesClearRiskDisclosureAndSelectsItsSection() throws IOException {
        var document = normalizer.normalizeAndHash(
            "단기차입금 증가 결정",
            fixture("risk_disclosure.html")
        );

        DisclosurePreFilter.PreFilterResult result = preFilter.evaluate("DART", document);

        assertThat(result.decision()).isEqualTo(DisclosurePreFilter.Decision.ANALYZE);
        assertThat(result.matchedRules()).contains(
            "RISK_DISCLOSURE_TITLE",
            "RISK_SECTION_WITH_CONTEXT",
            "RISK_TERM_WITH_CHANGE_AND_VALUE"
        );
        assertThat(result.matchedKeywords()).contains("단기차입", "차입금", "유동성");
        assertThat(result.targetSections()).containsExactly("차입금 및 유동성");
        assertThat(result.ruleVersion()).isEqualTo("PRE_FILTER_V1");
        assertThat(result.evaluatedAt()).isEqualTo(EVALUATED_AT);
    }

    @Test
    void skipsUnrelatedDisclosure() throws IOException {
        var document = normalizer.normalizeAndHash(
            "주주총회소집공고",
            fixture("unrelated_disclosure.xml")
        );

        DisclosurePreFilter.PreFilterResult result = preFilter.evaluate("DART", document);

        assertThat(result.decision()).isEqualTo(DisclosurePreFilter.Decision.SKIP);
        assertThat(result.matchedKeywords()).isEmpty();
        assertThat(result.targetSections()).isEmpty();
    }

    @Test
    void doesNotAnalyzeAnAmbiguousSingleKeywordWithoutRiskContext() throws IOException {
        var document = normalizer.normalizeAndHash(
            "교육자료 안내",
            fixture("ambiguous_keyword.txt")
        );

        DisclosurePreFilter.PreFilterResult result = preFilter.evaluate("DART", document);

        assertThat(result.decision()).isEqualTo(DisclosurePreFilter.Decision.SKIP);
        assertThat(result.matchedKeywords()).containsExactly("손실");
        assertThat(result.targetSections()).isEmpty();
        assertThat(result.ruleVersion()).isEqualTo("PRE_FILTER_V1");
    }

    private String fixture(String name) throws IOException {
        try (var input = getClass().getResourceAsStream("/fixtures/" + name)) {
            if (input == null) {
                throw new IllegalArgumentException("Fixture not found: " + name);
            }
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
