package com.bonda.disclosure;

import com.bonda.disclosure.application.DartClient;
import com.bonda.disclosure.application.DisclosureIngestionService;
import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DisclosurePersistenceIntegrationTest {

    @Autowired
    private DisclosureRepository disclosureRepository;

    @Autowired
    private DisclosureVersionRepository versionRepository;

    @Autowired
    private DisclosureIngestionService ingestionService;

    @Test
    void storesDisclosureAndItsDocumentVersion() {
        Disclosure disclosure = disclosureRepository.saveAndFlush(disclosure("20260911001001"));
        DisclosureVersion version = versionRepository.saveAndFlush(DisclosureVersion.create(
            disclosure.getId(),
            disclosure.nextVersionNumber(),
            disclosure.getReceiptNo(),
            "a".repeat(64),
            "<DOCUMENT>raw</DOCUMENT>",
            "raw",
            "SKIP",
            "DOCUMENT_TOO_SHORT",
            "",
            "",
            Instant.parse("2026-09-11T00:00:00Z"),
            "PRE_FILTER_V1",
            Instant.parse("2026-09-11T00:00:00Z")
        ));

        assertThat(version.getId()).isNotNull();
        assertThat(versionRepository.findAllByDisclosureIdOrderByVersionNumberAsc(disclosure.getId()))
            .extracting(DisclosureVersion::getVersionNumber)
            .containsExactly(1);
    }

    @Test
    void databaseRejectsDuplicateVersionNumbers() {
        Disclosure disclosure = disclosureRepository.saveAndFlush(disclosure("20260911001002"));
        versionRepository.saveAndFlush(DisclosureVersion.create(
            disclosure.getId(), 1, disclosure.getReceiptNo(), "b".repeat(64),
            "first", "first", "SKIP", "", "", "",
            Instant.parse("2026-09-11T00:00:00Z"), "PRE_FILTER_V1",
            Instant.parse("2026-09-11T00:00:00Z")
        ));

        assertThatThrownBy(() -> versionRepository.saveAndFlush(DisclosureVersion.create(
            disclosure.getId(), 1, "20260911001003", "c".repeat(64),
            "second", "second", "SKIP", "", "", "",
            Instant.parse("2026-09-11T01:00:00Z"), "PRE_FILTER_V1",
            Instant.parse("2026-09-11T01:00:00Z")
        ))).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void correctionAddsVersionAndSameHashDoesNotAddAnother() {
        DartClient.DartDisclosure original = dartDisclosure("20260911001004", "사업보고서");
        DartClient.DartDisclosure correction = dartDisclosure("20260912001004", "[기재정정] 사업보고서");

        DisclosureIngestionService.IngestionResult first = ingestionService.ingest(
            1L,
            original,
            new DartClient.DartDocument(original.receiptNo(), "<DOCUMENT>original</DOCUMENT>")
        );
        DisclosureIngestionService.IngestionResult second = ingestionService.ingest(
            1L,
            correction,
            new DartClient.DartDocument(correction.receiptNo(), "<DOCUMENT>corrected</DOCUMENT>")
        );
        DisclosureIngestionService.IngestionResult duplicate = ingestionService.ingest(
            1L,
            correction,
            new DartClient.DartDocument(correction.receiptNo(), "<DOCUMENT>corrected</DOCUMENT><!-- duplicate -->")
        );

        assertThat(first.status()).isEqualTo(DisclosureIngestionService.IngestionStatus.CREATED_DISCLOSURE);
        assertThat(second.status()).isEqualTo(DisclosureIngestionService.IngestionStatus.ADDED_VERSION);
        assertThat(duplicate.status()).isEqualTo(DisclosureIngestionService.IngestionStatus.DUPLICATE);
        assertThat(versionRepository.findAllByDisclosureIdOrderByVersionNumberAsc(first.disclosureId()))
            .extracting(DisclosureVersion::getVersionNumber)
            .containsExactly(1, 2);
        assertThat(disclosureRepository.findById(first.disclosureId()).orElseThrow().getLatestVersionNumber())
            .isEqualTo(2);
        DisclosureVersion corrected = versionRepository
            .findAllByDisclosureIdOrderByVersionNumberAsc(first.disclosureId()).get(1);
        assertThat(corrected.getNormalizedContent()).isEqualTo("corrected");
        assertThat(corrected.getPreFilterDecision()).isEqualTo("SKIP");
        assertThat(corrected.getPreFilterRuleVersion()).isEqualTo("PRE_FILTER_V1");
    }

    @Test
    void ingestionStoresAnalyzeEvidenceAndTargetSections() {
        DartClient.DartDisclosure incoming = dartDisclosure(
            "20260911001005",
            "단기차입금 증가 결정"
        );

        DisclosureIngestionService.IngestionResult result = ingestionService.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(incoming.receiptNo(), """
                <DOCUMENT>
                  <TITLE>차입금 및 유동성</TITLE>
                  <P>2026년 9월 11일 단기차입금이 300억원에서 800억원으로 증가했습니다.</P>
                </DOCUMENT>
                """)
        );

        DisclosureVersion version = versionRepository
            .findAllByDisclosureIdOrderByVersionNumberAsc(result.disclosureId()).getFirst();
        assertThat(version.getPreFilterDecision()).isEqualTo("ANALYZE");
        assertThat(version.getPreFilterMatchedRules()).contains("RISK_DISCLOSURE_TITLE");
        assertThat(version.getPreFilterMatchedKeywords()).contains("단기차입", "차입금", "유동성");
        assertThat(version.getPreFilterTargetSections()).isEqualTo("차입금 및 유동성");
        assertThat(version.getPreFilterEvaluatedAt()).isNotNull();
        assertThat(version.getPreFilterRuleVersion()).isEqualTo("PRE_FILTER_V1");
    }

    private Disclosure disclosure(String receiptNo) {
        return Disclosure.create(
            1L,
            receiptNo,
            "테스트 공시",
            "DART",
            Instant.parse("2026-09-11T00:00:00Z")
        );
    }

    private DartClient.DartDisclosure dartDisclosure(String receiptNo, String title) {
        return new DartClient.DartDisclosure(
            receiptNo,
            title,
            Instant.parse(receiptNo.startsWith("20260912")
                ? "2026-09-12T00:00:00Z"
                : "2026-09-11T00:00:00Z"),
            "",
            null
        );
    }
}
