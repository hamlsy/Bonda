package com.bonda.disclosure.infrastructure.dart;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

@ConfigurationProperties("bonda.dart")
public record DartProperties(
    @DefaultValue("https://opendart.fss.or.kr") String baseUrl,
    String apiKey,
    @DefaultValue("7") int lookbackDays,
    @DefaultValue("100") int pageSize,
    @DefaultValue("10") int maxPages,
    @DefaultValue("10485760") int maxDocumentBytes,
    @DefaultValue("5s") Duration connectTimeout,
    @DefaultValue("20s") Duration readTimeout,
    @DefaultValue Collection collection
) {

    public record Collection(
        @DefaultValue("false") boolean enabled,
        @DefaultValue("0 0 6 * * *") String cron,
        @DefaultValue("Asia/Seoul") String zone
    ) {
    }
}
