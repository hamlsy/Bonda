package com.bonda.disclosure.application;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface DartClient {

    List<DartDisclosure> findDisclosures(String corpCode, LocalDate from, LocalDate to);

    DartDocument fetchDocument(String receiptNo);

    record DartDisclosure(
        String receiptNo,
        String title,
        Instant publishedAt,
        String remark,
        String originalReceiptNo
    ) {
    }

    record DartDocument(String receiptNo, String rawContent) {
    }
}
