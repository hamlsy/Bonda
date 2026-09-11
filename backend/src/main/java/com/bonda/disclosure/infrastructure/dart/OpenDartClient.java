package com.bonda.disclosure.infrastructure.dart;

import com.bonda.disclosure.application.DartApiException;
import com.bonda.disclosure.application.DartClient;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Component
public class OpenDartClient implements DartClient {

    private static final DateTimeFormatter DART_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final ZoneId DART_ZONE = ZoneId.of("Asia/Seoul");
    private static final Pattern XML_STATUS = Pattern.compile("<status>\\s*([^<]+)\\s*</status>");
    private static final Pattern XML_MESSAGE = Pattern.compile("<message>\\s*([^<]+)\\s*</message>");

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final DartProperties properties;

    @Autowired
    public OpenDartClient(RestClient.Builder builder, ObjectMapper objectMapper, DartProperties properties) {
        this(buildRestClient(builder, properties), objectMapper, properties);
    }

    OpenDartClient(RestClient restClient, ObjectMapper objectMapper, DartProperties properties) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    private static RestClient buildRestClient(RestClient.Builder builder, DartProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.connectTimeout());
        requestFactory.setReadTimeout(properties.readTimeout());
        return builder
            .baseUrl(properties.baseUrl())
            .requestFactory(requestFactory)
            .build();
    }

    @Override
    public List<DartDisclosure> findDisclosures(String corpCode, LocalDate from, LocalDate to) {
        requireApiKey("LIST");

        List<DartDisclosure> disclosures = new ArrayList<>();
        int page = 1;
        int totalPages = 1;

        do {
            DartListResponse response = requestList(corpCode, from, to, page);
            if ("013".equals(response.status())) {
                return List.of();
            }
            requireSuccessfulBusinessResponse("LIST", response.status(), response.message());

            if (response.list() != null) {
                for (DartListItem item : response.list()) {
                    disclosures.add(toDisclosure(item));
                }
            }

            totalPages = parseTotalPages(response.totalPage());
            if (totalPages > properties.maxPages()) {
                throw new DartApiException(
                    "LIST",
                    "PAGE_LIMIT_EXCEEDED",
                    "DART list exceeds the configured page limit"
                );
            }
            page += 1;
        } while (page <= totalPages && page <= properties.maxPages());

        disclosures.sort(Comparator
            .comparing(DartDisclosure::publishedAt)
            .thenComparing(DartDisclosure::receiptNo));
        return List.copyOf(disclosures);
    }

    @Override
    public DartDocument fetchDocument(String receiptNo) {
        requireApiKey("DOCUMENT");

        byte[] response;
        try {
            response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/document.xml")
                    .queryParam("crtfc_key", properties.apiKey())
                    .queryParam("rcept_no", receiptNo)
                    .build())
                .retrieve()
                .body(byte[].class);
        } catch (RestClientException exception) {
            throw convertTransportError("DOCUMENT", exception);
        }

        if (response == null || response.length == 0) {
            throw new DartApiException("DOCUMENT", "EMPTY_RESPONSE", "DART returned an empty document response");
        }
        if (!isZip(response)) {
            throw parseDocumentError(response);
        }

        return new DartDocument(receiptNo, unzipDocument(response));
    }

    private DartListResponse requestList(String corpCode, LocalDate from, LocalDate to, int page) {
        String body;
        try {
            body = restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/list.json")
                    .queryParam("crtfc_key", properties.apiKey())
                    .queryParam("corp_code", corpCode)
                    .queryParam("bgn_de", DART_DATE.format(from))
                    .queryParam("end_de", DART_DATE.format(to))
                    .queryParam("last_reprt_at", "N")
                    .queryParam("page_no", page)
                    .queryParam("page_count", properties.pageSize())
                    .build())
                .retrieve()
                .body(String.class);
        } catch (RestClientException exception) {
            throw convertTransportError("LIST", exception);
        }

        if (body == null || body.isBlank()) {
            throw new DartApiException("LIST", "EMPTY_RESPONSE", "DART returned an empty list response");
        }

        try {
            return objectMapper.readValue(body, DartListResponse.class);
        } catch (JsonProcessingException exception) {
            throw new DartApiException("LIST", "MALFORMED_RESPONSE", "DART returned malformed list data");
        }
    }

    private DartDisclosure toDisclosure(DartListItem item) {
        if (item.receiptNo() == null || !item.receiptNo().matches("\\d{14}")
            || item.reportName() == null || item.reportName().isBlank()
            || item.receiptDate() == null || item.receiptDate().isBlank()) {
            throw new DartApiException("LIST", "MALFORMED_RESPONSE", "DART list item is missing required fields");
        }

        try {
            Instant publishedAt = LocalDate.parse(item.receiptDate(), DART_DATE)
                .atStartOfDay(DART_ZONE)
                .toInstant();
            return new DartDisclosure(
                item.receiptNo().trim(),
                item.reportName().trim(),
                publishedAt,
                item.remark(),
                item.originalReceiptNo()
            );
        } catch (DateTimeParseException exception) {
            throw new DartApiException("LIST", "MALFORMED_RESPONSE", "DART list item has an invalid receipt date");
        }
    }

    private int parseTotalPages(String totalPage) {
        if (totalPage == null || totalPage.isBlank()) {
            return 1;
        }
        try {
            return Math.max(Integer.parseInt(totalPage), 1);
        } catch (NumberFormatException exception) {
            throw new DartApiException("LIST", "MALFORMED_RESPONSE", "DART returned an invalid page count");
        }
    }

    private String unzipDocument(byte[] response) {
        Map<String, String> entries = new TreeMap<>();
        int totalBytes = 0;

        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(response), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                ByteArrayOutputStream content = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                int read;
                while ((read = zip.read(buffer)) != -1) {
                    totalBytes += read;
                    if (totalBytes > properties.maxDocumentBytes()) {
                        throw new DartApiException(
                            "DOCUMENT",
                            "DOCUMENT_TOO_LARGE",
                            "DART document exceeds the configured size limit"
                        );
                    }
                    content.write(buffer, 0, read);
                }
                entries.put(entry.getName(), content.toString(StandardCharsets.UTF_8));
            }
        } catch (IOException exception) {
            throw new DartApiException("DOCUMENT", "MALFORMED_RESPONSE", "DART returned an invalid ZIP document");
        }

        if (entries.isEmpty()) {
            throw new DartApiException("DOCUMENT", "EMPTY_RESPONSE", "DART ZIP document contains no files");
        }
        return String.join("\n", entries.values());
    }

    private DartApiException parseDocumentError(byte[] response) {
        String body = new String(response, StandardCharsets.UTF_8);
        Matcher status = XML_STATUS.matcher(body);
        Matcher message = XML_MESSAGE.matcher(body);
        if (status.find()) {
            String safeMessage = message.find() ? message.group(1).trim() : "DART document request failed";
            return new DartApiException("DOCUMENT", status.group(1).trim(), safeMessage);
        }
        return new DartApiException("DOCUMENT", "MALFORMED_RESPONSE", "DART returned a non-ZIP document response");
    }

    private void requireApiKey(String requestType) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new DartApiException(requestType, "MISSING_API_KEY", "DART API key is not configured");
        }
    }

    private void requireSuccessfulBusinessResponse(String requestType, String status, String message) {
        if (!"000".equals(status)) {
            String safeMessage = message == null || message.isBlank() ? "DART request failed" : message;
            throw new DartApiException(requestType, status == null ? "MISSING_STATUS" : status, safeMessage);
        }
    }

    private DartApiException convertTransportError(String requestType, RestClientException exception) {
        if (exception instanceof ResourceAccessException) {
            return new DartApiException(requestType, "NETWORK_OR_TIMEOUT", "DART request timed out or could not connect");
        }
        if (exception instanceof RestClientResponseException responseException) {
            return new DartApiException(
                requestType,
                "HTTP_" + responseException.getStatusCode().value(),
                "DART returned an HTTP error"
            );
        }
        return new DartApiException(requestType, "HTTP_CLIENT_ERROR", "DART HTTP request failed");
    }

    private boolean isZip(byte[] response) {
        return response.length >= 4
            && response[0] == 0x50
            && response[1] == 0x4b
            && response[2] == 0x03
            && response[3] == 0x04;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DartListResponse(
        String status,
        String message,
        @JsonProperty("total_page") String totalPage,
        List<DartListItem> list
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DartListItem(
        @JsonProperty("rcept_no") String receiptNo,
        @JsonProperty("report_nm") String reportName,
        @JsonProperty("rcept_dt") String receiptDate,
        @JsonProperty("rm") String remark,
        @JsonProperty("original_rcept_no") String originalReceiptNo
    ) {
    }
}
