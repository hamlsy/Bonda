package com.bonda.ai.application;

import com.bonda.ai.domain.AnalysisRun;
import com.bonda.ai.domain.CandidateRiskEvent;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.disclosure.application.DocumentContentNormalizer;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CandidateRiskEventValidatorTest {

    private final DocumentContentNormalizer normalizer = new DocumentContentNormalizer();
    private final CandidateRiskEventValidator validator = new CandidateRiskEventValidator(normalizer);

    @Test
    void validatesEvidenceWithWhitespaceDifferencesAndKrwAmountUnits() {
        String raw = """
            <DOCUMENT><TITLE>차입금 변동</TITLE>
            <P>2026년 9월 11일 단기차입금이 300억원에서 800억원으로 증가했습니다.</P>
            </DOCUMENT>
            """;
        CandidateRiskEvent candidate = candidate(
            RiskEventType.DEBT_INCREASE,
            LocalDate.of(2026, 9, 11),
            new BigDecimal("80000000000"),
            "KRW",
            "단기차입금이   300억원에서\n800억원으로 증가했습니다."
        );

        CandidateRiskEventValidator.ValidationResult result = validate(candidate, raw);

        assertThat(result.valid()).isTrue();
        assertThat(result.reasons()).isEmpty();
        assertThat(result.normalizedAmount()).isEqualByComparingTo("80000000000");
        assertThat(result.matchedEvidence()).isEqualTo("단기차입금이 300억원에서 800억원으로 증가했습니다.");
        assertThat(result.section()).isEqualTo("차입금 변동");
        assertThat(result.ruleVersion()).isEqualTo("RISK_VALIDATION_V1");
    }

    @Test
    void rejectsEvidenceInventedByAi() {
        CandidateRiskEventValidator.ValidationResult result = validate(
            candidate(RiskEventType.LIQUIDITY_WARNING, null, null, null, "유동성 위기가 임박했습니다."),
            "<DOCUMENT><TITLE>자금 현황</TITLE><P>보유 자금을 공시합니다.</P></DOCUMENT>"
        );

        assertThat(result.valid()).isFalse();
        assertThat(result.reasons()).contains("EVIDENCE_NOT_FOUND_IN_SOURCE");
    }

    @Test
    void rejectsAmountThatDoesNotMatchEvidence() {
        CandidateRiskEventValidator.ValidationResult result = validate(
            candidate(
                RiskEventType.DEBT_INCREASE,
                null,
                new BigDecimal("90000000000"),
                "KRW",
                "단기차입금이 800억원으로 증가했습니다."
            ),
            "<DOCUMENT><P>단기차입금이 800억원으로 증가했습니다.</P></DOCUMENT>"
        );

        assertThat(result.valid()).isFalse();
        assertThat(result.reasons()).contains("AMOUNT_MISMATCH");
    }

    @Test
    void allowsNullableAmountWhenEventRuleDoesNotRequireIt() {
        CandidateRiskEventValidator.ValidationResult result = validate(
            candidate(RiskEventType.OPERATING_LOSS, null, null, null, "당기 영업손실이 발생했습니다."),
            "<DOCUMENT><P>당기 영업손실이 발생했습니다.</P></DOCUMENT>"
        );

        assertThat(result.valid()).isTrue();
        assertThat(result.normalizedAmount()).isNull();
        assertThat(result.normalizedCurrency()).isNull();
    }

    @Test
    void rejectsDebtBalanceWithoutAnIncreaseFact() {
        CandidateRiskEventValidator.ValidationResult result = validate(
            candidate(RiskEventType.DEBT_INCREASE, null, null, null, "현재 단기차입금은 800억원입니다."),
            "<DOCUMENT><P>현재 단기차입금은 800억원입니다.</P></DOCUMENT>"
        );

        assertThat(result.valid()).isFalse();
        assertThat(result.reasons()).contains("EVENT_TYPE_RULE_NOT_SATISFIED_DEBT_INCREASE");
    }

    @Test
    void rejectsGuaranteeWhoseExistingLimitIsMaintained() {
        CandidateRiskEventValidator.ValidationResult result = validate(
            candidate(RiskEventType.GUARANTEE_INCREASE, null, null, null, "채무보증 기존 한도 유지로 변동 없음"),
            "<DOCUMENT><P>채무보증 기존 한도 유지로 변동 없음</P></DOCUMENT>"
        );

        assertThat(result.valid()).isFalse();
        assertThat(result.reasons()).contains("EVENT_TYPE_RULE_NOT_SATISFIED_GUARANTEE_INCREASE");
    }

    @Test
    void acceptsCreditRatingChangeButRejectsCurrentRatingOnly() {
        CandidateRiskEventValidator.ValidationResult changed = validate(
            candidate(RiskEventType.CREDIT_RATING_CHANGE, null, null, null, "신용등급이 A에서 BBB로 하향 조정되었습니다."),
            "<DOCUMENT><P>신용등급이 A에서 BBB로 하향 조정되었습니다.</P></DOCUMENT>"
        );
        CandidateRiskEventValidator.ValidationResult currentOnly = validate(
            candidate(RiskEventType.CREDIT_RATING_CHANGE, null, null, null, "현재 신용등급은 BBB입니다."),
            "<DOCUMENT><P>현재 신용등급은 BBB입니다.</P></DOCUMENT>"
        );

        assertThat(changed.valid()).isTrue();
        assertThat(currentOnly.valid()).isFalse();
        assertThat(currentOnly.reasons()).contains("EVENT_TYPE_RULE_NOT_SATISFIED_CREDIT_RATING_CHANGE");
    }

    @Test
    void rejectsCandidateForAnotherIssuer() {
        CandidateRiskEvent candidate = CandidateRiskEvent.create(
            40L,
            2L,
            30L,
            RiskEventType.OPERATING_LOSS,
            null,
            null,
            null,
            null,
            "영업손실이 발생했습니다.",
            null
        );

        CandidateRiskEventValidator.ValidationResult result = validate(
            candidate,
            "<DOCUMENT><P>영업손실이 발생했습니다.</P></DOCUMENT>"
        );

        assertThat(result.valid()).isFalse();
        assertThat(result.reasons()).contains("ISSUER_MISMATCH");
    }

    private CandidateRiskEvent candidate(
        RiskEventType type,
        LocalDate date,
        BigDecimal amount,
        String currency,
        String evidence
    ) {
        return CandidateRiskEvent.create(
            40L,
            1L,
            30L,
            type,
            date,
            amount,
            currency,
            null,
            evidence,
            null
        );
    }

    private CandidateRiskEventValidator.ValidationResult validate(CandidateRiskEvent candidate, String raw) {
        Disclosure disclosure = mock(Disclosure.class);
        when(disclosure.getId()).thenReturn(20L);
        when(disclosure.getIssuerId()).thenReturn(1L);
        when(disclosure.getTitle()).thenReturn("테스트 공시");

        DisclosureVersion version = mock(DisclosureVersion.class);
        when(version.getId()).thenReturn(30L);
        when(version.getDisclosureId()).thenReturn(20L);
        when(version.getRawContent()).thenReturn(raw);
        when(version.getNormalizedContent()).thenReturn(normalizer.normalizeAndHash("테스트 공시", raw).content());
        when(version.getPreFilterDecision()).thenReturn("ANALYZE");

        AnalysisRun run = mock(AnalysisRun.class);
        when(run.getId()).thenReturn(40L);
        when(run.getDisclosureVersionId()).thenReturn(30L);
        when(run.getStatus()).thenReturn(AnalysisRun.Status.SUCCESS);

        return validator.validate(candidate, run, disclosure, version);
    }
}
