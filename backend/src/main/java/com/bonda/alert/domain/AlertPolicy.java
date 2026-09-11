package com.bonda.alert.domain;

import com.bonda.ai.domain.RiskEvent;
import com.bonda.ai.domain.RiskEventType;
import com.bonda.risk.domain.RiskCategory;
import com.bonda.risk.domain.RiskChange;
import com.bonda.risk.domain.RiskState;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AlertPolicy {

    public Decision forRiskChange(String issuerName, RiskChange change) {
        AlertSeverity severity = switch (change.getCurrentState()) {
            case CAUTION -> AlertSeverity.IMPORTANT;
            case WATCH -> AlertSeverity.WATCH;
            case NORMAL -> AlertSeverity.INFO;
        };
        String category = categoryName(change.getCategory());
        return new Decision(
            severity,
            category + " 상태가 바뀌었어요",
            issuerName + "의 " + category + " 상태가 "
                + stateName(change.getPreviousState()) + "에서 " + stateName(change.getCurrentState())
                + "로 바뀌었습니다. 변화의 근거를 확인해 주세요."
        );
    }

    public Optional<Decision> forRiskEvent(String issuerName, RiskEvent event, RiskState currentState) {
        boolean selectedEvent = event.getEventType() == RiskEventType.LIQUIDITY_WARNING
            || event.getEventType() == RiskEventType.CREDIT_RATING_CHANGE;
        if (!selectedEvent) {
            return Optional.empty();
        }
        AlertSeverity severity = event.getEventType() == RiskEventType.LIQUIDITY_WARNING
            || currentState == RiskState.WATCH || currentState == RiskState.CAUTION
            ? AlertSeverity.WATCH
            : AlertSeverity.INFO;
        String change = eventName(event.getEventType());
        return Optional.of(new Decision(
            severity,
            change + " 변화가 확인됐어요",
            issuerName + "에 " + change + " 변화가 확인됐습니다. 검증된 공시 원문을 확인해 주세요."
        ));
    }

    private String categoryName(RiskCategory category) {
        return switch (category) {
            case LIQUIDITY -> "유동성";
            case CASH_FLOW -> "현금흐름";
            case LEVERAGE -> "부채 부담";
            case EARNINGS -> "수익성";
            case CREDIT -> "신용";
        };
    }

    private String stateName(RiskState state) {
        return switch (state) {
            case NORMAL -> "정상";
            case WATCH -> "관찰";
            case CAUTION -> "주의";
        };
    }

    private String eventName(RiskEventType type) {
        return switch (type) {
            case DEBT_INCREASE -> "차입금 증가";
            case CASH_DECREASE -> "현금성 자산 감소";
            case OPERATING_LOSS -> "영업손실";
            case CREDIT_RATING_CHANGE -> "신용등급";
            case GUARANTEE_INCREASE -> "보증 부담 증가";
            case LIQUIDITY_WARNING -> "유동성 경고";
        };
    }

    public record Decision(AlertSeverity severity, String title, String message) {
    }
}
