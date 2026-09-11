package com.bonda.disclosure.application;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Comment;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.jsoup.parser.Parser;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class DocumentContentNormalizer {

    public static final String NORMALIZATION_VERSION = "NORMALIZATION_V1";

    private static final Pattern MARKUP = Pattern.compile("<[A-Za-z!/][^>]*>");
    private static final Pattern XML_COMMENT = Pattern.compile("<!--.*?-->", Pattern.DOTALL);
    private static final Pattern BETWEEN_TAGS = Pattern.compile(">\\s+<");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern INLINE_WHITESPACE = Pattern.compile("[\\t\\x0B\\f \\u00A0]+");
    private static final Pattern MULTIPLE_BLANK_LINES = Pattern.compile("\\n{3,}");
    private static final Pattern PLAIN_HEADING = Pattern.compile(
        "^(?:제?\\s*\\d+(?:[.-]\\d+)*[.)]?|[IVX]+[.)]|[가-힣][.)])\\s+\\S.*$"
    );
    private static final Set<String> HEADING_TAGS = Set.of(
        "title", "h1", "h2", "h3", "h4", "h5", "h6", "section-title"
    );
    private static final Set<String> BLOCK_TAGS = Set.of(
        "address", "article", "blockquote", "body", "caption", "dd", "div", "dl", "dt",
        "footer", "header", "li", "main", "p", "pre", "section", "summary", "td", "th", "tr"
    );
    private static final Set<String> EXCLUDED_TAGS = Set.of(
        "script", "style", "noscript", "template", "svg"
    );

    public NormalizedDocument normalizeAndHash(String rawContent) {
        return normalizeAndHash("", rawContent);
    }

    public NormalizedDocument normalizeAndHash(String title, String rawContent) {
        if (rawContent == null || rawContent.isBlank()) {
            throw new IllegalArgumentException("rawContent must not be blank");
        }

        String source = normalizeSource(rawContent);
        NormalizationContext context = new NormalizationContext();
        String sourceFormat;

        if (MARKUP.matcher(source).find()) {
            sourceFormat = "MARKUP";
            Document document = Jsoup.parse(source, "", Parser.xmlParser());
            walk(document, context);
        } else {
            sourceFormat = "PLAIN_TEXT";
            normalizePlainText(Parser.unescapeEntities(source, false), context);
        }

        context.finishSection();
        String plainText = cleanLines(context.content.toString());
        if (plainText.isEmpty()) {
            throw new IllegalArgumentException("normalizedContent must not be blank");
        }

        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("normalizationVersion", NORMALIZATION_VERSION);
        metadata.put("sourceFormat", sourceFormat);

        return new NormalizedDocument(
            normalizeInline(title),
            plainText,
            context.sections,
            context.tables,
            metadata,
            sha256(plainText)
        );
    }

    public String legacyHash(String rawContent) {
        if (rawContent == null || rawContent.isBlank()) {
            throw new IllegalArgumentException("rawContent must not be blank");
        }
        String normalized = normalizeSource(rawContent);
        normalized = XML_COMMENT.matcher(normalized).replaceAll("");
        normalized = BETWEEN_TAGS.matcher(normalized).replaceAll("><");
        normalized = WHITESPACE.matcher(normalized).replaceAll(" ").trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("normalizedContent must not be blank");
        }
        return sha256(normalized);
    }

    private void walk(Node node, NormalizationContext context) {
        if (node instanceof Comment) {
            return;
        }
        if (node instanceof TextNode textNode) {
            context.append(textNode.getWholeText());
            return;
        }
        if (!(node instanceof Element element)) {
            for (Node child : node.childNodes()) {
                walk(child, context);
            }
            return;
        }

        String tag = element.tagName().toLowerCase(Locale.ROOT);
        if (EXCLUDED_TAGS.contains(tag)) {
            return;
        }
        if ("table".equals(tag)) {
            NormalizedTable table = normalizeTable(element, context.tables.size() + 1);
            context.tables.add(table);
            context.append("\n" + table.textRepresentation() + "\n");
            return;
        }
        if (isHeading(element, tag)) {
            String heading = normalizeInline(element.text());
            if (!heading.isEmpty()) {
                context.startSection(heading);
            }
            return;
        }
        if ("br".equals(tag)) {
            context.append("\n");
            return;
        }

        for (Node child : element.childNodes()) {
            walk(child, context);
        }
        if (BLOCK_TAGS.contains(tag)) {
            context.append("\n");
        }
    }

    private boolean isHeading(Element element, String tag) {
        if (HEADING_TAGS.contains(tag)) {
            return !element.parents().stream().anyMatch(parent -> "table".equalsIgnoreCase(parent.tagName()));
        }
        String semanticName = (element.className() + " " + element.id()).toLowerCase(Locale.ROOT);
        return semanticName.contains("section-title") || semanticName.contains("section_heading");
    }

    private NormalizedTable normalizeTable(Element table, int order) {
        List<List<String>> rows = new ArrayList<>();
        boolean firstRowHasHeaderCells = false;

        for (Element row : table.select("tr")) {
            if (row.closest("table") != table) {
                continue;
            }
            List<String> cells = row.children().stream()
                .filter(cell -> "td".equalsIgnoreCase(cell.tagName()) || "th".equalsIgnoreCase(cell.tagName()))
                .map(cell -> normalizeInline(cell.text()))
                .toList();
            if (!cells.isEmpty()) {
                if (rows.isEmpty()) {
                    firstRowHasHeaderCells = row.children().stream()
                        .anyMatch(cell -> "th".equalsIgnoreCase(cell.tagName()));
                }
                rows.add(cells);
            }
        }

        String title = table.select("caption").stream()
            .findFirst()
            .map(Element::text)
            .map(DocumentContentNormalizer::normalizeInline)
            .filter(value -> !value.isEmpty())
            .orElse(null);
        boolean hasHeader = firstRowHasHeaderCells || isLikelyHeader(rows);
        String representation = renderTable(order, title, rows, hasHeader);
        return new NormalizedTable(order, title, rows, representation);
    }

    private boolean isLikelyHeader(List<List<String>> rows) {
        if (rows.size() < 2 || rows.getFirst().isEmpty()) {
            return false;
        }
        List<String> first = rows.getFirst();
        boolean sameWidth = rows.stream().skip(1).allMatch(row -> row.size() == first.size());
        boolean textLabels = first.stream().allMatch(cell -> cell.length() <= 40 && !cell.matches(".*\\d.*"));
        return sameWidth && textLabels;
    }

    private String renderTable(int order, String title, List<List<String>> rows, boolean hasHeader) {
        StringBuilder result = new StringBuilder("[Table ").append(order).append(']');
        if (title != null) {
            result.append(' ').append(title);
        }
        result.append('\n');

        if (hasHeader && rows.size() > 1) {
            List<String> headers = rows.getFirst();
            for (int rowIndex = 1; rowIndex < rows.size(); rowIndex += 1) {
                List<String> values = rows.get(rowIndex);
                List<String> pairs = new ArrayList<>();
                for (int cellIndex = 0; cellIndex < values.size(); cellIndex += 1) {
                    String header = cellIndex < headers.size() && !headers.get(cellIndex).isEmpty()
                        ? headers.get(cellIndex)
                        : "열 " + (cellIndex + 1);
                    pairs.add(header + ": " + values.get(cellIndex));
                }
                result.append(String.join(" | ", pairs)).append('\n');
            }
        } else {
            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex += 1) {
                result.append("Row ").append(rowIndex + 1).append(": ")
                    .append(String.join(" | ", rows.get(rowIndex))).append('\n');
            }
        }
        return cleanLines(result.toString());
    }

    private void normalizePlainText(String source, NormalizationContext context) {
        for (String line : source.split("\\n")) {
            String cleaned = normalizeInline(line);
            if (cleaned.isEmpty()) {
                context.append("\n");
            } else if (PLAIN_HEADING.matcher(cleaned).matches()) {
                context.startSection(cleaned);
            } else {
                context.append(cleaned + "\n");
            }
        }
    }

    private String normalizeSource(String rawContent) {
        return Normalizer.normalize(rawContent, Normalizer.Form.NFC)
            .replace("\uFEFF", "")
            .replace("\r\n", "\n")
            .replace('\r', '\n');
    }

    private static String normalizeInline(String value) {
        if (value == null) {
            return "";
        }
        return INLINE_WHITESPACE.matcher(
            Normalizer.normalize(value, Normalizer.Form.NFC).replace('\n', ' ')
        ).replaceAll(" ").trim();
    }

    private static String cleanLines(String value) {
        List<String> lines = value.lines()
            .map(DocumentContentNormalizer::normalizeInline)
            .toList();
        return MULTIPLE_BLANK_LINES.matcher(String.join("\n", lines).trim()).replaceAll("\n\n");
    }

    private String sha256(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(content.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public record NormalizedDocument(
        String title,
        String plainText,
        List<NormalizedSection> sections,
        List<NormalizedTable> tables,
        Map<String, String> metadata,
        String hash
    ) {
        public NormalizedDocument {
            sections = List.copyOf(sections);
            tables = List.copyOf(tables);
            metadata = Map.copyOf(metadata);
        }

        public String content() {
            return plainText;
        }
    }

    public record NormalizedSection(String heading, int order, String content) {
    }

    public record NormalizedTable(
        int order,
        String title,
        List<List<String>> rows,
        String textRepresentation
    ) {
        public NormalizedTable {
            rows = rows.stream().map(List::copyOf).toList();
        }
    }

    private static final class NormalizationContext {
        private final StringBuilder content = new StringBuilder();
        private final List<NormalizedSection> sections = new ArrayList<>();
        private final List<NormalizedTable> tables = new ArrayList<>();
        private String currentHeading;
        private StringBuilder currentSectionContent;

        private void append(String value) {
            content.append(value);
            if (currentSectionContent != null) {
                currentSectionContent.append(value);
            }
        }

        private void startSection(String heading) {
            finishSection();
            currentHeading = heading;
            currentSectionContent = new StringBuilder();
            content.append("\n[Section ").append(sections.size() + 1).append("] ").append(heading).append('\n');
        }

        private void finishSection() {
            if (currentHeading == null) {
                return;
            }
            sections.add(new NormalizedSection(
                currentHeading,
                sections.size() + 1,
                cleanLines(currentSectionContent.toString())
            ));
            currentHeading = null;
            currentSectionContent = null;
        }
    }
}
