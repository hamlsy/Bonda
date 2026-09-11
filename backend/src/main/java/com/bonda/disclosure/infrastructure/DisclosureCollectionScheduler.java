package com.bonda.disclosure.infrastructure;

import com.bonda.disclosure.application.DisclosureCollectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
    prefix = "bonda.dart.collection",
    name = "enabled",
    havingValue = "true"
)
public class DisclosureCollectionScheduler {

    private static final Logger log = LoggerFactory.getLogger(DisclosureCollectionScheduler.class);

    private final DisclosureCollectionService collectionService;

    public DisclosureCollectionScheduler(DisclosureCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @Scheduled(
        cron = "${bonda.dart.collection.cron:0 0 6 * * *}",
        zone = "${bonda.dart.collection.zone:Asia/Seoul}"
    )
    public void collect() {
        try {
            DisclosureCollectionService.CollectionSummary summary = collectionService.collect(null);
            log.info(
                "DART scheduled collection completed issuerCount={} found={} versionsCreated={} duplicates={} failures={}",
                summary.issuerCount(),
                summary.disclosuresFound(),
                summary.versionsCreated(),
                summary.duplicates(),
                summary.failures()
            );
        } catch (RuntimeException exception) {
            log.error("DART scheduled collection failed errorCode={}", exception.getClass().getSimpleName());
        }
    }
}
