package com.bonda.disclosure.infrastructure.dart;

import com.bonda.disclosure.application.DartApiException;
import com.bonda.disclosure.application.DartClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpMethod.GET;

class OpenDartClientTest {

    private MockRestServiceServer server;
    private OpenDartClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://opendart.test");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new OpenDartClient(builder.build(), new ObjectMapper(), properties());
    }

    @Test
    void parsesDisclosureListFixtureWithoutCallingTheRealApi() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString("/api/list.json")))
            .andExpect(method(GET))
            .andExpect(queryParam("crtfc_key", "test-api-key"))
            .andExpect(queryParam("corp_code", "00126380"))
            .andExpect(queryParam("last_reprt_at", "N"))
            .andRespond(withSuccess("""
                {
                  "status": "000",
                  "message": "정상",
                  "total_page": "1",
                  "list": [
                    {
                      "rcept_no": "20260911000001",
                      "report_nm": "[기재정정] 사업보고서",
                      "rcept_dt": "20260911",
                      "rm": "정"
                    }
                  ]
                }
                """, MediaType.APPLICATION_JSON));

        List<DartClient.DartDisclosure> result = client.findDisclosures(
            "00126380",
            LocalDate.of(2026, 9, 1),
            LocalDate.of(2026, 9, 11)
        );

        assertThat(result).singleElement().satisfies(disclosure -> {
            assertThat(disclosure.receiptNo()).isEqualTo("20260911000001");
            assertThat(disclosure.title()).isEqualTo("[기재정정] 사업보고서");
            assertThat(disclosure.remark()).isEqualTo("정");
        });
        server.verify();
    }

    @Test
    void extractsXmlContentFromTheDocumentZip() throws Exception {
        server.expect(requestTo(org.hamcrest.Matchers.containsString("/api/document.xml")))
            .andExpect(method(GET))
            .andExpect(queryParam("rcept_no", "20260911000002"))
            .andRespond(withSuccess(zip("report.xml", "<DOCUMENT>공시 본문</DOCUMENT>"),
                MediaType.APPLICATION_OCTET_STREAM));

        DartClient.DartDocument document = client.fetchDocument("20260911000002");

        assertThat(document.rawContent()).isEqualTo("<DOCUMENT>공시 본문</DOCUMENT>");
        server.verify();
    }

    @Test
    void convertsDartBusinessErrorsToSafeApplicationErrors() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString("/api/list.json")))
            .andRespond(withSuccess("""
                {"status":"020","message":"요청 제한 초과","total_page":"0","list":[]}
                """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.findDisclosures(
            "00126380",
            LocalDate.of(2026, 9, 1),
            LocalDate.of(2026, 9, 11)
        )).isInstanceOfSatisfying(DartApiException.class, exception -> {
            assertThat(exception.getRequestType()).isEqualTo("LIST");
            assertThat(exception.getErrorCode()).isEqualTo("020");
            assertThat(exception.getMessage()).doesNotContain("test-api-key");
        });
        server.verify();
    }

    private DartProperties properties() {
        return new DartProperties(
            "https://opendart.test",
            "test-api-key",
            7,
            100,
            10,
            1024 * 1024,
            Duration.ofSeconds(1),
            Duration.ofSeconds(1),
            new DartProperties.Collection(false, "0 0 6 * * *", "Asia/Seoul")
        );
    }

    private byte[] zip(String name, String content) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
            zip.putNextEntry(new ZipEntry(name));
            zip.write(content.getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
        }
        return bytes.toByteArray();
    }
}
