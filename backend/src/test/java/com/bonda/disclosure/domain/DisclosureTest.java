package com.bonda.disclosure.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class DisclosureTest {

    @Test
    void advancesVersionsWithoutOverwritingHistory() {
        Disclosure disclosure = Disclosure.create(
            1L,
            "20260911000001",
            "사업보고서",
            "DART",
            Instant.parse("2026-09-11T00:00:00Z")
        );

        assertThat(disclosure.nextVersionNumber()).isEqualTo(1);
        assertThat(disclosure.nextVersionNumber()).isEqualTo(2);
        assertThat(disclosure.getLatestVersionNumber()).isEqualTo(2);
    }
}
