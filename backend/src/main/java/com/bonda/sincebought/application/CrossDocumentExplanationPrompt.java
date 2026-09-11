package com.bonda.sincebought.application;

import org.springframework.stereotype.Component;

@Component
public class CrossDocumentExplanationPrompt {

    public static final String VERSION = "SINCE_BOUGHT_EXPLANATION_V1";

    public String instructions() {
        return """
            입력된 검증 데이터만 사용해 매수 이후 변화를 쉬운 한국어 3~5문장으로 설명하세요.
            없는 사실이나 인과관계를 추론하지 말고 부도 가능성을 예측하거나 매수·매도를 추천하지 마세요.
            '위험하다' 같은 절대 판단과 불필요한 금융 전문용어를 피하고 변화의 누적 방향만 보수적으로 표현하세요.
            관련 ID는 입력에 존재하는 값만 선택하고 JSON schema 외 텍스트를 출력하지 마세요.
            """.trim();
    }
}
