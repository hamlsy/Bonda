package com.bonda.sincebought.infrastructure;

import com.bonda.sincebought.application.CrossDocumentExplainer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "bonda.ai.enabled", havingValue = "false", matchIfMissing = true)
public class FakeCrossDocumentExplainer implements CrossDocumentExplainer {

    @Override
    public String model() {
        return "fake-local-v1";
    }

    @Override
    public ExplanationResult explain(ExplanationRequest request) {
        String summary = "매수 이후 검증된 공시와 위험 상태 변화가 확인됐습니다. "
            + "각 변화는 입력된 재무 흐름 및 상태 기록과 함께 시간순으로 정리했습니다. "
            + "이 변화만으로 상환능력 악화를 단정할 수는 없으며 관련 원문을 함께 확인할 필요가 있습니다.";
        return new ExplanationResult(
            summary,
            request.allowedEventIds(),
            request.allowedRiskChangeIds(),
            0,
            0
        );
    }
}
