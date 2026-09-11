package com.bonda.disclosure.application;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentContentNormalizerTest {

    private final DocumentContentNormalizer normalizer = new DocumentContentNormalizer();

    @Test
    void removesMarkupAndNoiseWhilePreservingHeadingAndMeaningfulText() throws IOException {
        DocumentContentNormalizer.NormalizedDocument result = normalizer.normalizeAndHash(
            "단기차입금 증가 결정",
            fixture("risk_disclosure.html")
        );

        assertThat(result.title()).isEqualTo("단기차입금 증가 결정");
        assertThat(result.plainText())
            .contains("[Section 1] 차입금 및 유동성")
            .contains("2026년 9월 11일")
            .contains("본다산업")
            .doesNotContain("window.secret", ".hidden", "<p>", "&nbsp;");
        assertThat(result.sections()).singleElement().satisfies(section -> {
            assertThat(section.order()).isEqualTo(1);
            assertThat(section.heading()).isEqualTo("차입금 및 유동성");
            assertThat(section.content()).contains("단기차입금 증가");
        });
        assertThat(result.metadata())
            .containsEntry("normalizationVersion", "NORMALIZATION_V1")
            .containsEntry("sourceFormat", "MARKUP");
    }

    @Test
    void preservesTableRowsHeadersAmountsAndDates() throws IOException {
        DocumentContentNormalizer.NormalizedDocument result = normalizer.normalizeAndHash(
            "단기차입금 증가 결정",
            fixture("risk_disclosure.html")
        );

        assertThat(result.tables()).singleElement().satisfies(table -> {
            assertThat(table.order()).isEqualTo(1);
            assertThat(table.title()).isEqualTo("차입금 변경 내역");
            assertThat(table.rows()).containsExactly(
                java.util.List.of("항목", "변경 전", "변경 후"),
                java.util.List.of("단기차입금", "300억원", "800억원")
            );
            assertThat(table.textRepresentation())
                .contains("항목: 단기차입금")
                .contains("변경 전: 300억원")
                .contains("변경 후: 800억원");
        });
        assertThat(result.plainText()).contains("300억원", "800억원", "2026년 9월 11일");
    }

    @Test
    void structuresPlainTextHeadingsAndCollapsesWhitespace() {
        DocumentContentNormalizer.NormalizedDocument result = normalizer.normalizeAndHash("사업보고서", """
            1. 주요 사항


              영업현금흐름은   2026년 9월 11일 300억원입니다.
            """);

        assertThat(result.sections()).singleElement().satisfies(section ->
            assertThat(section.content()).isEqualTo("영업현금흐름은 2026년 9월 11일 300억원입니다."));
        assertThat(result.plainText()).doesNotContain("   ", "\n\n\n");
        assertThat(result.metadata()).containsEntry("sourceFormat", "PLAIN_TEXT");
    }

    @Test
    void producesTheSameHashForEquivalentMarkupWhitespaceAndComments() {
        DocumentContentNormalizer.NormalizedDocument first = normalizer.normalizeAndHash(
            "공시 제목",
            "<DOCUMENT><h2>주요 사항</h2><p>차입금 300억원</p><!-- generated --></DOCUMENT>"
        );
        DocumentContentNormalizer.NormalizedDocument second = normalizer.normalizeAndHash(
            "공시 제목",
            "\uFEFF<DOCUMENT>\r\n<TITLE>주요   사항</TITLE><DIV>차입금&nbsp;300억원</DIV></DOCUMENT>"
        );

        assertThat(first.hash()).hasSize(64).isEqualTo(second.hash());
        assertThat(first.content()).isEqualTo(second.content());
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
