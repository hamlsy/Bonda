package com.bonda.disclosure.application;

import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisclosureIngestionServiceTest {

    @Mock
    private DisclosureRepository disclosureRepository;

    @Mock
    private DisclosureVersionRepository versionRepository;

    private DisclosureIngestionService service;

    @BeforeEach
    void setUp() {
        service = new DisclosureIngestionService(
            disclosureRepository,
            versionRepository,
            new DocumentContentNormalizer(),
            new DisclosurePreFilter()
        );
    }

    @Test
    void createsANewDisclosureWithVersionOne() {
        DartClient.DartDisclosure incoming = disclosure("20260911000001", "사업보고서", null);
        when(disclosureRepository.findByReceiptNo(incoming.receiptNo())).thenReturn(Optional.empty());
        when(versionRepository.findFirstBySourceReceiptNoOrderByVersionNumberDesc(incoming.receiptNo()))
            .thenReturn(Optional.empty());
        when(disclosureRepository.save(any(Disclosure.class))).thenAnswer(invocation -> {
            Disclosure saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                ReflectionTestUtils.setField(saved, "id", 10L);
            }
            return saved;
        });
        when(versionRepository.existsByDisclosureIdAndDocumentHash(any(), any())).thenReturn(false);

        DisclosureIngestionService.IngestionResult result = service.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(incoming.receiptNo(), "<DOCUMENT>new</DOCUMENT>")
        );

        assertThat(result.status()).isEqualTo(DisclosureIngestionService.IngestionStatus.CREATED_DISCLOSURE);
        assertThat(result.versionNumber()).isEqualTo(1);
        ArgumentCaptor<DisclosureVersion> version = ArgumentCaptor.forClass(DisclosureVersion.class);
        verify(versionRepository).save(version.capture());
        assertThat(version.getValue().getVersionNumber()).isEqualTo(1);
        assertThat(version.getValue().getNormalizedContent()).isEqualTo("new");
        assertThat(version.getValue().getPreFilterDecision()).isEqualTo("SKIP");
        assertThat(version.getValue().getPreFilterRuleVersion()).isEqualTo("PRE_FILTER_V1");
    }

    @Test
    void skipsAnExistingDisclosureWhenItsNormalizedHashIsUnchanged() {
        DartClient.DartDisclosure incoming = disclosure("20260911000002", "사업보고서", null);
        Disclosure existing = persistedDisclosure(20L, incoming.receiptNo(), "사업보고서", 1);
        String hash = new DocumentContentNormalizer()
            .normalizeAndHash("<DOCUMENT>same</DOCUMENT>")
            .hash();
        when(disclosureRepository.findByReceiptNo(incoming.receiptNo())).thenReturn(Optional.of(existing));
        when(versionRepository.existsByDisclosureIdAndDocumentHash(existing.getId(), hash)).thenReturn(true);

        DisclosureIngestionService.IngestionResult result = service.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(incoming.receiptNo(), "<DOCUMENT>same</DOCUMENT>")
        );

        assertThat(result.status()).isEqualTo(DisclosureIngestionService.IngestionStatus.DUPLICATE);
        assertThat(existing.getLatestVersionNumber()).isEqualTo(1);
        verify(versionRepository, never()).save(any());
    }

    @Test
    void recognizesAHashStoredByThePreviousNormalizationStrategy() {
        DartClient.DartDisclosure incoming = disclosure("20260911000012", "사업보고서", null);
        Disclosure existing = persistedDisclosure(21L, incoming.receiptNo(), "사업보고서", 1);
        String rawContent = "<DOCUMENT>same</DOCUMENT><!-- generated -->";
        DocumentContentNormalizer normalizer = new DocumentContentNormalizer();
        String normalizedHash = normalizer.normalizeAndHash(incoming.title(), rawContent).hash();
        String legacyHash = normalizer.legacyHash(rawContent);
        when(disclosureRepository.findByReceiptNo(incoming.receiptNo())).thenReturn(Optional.of(existing));
        when(versionRepository.existsByDisclosureIdAndDocumentHash(existing.getId(), normalizedHash))
            .thenReturn(false);
        when(versionRepository.existsByDisclosureIdAndDocumentHash(existing.getId(), legacyHash))
            .thenReturn(true);

        DisclosureIngestionService.IngestionResult result = service.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(incoming.receiptNo(), rawContent)
        );

        assertThat(result.status()).isEqualTo(DisclosureIngestionService.IngestionStatus.DUPLICATE);
        verify(versionRepository, never()).save(any());
    }

    @Test
    void attachesAUniquelyMatchedCorrectionAsTheNextVersion() {
        DartClient.DartDisclosure incoming = disclosure("20260912000003", "[기재정정] 사업보고서", null);
        Disclosure existing = persistedDisclosure(30L, "20260911000003", "사업보고서", 1);
        when(disclosureRepository.findByReceiptNo(incoming.receiptNo())).thenReturn(Optional.empty());
        when(versionRepository.findFirstBySourceReceiptNoOrderByVersionNumberDesc(incoming.receiptNo()))
            .thenReturn(Optional.empty());
        when(disclosureRepository.findAllByIssuerIdOrderByPublishedAtDesc(1L)).thenReturn(List.of(existing));
        when(versionRepository.existsByDisclosureIdAndDocumentHash(any(), any())).thenReturn(false);
        when(disclosureRepository.save(any(Disclosure.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DisclosureIngestionService.IngestionResult result = service.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(incoming.receiptNo(), "<DOCUMENT>corrected</DOCUMENT>")
        );

        assertThat(result.status()).isEqualTo(DisclosureIngestionService.IngestionStatus.ADDED_VERSION);
        assertThat(result.versionNumber()).isEqualTo(2);
        ArgumentCaptor<DisclosureVersion> version = ArgumentCaptor.forClass(DisclosureVersion.class);
        verify(versionRepository).save(version.capture());
        assertThat(version.getValue().getDisclosureId()).isEqualTo(existing.getId());
        assertThat(version.getValue().getSourceReceiptNo()).isEqualTo(incoming.receiptNo());
    }

    @Test
    void keepsACorrectionSeparateWhenTheFallbackRelationIsAmbiguous() {
        DartClient.DartDisclosure incoming = disclosure("20260912000004", "[기재정정] 사업보고서", null);
        Disclosure firstCandidate = persistedDisclosure(41L, "20250911000004", "사업보고서", 1);
        Disclosure secondCandidate = persistedDisclosure(42L, "20260911000004", "사업보고서", 1);
        when(disclosureRepository.findByReceiptNo(incoming.receiptNo())).thenReturn(Optional.empty());
        when(versionRepository.findFirstBySourceReceiptNoOrderByVersionNumberDesc(incoming.receiptNo()))
            .thenReturn(Optional.empty());
        when(disclosureRepository.findAllByIssuerIdOrderByPublishedAtDesc(1L))
            .thenReturn(List.of(secondCandidate, firstCandidate));
        when(disclosureRepository.save(any(Disclosure.class))).thenAnswer(invocation -> {
            Disclosure saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                ReflectionTestUtils.setField(saved, "id", 43L);
            }
            return saved;
        });
        when(versionRepository.existsByDisclosureIdAndDocumentHash(any(), any())).thenReturn(false);

        DisclosureIngestionService.IngestionResult result = service.ingest(
            1L,
            incoming,
            new DartClient.DartDocument(incoming.receiptNo(), "<DOCUMENT>ambiguous</DOCUMENT>")
        );

        assertThat(result.status()).isEqualTo(DisclosureIngestionService.IngestionStatus.CREATED_DISCLOSURE);
        assertThat(result.disclosureId()).isEqualTo(43L);
    }

    private DartClient.DartDisclosure disclosure(String receiptNo, String title, String originalReceiptNo) {
        return new DartClient.DartDisclosure(
            receiptNo,
            title,
            Instant.parse("2026-09-12T00:00:00Z"),
            "",
            originalReceiptNo
        );
    }

    private Disclosure persistedDisclosure(Long id, String receiptNo, String title, int versions) {
        Disclosure disclosure = Disclosure.create(
            1L,
            receiptNo,
            title,
            "DART",
            Instant.parse("2026-09-11T00:00:00Z")
        );
        ReflectionTestUtils.setField(disclosure, "id", id);
        for (int number = 0; number < versions; number += 1) {
            disclosure.nextVersionNumber();
        }
        return disclosure;
    }
}
