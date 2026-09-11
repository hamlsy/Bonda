package com.bonda.ai.application;

import com.bonda.ai.domain.AnalysisRun;
import com.bonda.ai.domain.CandidateRiskEvent;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.disclosure.application.DocumentContentNormalizer;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import org.jsoup.Jsoup;
import org.jsoup.parser.Parser;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CandidateRiskEventValidator {

    public static final String RULE_VERSION = "RISK_VALIDATION_V1";

    private static final int MAX_EVIDENCE_LENGTH = 500;
    private static final Pattern HTML_TAG = Pattern.compile("<[A-Za-z!/][^>]*>");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern MONEY = Pattern.compile(
        "(?<![\\d,.])(\\d[\\d,]*(?:\\.\\d+)?)\\s*(억원|백만원|천원|원)"
    );

    private final DocumentContentNormalizer normalizer;

    public CandidateRiskEventValidator(DocumentContentNormalizer normalizer) {
        this.normalizer = normalizer;
    }

    public ValidationResult validate(
        CandidateRiskEvent candidate,
        AnalysisRun run,
        Disclosure disclosure,
        DisclosureVersion version
    ) {
        if (candidate == null || run == null || disclosure == null || version == null) {
            throw new IllegalArgumentException("Validation inputs must not be null");
        }
        if (version.getNormalizedContent() == null || version.getNormalizedContent().isBlank()) {
            throw new IllegalStateException("DisclosureVersion normalizedContent is unavailable");
        }

        List<String> reasons = new ArrayList<>();
        validateSource(candidate, run, disclosure, version, reasons);

        String evidence = normalizeEvidence(candidate.getEvidenceText());
        boolean evidenceMatched = validateEvidence(evidence, version.getNormalizedContent(), reasons);
        String section = evidenceMatched ? findSection(disclosure, version, evidence) : null;

        AmountResult amountResult = validateAmount(candidate, evidence, reasons);
        validateEventDate(candidate.getEventDate(), version.getNormalizedContent(), reasons);
        validateEventType(candidate.getEventType(), evidence, reasons);

        String fingerprint = fingerprint(
            candidate.getIssuerId(),
            candidate.getEventType(),
            candidate.getEventDate(),
            amountResult.normalizedAmount(),
            candidate.getDisclosureVersionId()
        );
        return new ValidationResult(
            reasons.isEmpty(),
            List.copyOf(reasons),
            amountResult.normalizedAmount(),
            candidate.getEventDate(),
            amountResult.normalizedCurrency(),
            evidenceMatched ? evidence : null,
            section,
            fingerprint,
            RULE_VERSION
        );
    }

    private void validateSource(
        CandidateRiskEvent candidate,
        AnalysisRun run,
        Disclosure disclosure,
        DisclosureVersion version,
        List<String> reasons
    ) {
        if (!candidate.getDisclosureVersionId().equals(version.getId())
            || !version.getDisclosureId().equals(disclosure.getId())) {
            reasons.add("SOURCE_DISCLOSURE_MISMATCH");
        }
        if (!candidate.getIssuerId().equals(disclosure.getIssuerId())) {
            reasons.add("ISSUER_MISMATCH");
        }
        if (!candidate.getAnalysisRunId().equals(run.getId())
            || !candidate.getDisclosureVersionId().equals(run.getDisclosureVersionId())
            || run.getStatus() != AnalysisRun.Status.SUCCESS) {
            reasons.add("ANALYSIS_RUN_SOURCE_MISMATCH");
        }
        if (!"ANALYZE".equals(version.getPreFilterDecision())) {
            reasons.add("SOURCE_NOT_PRE_FILTERED_FOR_ANALYSIS");
        }
    }

    private boolean validateEvidence(String evidence, String normalizedContent, List<String> reasons) {
        if (evidence == null || evidence.isBlank()) {
            reasons.add("EVIDENCE_BLANK");
            return false;
        }
        if (evidence.length() > MAX_EVIDENCE_LENGTH) {
            reasons.add("EVIDENCE_TOO_LONG");
        }
        if (!comparable(normalizedContent).contains(comparable(evidence))) {
            reasons.add("EVIDENCE_NOT_FOUND_IN_SOURCE");
            return false;
        }
        return true;
    }

    private AmountResult validateAmount(
        CandidateRiskEvent candidate,
        String evidence,
        List<String> reasons
    ) {
        BigDecimal amount = candidate.getAmount();
        String currency = candidate.getCurrency() == null
            ? null
            : candidate.getCurrency().trim().toUpperCase(Locale.ROOT);
        if (amount == null) {
            if (currency != null) {
                reasons.add("CURRENCY_WITHOUT_AMOUNT");
            }
            return new AmountResult(null, null);
        }
        BigDecimal normalizedAmount = amount.stripTrailingZeros();
        if (normalizedAmount.signum() < 0) {
            reasons.add("AMOUNT_NEGATIVE");
        }
        if (currency != null && !"KRW".equals(currency)) {
            reasons.add("CURRENCY_MISMATCH");
        }

        List<BigDecimal> evidenceAmounts = parseKrwAmounts(evidence == null ? "" : evidence);
        if (evidenceAmounts.isEmpty()) {
            reasons.add("AMOUNT_NOT_FOUND_IN_EVIDENCE");
        } else if (evidenceAmounts.stream().noneMatch(value -> value.compareTo(normalizedAmount) == 0)) {
            reasons.add("AMOUNT_MISMATCH");
        }
        return new AmountResult(normalizedAmount, "KRW");
    }

    private List<BigDecimal> parseKrwAmounts(String evidence) {
        List<BigDecimal> amounts = new ArrayList<>();
        Matcher matcher = MONEY.matcher(evidence);
        while (matcher.find()) {
            BigDecimal value = new BigDecimal(matcher.group(1).replace(",", ""));
            amounts.add(value.multiply(multiplier(matcher.group(2))).stripTrailingZeros());
        }
        return amounts;
    }

    private BigDecimal multiplier(String unit) {
        return switch (unit) {
            case "원" -> BigDecimal.ONE;
            case "천원" -> BigDecimal.valueOf(1_000);
            case "백만원" -> BigDecimal.valueOf(1_000_000);
            case "억원" -> BigDecimal.valueOf(100_000_000);
            default -> throw new IllegalArgumentException("Unsupported monetary unit: " + unit);
        };
    }

    private void validateEventDate(LocalDate eventDate, String source, List<String> reasons) {
        if (eventDate == null) {
            return;
        }
        List<String> forms = List.of(
            eventDate.toString(),
            eventDate.format(DateTimeFormatter.ofPattern("yyyy.MM.dd")),
            eventDate.format(DateTimeFormatter.ofPattern("yyyy년 M월 d일")),
            eventDate.format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일"))
        );
        if (forms.stream().noneMatch(source::contains)) {
            reasons.add("EVENT_DATE_NOT_FOUND_IN_SOURCE");
        }
    }

    private void validateEventType(RiskEventType eventType, String evidence, List<String> reasons) {
        String text = comparable(evidence == null ? "" : evidence);
        boolean valid = switch (eventType) {
            case DEBT_INCREASE -> containsAny(text, "단기차입", "차입금", "신규 차입", "추가 차입")
                && containsAny(
                    text,
                    "증가", "증액", "신규 차입", "추가 차입", "차입을 결정", "차입 결정", "차입하였", "차입했"
                );
            case CASH_DECREASE -> containsAny(text, "현금성자산", "현금및현금성자산", "현금")
                && containsAny(text, "감소", "줄어", "하락");
            case OPERATING_LOSS -> containsAny(text, "영업손실", "영업적자", "적자전환", "영업이익 적자");
            case CREDIT_RATING_CHANGE -> containsAny(text, "신용등급", "등급전망")
                && containsAny(text, "상향", "하향", "변경", "조정", "부정적", "긍정적");
            case GUARANTEE_INCREASE -> guaranteeIncreaseIsExplicit(text);
            case LIQUIDITY_WARNING -> containsAny(
                text,
                "유동성 위험", "유동성 부족", "유동성 우려", "유동성 악화", "유동성 위기",
                "자금경색", "상환 어려움", "상환 곤란"
            );
        };
        if (!valid) {
            reasons.add("EVENT_TYPE_RULE_NOT_SATISFIED_" + eventType.name());
        }
    }

    private boolean guaranteeIncreaseIsExplicit(String text) {
        if (!containsAny(text, "채무보증", "지급보증", "보증")) {
            return false;
        }
        if (containsAny(text, "한도 유지", "기존 한도 유지", "변동 없음", "증가 없음", "단순 갱신")) {
            return false;
        }
        return containsAny(text, "신규", "증가", "증액", "추가", "보증을 제공", "보증 제공 결정");
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private String findSection(Disclosure disclosure, DisclosureVersion version, String evidence) {
        DocumentContentNormalizer.NormalizedDocument document = normalizer.normalizeAndHash(
            disclosure.getTitle(),
            version.getRawContent()
        );
        String comparableEvidence = comparable(evidence);
        return document.sections().stream()
            .filter(section -> comparable(section.content()).contains(comparableEvidence))
            .map(DocumentContentNormalizer.NormalizedSection::heading)
            .findFirst()
            .orElse(null);
    }

    private String normalizeEvidence(String value) {
        if (value == null) {
            return null;
        }
        String decoded = Parser.unescapeEntities(value, false);
        if (HTML_TAG.matcher(decoded).find()) {
            decoded = Jsoup.parse(decoded).text();
        }
        return WHITESPACE.matcher(
            Normalizer.normalize(decoded, Normalizer.Form.NFC).replace('\u00A0', ' ')
        ).replaceAll(" ").trim();
    }

    private String comparable(String value) {
        if (value == null) {
            return "";
        }
        return WHITESPACE.matcher(
            Normalizer.normalize(value, Normalizer.Form.NFC).replace('\u00A0', ' ')
        ).replaceAll(" ").trim();
    }

    private String fingerprint(
        Long issuerId,
        RiskEventType eventType,
        LocalDate eventDate,
        BigDecimal amount,
        Long disclosureVersionId
    ) {
        String value = issuerId + "|" + eventType + "|" + (eventDate == null ? "" : eventDate) + "|"
            + (amount == null ? "" : amount.stripTrailingZeros().toPlainString()) + "|" + disclosureVersionId;
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public record ValidationResult(
        boolean valid,
        List<String> reasons,
        BigDecimal normalizedAmount,
        LocalDate normalizedEventDate,
        String normalizedCurrency,
        String matchedEvidence,
        String section,
        String fingerprint,
        String ruleVersion
    ) {
        public ValidationResult {
            reasons = List.copyOf(reasons);
        }
    }

    private record AmountResult(BigDecimal normalizedAmount, String normalizedCurrency) {
    }
}
