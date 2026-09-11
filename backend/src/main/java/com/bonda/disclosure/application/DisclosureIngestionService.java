package com.bonda.disclosure.application;

import com.bonda.disclosure.domain.Disclosure;
import com.bonda.disclosure.domain.DisclosureVersion;
import com.bonda.disclosure.infrastructure.DisclosureRepository;
import com.bonda.disclosure.infrastructure.DisclosureVersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DisclosureIngestionService {

    private static final String DISCLOSURE_TYPE = "DART";
    private static final Set<String> VERSION_PREFIXES = Set.of(
        "기재정정",
        "첨부정정",
        "첨부추가",
        "변경등록",
        "연장결정",
        "발행조건확정"
    );
    private static final Pattern TITLE_PREFIX = Pattern.compile("^\\s*\\[([^]]+)]\\s*");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    private final DisclosureRepository disclosureRepository;
    private final DisclosureVersionRepository versionRepository;
    private final DocumentContentNormalizer contentNormalizer;
    private final DisclosurePreFilter preFilter;

    public DisclosureIngestionService(
        DisclosureRepository disclosureRepository,
        DisclosureVersionRepository versionRepository,
        DocumentContentNormalizer contentNormalizer,
        DisclosurePreFilter preFilter
    ) {
        this.disclosureRepository = disclosureRepository;
        this.versionRepository = versionRepository;
        this.contentNormalizer = contentNormalizer;
        this.preFilter = preFilter;
    }

    @Transactional
    public IngestionResult ingest(
        Long issuerId,
        DartClient.DartDisclosure incoming,
        DartClient.DartDocument document
    ) {
        if (!incoming.receiptNo().equals(document.receiptNo())) {
            throw new IllegalArgumentException("DART list and document receipt numbers do not match");
        }

        DocumentContentNormalizer.NormalizedDocument normalized =
            contentNormalizer.normalizeAndHash(incoming.title(), document.rawContent());
        DisclosurePreFilter.PreFilterResult preFilterResult = preFilter.evaluate(DISCLOSURE_TYPE, normalized);
        Optional<Disclosure> existing = resolveExistingDisclosure(issuerId, incoming);
        boolean createdDisclosure = existing.isEmpty();

        Disclosure disclosure = existing.orElseGet(() -> disclosureRepository.save(
            Disclosure.create(
                issuerId,
                incoming.receiptNo(),
                incoming.title(),
                DISCLOSURE_TYPE,
                incoming.publishedAt()
            )
        ));

        String legacyHash = contentNormalizer.legacyHash(document.rawContent());
        boolean duplicate = versionRepository.existsByDisclosureIdAndDocumentHash(disclosure.getId(), normalized.hash())
            || (!legacyHash.equals(normalized.hash())
                && versionRepository.existsByDisclosureIdAndDocumentHash(disclosure.getId(), legacyHash));
        if (duplicate) {
            return new IngestionResult(
                IngestionStatus.DUPLICATE,
                disclosure.getId(),
                disclosure.getLatestVersionNumber()
            );
        }

        int versionNumber = disclosure.nextVersionNumber();
        disclosureRepository.save(disclosure);
        versionRepository.save(DisclosureVersion.create(
            disclosure.getId(),
            versionNumber,
            incoming.receiptNo(),
            normalized.hash(),
            document.rawContent(),
            normalized.content(),
            preFilterResult.decision().name(),
            String.join("\n", preFilterResult.matchedRules()),
            String.join("\n", preFilterResult.matchedKeywords()),
            String.join("\n", preFilterResult.targetSections()),
            preFilterResult.evaluatedAt(),
            preFilterResult.ruleVersion(),
            incoming.publishedAt()
        ));

        return new IngestionResult(
            createdDisclosure ? IngestionStatus.CREATED_DISCLOSURE : IngestionStatus.ADDED_VERSION,
            disclosure.getId(),
            versionNumber
        );
    }

    private Optional<Disclosure> resolveExistingDisclosure(Long issuerId, DartClient.DartDisclosure incoming) {
        Optional<Disclosure> byReceipt = disclosureRepository.findByReceiptNo(incoming.receiptNo());
        if (byReceipt.isPresent()) {
            return byReceipt;
        }

        Optional<DisclosureVersion> byVersionReceipt = versionRepository
            .findFirstBySourceReceiptNoOrderByVersionNumberDesc(incoming.receiptNo());
        if (byVersionReceipt.isPresent()) {
            return disclosureRepository.findById(byVersionReceipt.get().getDisclosureId());
        }

        if (incoming.originalReceiptNo() != null && !incoming.originalReceiptNo().isBlank()) {
            Optional<Disclosure> explicitParent = disclosureRepository.findByReceiptNo(incoming.originalReceiptNo());
            if (explicitParent.isPresent()) {
                return explicitParent;
            }
            Optional<DisclosureVersion> parentVersion = versionRepository
                .findFirstBySourceReceiptNoOrderByVersionNumberDesc(incoming.originalReceiptNo());
            if (parentVersion.isPresent()) {
                return disclosureRepository.findById(parentVersion.get().getDisclosureId());
            }
        }

        if (!isCorrectionTitle(incoming.title())) {
            return Optional.empty();
        }

        String canonicalIncomingTitle = canonicalTitle(incoming.title());
        List<Disclosure> candidates = disclosureRepository.findAllByIssuerIdOrderByPublishedAtDesc(issuerId)
            .stream()
            .filter(disclosure -> canonicalTitle(disclosure.getTitle()).equalsIgnoreCase(canonicalIncomingTitle))
            .filter(disclosure -> !disclosure.getPublishedAt().isAfter(incoming.publishedAt()))
            .toList();
        return candidates.size() == 1 ? Optional.of(candidates.getFirst()) : Optional.empty();
    }

    static boolean isCorrectionTitle(String title) {
        Matcher matcher = TITLE_PREFIX.matcher(title == null ? "" : title);
        return matcher.find() && VERSION_PREFIXES.contains(matcher.group(1).trim());
    }

    static String canonicalTitle(String title) {
        String canonical = title == null ? "" : title.trim();
        boolean removed;
        do {
            Matcher matcher = TITLE_PREFIX.matcher(canonical);
            removed = matcher.find() && VERSION_PREFIXES.contains(matcher.group(1).trim());
            if (removed) {
                canonical = canonical.substring(matcher.end()).trim();
            }
        } while (removed);
        return WHITESPACE.matcher(canonical).replaceAll(" ");
    }

    public enum IngestionStatus {
        CREATED_DISCLOSURE,
        ADDED_VERSION,
        DUPLICATE
    }

    public record IngestionResult(IngestionStatus status, Long disclosureId, int versionNumber) {
    }
}
