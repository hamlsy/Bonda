# Golden Dataset Annotation Rules

## 기본 단위

- JSONL 한 줄은 하나의 `DisclosureVersion`이다. 정정 전후 문서는 별도 sample로 유지한다.
- 실제 DART 원문과 접수번호를 확인한 human label만 `DART_HUMAN_LABELED`로 기록한다.
- 실제 DART 표본의 `documentHash`는 UTF-8 `normalizedText`의 SHA-256과 일치해야 하며 loader가 검증한다.
- 문서 전체가 실패하거나 어려운 사례여도 제외하지 않는다. 변경·제외 시 이유를 annotation notes와 변경 이력에 남긴다.
- `eventExists`는 `events`가 비어 있지 않을 때만 `true`다.

## Event Type

- `DEBT_INCREASE`: 차입금 또는 총차입 부담의 명시적 증가·신규 조달.
- `CASH_DECREASE`: 현금 및 현금성자산의 명시적 감소.
- `OPERATING_LOSS`: 영업손실 발생 또는 흑자에서 영업적자 전환.
- `CREDIT_RATING_CHANGE`: 신용등급·등급전망·watch 상태의 명시적 변경.
- `GUARANTEE_INCREASE`: 채무·지급보증의 신규 제공 또는 보증액 증가.
- `LIQUIDITY_WARNING`: 지급불능, 상환 곤란, 회생 신청 등 직접적인 유동성 경고.
- 단순 현황·반복 표기·가능성 언급만 있고 변화가 확정되지 않으면 Event로 표시하지 않는다.

## 필드 기준

- `amount`: Event 자체의 명시 금액을 원 단위로 환산한다. 여러 금액 중 증가분과 잔액을 혼동하지 않는다. 금액이 명시되지 않으면 `null`이다.
- `eventDate`: Event가 발생·결정된 날짜다. 문서 공개일을 임의로 복사하지 않는다. 명시되지 않으면 `null`이다.
- `evidenceText`: Event를 독립적으로 확인할 수 있는 최소 연속 원문 span이다. 해석이나 요약을 쓰지 않는다.
- `currency`: 원화는 `KRW`; 불명확하거나 amount가 없으면 `null`이다.

## 복수·애매한 사례

- 한 문서에 독립적인 Event가 여러 개면 `events`에 각각 기록한다.
- 같은 Event의 표와 본문 반복은 하나로 합친다.
- 근거가 부족하면 negative로 숨기지 말고 `annotation.notes`에 ambiguity를 기록하고 2인 검토 전까지 `DRAFT`로 둔다.
- LLM prediction을 본 뒤 GT를 수정하지 않는다. 원문 재검토로 수정했다면 이유를 기록한다.

## Matching policy

- 같은 `documentId` 안에서 같은 `eventType`끼리만 one-to-one matching한다.
- 동일 Type 후보가 여러 개면 evidence token overlap, amount, date 순으로 가장 가까운 한 건을 선택한다.
- amount accuracy는 GT amount가 있는 matched Event에서 1% 또는 1원 중 큰 tolerance를 사용한다.
- event date는 exact match, evidence는 정규화된 substring 포함 또는 token Jaccard 0.5 이상을 사용한다.
- 하나의 GT에 여러 prediction을 붙이지 않으며 남는 prediction은 False Positive다.
- pre-filter recall은 GT Event가 하나 이상인 문서 중 `ANALYZE` 문서 비율, skip ratio는 전체 문서 중 `SKIP` 비율로 계산한다.

## Error stage

- `NORMALIZATION`: 원문 표·section·문자 손실.
- `PRE_FILTER`: 정답 Event 문서를 SKIP.
- `PROMPT`: 분석 입력에는 있었지만 LLM이 누락·오분류.
- `VALIDATION`: 올바른 Candidate가 deterministic validation에서 탈락.
