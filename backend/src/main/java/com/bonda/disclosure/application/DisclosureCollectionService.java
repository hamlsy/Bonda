package com.bonda.disclosure.application;

import com.bonda.disclosure.infrastructure.dart.DartProperties;
import com.bonda.issuer.domain.Issuer;
import com.bonda.issuer.infrastructure.IssuerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class DisclosureCollectionService {

    private static final Logger log = LoggerFactory.getLogger(DisclosureCollectionService.class);

    private final IssuerRepository issuerRepository;
    private final DartClient dartClient;
    private final DisclosureIngestionService ingestionService;
    private final DartProperties properties;
    private final Clock clock;

    @Autowired
    public DisclosureCollectionService(
        IssuerRepository issuerRepository,
        DartClient dartClient,
        DisclosureIngestionService ingestionService,
        DartProperties properties
    ) {
        this(
            issuerRepository,
            dartClient,
            ingestionService,
            properties,
            Clock.system(ZoneId.of(properties.collection().zone()))
        );
    }

    DisclosureCollectionService(
        IssuerRepository issuerRepository,
        DartClient dartClient,
        DisclosureIngestionService ingestionService,
        DartProperties properties,
        Clock clock
    ) {
        this.issuerRepository = issuerRepository;
        this.dartClient = dartClient;
        this.ingestionService = ingestionService;
        this.properties = properties;
        this.clock = clock;
    }

    public CollectionSummary collect(Long issuerId) {
        List<Issuer> issuers = issuerId == null
            ? issuerRepository.findTop5ByOrderByIdAsc()
            : List.of(issuerRepository.findById(issuerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issuer not found")));

        MutableSummary summary = new MutableSummary(issuers.size());
        LocalDate to = LocalDate.now(clock);
        LocalDate from = to.minusDays(properties.lookbackDays());

        for (Issuer issuer : issuers) {
            collectIssuer(issuer, from, to, summary);
        }
        return summary.toResult();
    }

    private void collectIssuer(Issuer issuer, LocalDate from, LocalDate to, MutableSummary summary) {
        String corpCode = issuer.getCorpCode();
        if (corpCode == null || !corpCode.matches("\\d{8}")) {
            summary.skippedIssuers += 1;
            log.warn(
                "DART collection skipped issuerId={} corpCode={} requestType=TARGET_VALIDATION errorCode=INVALID_CORP_CODE",
                issuer.getId(),
                corpCode
            );
            return;
        }

        List<DartClient.DartDisclosure> disclosures;
        try {
            disclosures = dartClient.findDisclosures(corpCode, from, to);
            summary.disclosuresFound += disclosures.size();
        } catch (DartApiException exception) {
            recordExternalFailure(issuer, null, exception, summary);
            return;
        }

        for (DartClient.DartDisclosure disclosure : disclosures) {
            try {
                DartClient.DartDocument document = dartClient.fetchDocument(disclosure.receiptNo());
                DisclosureIngestionService.IngestionResult result =
                    ingestionService.ingest(issuer.getId(), disclosure, document);
                summary.record(result.status());
            } catch (DartApiException exception) {
                recordExternalFailure(issuer, disclosure.receiptNo(), exception, summary);
            } catch (DataIntegrityViolationException exception) {
                summary.duplicates += 1;
                log.warn(
                    "DART disclosure duplicate blocked issuerId={} corpCode={} receiptNo={} requestType=PERSIST errorCode=UNIQUE_CONSTRAINT",
                    issuer.getId(),
                    corpCode,
                    disclosure.receiptNo()
                );
            } catch (RuntimeException exception) {
                summary.failures += 1;
                summary.failureDetails.add(new CollectionFailure(
                    issuer.getId(),
                    disclosure.receiptNo(),
                    "PERSIST",
                    exception.getClass().getSimpleName()
                ));
                log.error(
                    "DART disclosure persistence failed issuerId={} corpCode={} receiptNo={} requestType=PERSIST errorCode={}",
                    issuer.getId(),
                    corpCode,
                    disclosure.receiptNo(),
                    exception.getClass().getSimpleName()
                );
            }
        }
    }

    private void recordExternalFailure(
        Issuer issuer,
        String receiptNo,
        DartApiException exception,
        MutableSummary summary
    ) {
        summary.failures += 1;
        summary.failureDetails.add(new CollectionFailure(
            issuer.getId(),
            receiptNo,
            exception.getRequestType(),
            exception.getErrorCode()
        ));
        log.warn(
            "DART request failed issuerId={} corpCode={} receiptNo={} requestType={} errorCode={}",
            issuer.getId(),
            issuer.getCorpCode(),
            receiptNo,
            exception.getRequestType(),
            exception.getErrorCode()
        );
    }

    public record CollectionSummary(
        int issuerCount,
        int disclosuresFound,
        int disclosuresCreated,
        int versionsCreated,
        int duplicates,
        int skippedIssuers,
        int failures,
        List<CollectionFailure> failureDetails
    ) {
    }

    public record CollectionFailure(Long issuerId, String receiptNo, String requestType, String errorCode) {
    }

    private static final class MutableSummary {
        private final int issuerCount;
        private int disclosuresFound;
        private int disclosuresCreated;
        private int versionsCreated;
        private int duplicates;
        private int skippedIssuers;
        private int failures;
        private final List<CollectionFailure> failureDetails = new ArrayList<>();

        private MutableSummary(int issuerCount) {
            this.issuerCount = issuerCount;
        }

        private void record(DisclosureIngestionService.IngestionStatus status) {
            switch (status) {
                case CREATED_DISCLOSURE -> {
                    disclosuresCreated += 1;
                    versionsCreated += 1;
                }
                case ADDED_VERSION -> versionsCreated += 1;
                case DUPLICATE -> duplicates += 1;
            }
        }

        private CollectionSummary toResult() {
            return new CollectionSummary(
                issuerCount,
                disclosuresFound,
                disclosuresCreated,
                versionsCreated,
                duplicates,
                skippedIssuers,
                failures,
                List.copyOf(failureDetails)
            );
        }
    }
}
