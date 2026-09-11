package com.bonda.alert.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class AlertTest {

    @Test
    void markingReadTwiceKeepsTheOriginalReadTime() {
        Alert alert = Alert.create(
            1L, null, 2L, 3L, null, 4L, AlertSeverity.WATCH,
            "유동성 상태가 바뀌었어요", "정상에서 관찰로 바뀌었습니다.", "fingerprint",
            Instant.parse("2026-09-11T00:00:00Z")
        );

        alert.markRead(Instant.parse("2026-09-11T01:00:00Z"));
        alert.markRead(Instant.parse("2026-09-11T02:00:00Z"));

        assertThat(alert.isRead()).isTrue();
        assertThat(alert.getReadAt()).isEqualTo(Instant.parse("2026-09-11T01:00:00Z"));
    }
}

