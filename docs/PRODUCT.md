# Bonda Product

## 제품 정의

Bonda는 개인투자자가 보유하거나 관심 있는 회사채의 발행기업을 지속적으로 확인하고, 채권 매수 이후 새롭게 발생한 신용위험 관련 변화를 탐지하도록 돕는 AI Credit Monitoring 서비스다. 서비스명은 `Bond + 본다`를 뜻한다.

## 핵심 사용자 가치

- 흩어진 발행기업 정보를 지속적으로 확인할 수 있다.
- 채권 매수 이후 달라진 신용위험 신호를 놓치지 않는다.
- 원문 사실, 정량 계산, AI 해석을 구분해 이해할 수 있다.

## 제품 원칙

- 숫자 계산과 risk state 결정은 재현 가능한 deterministic logic으로 구현한다.
- LLM output은 검증된 사실로 직접 저장하지 않는다.
- 큰 기능은 검증 가능한 작은 vertical slice로 개발한다.

## 현재 단계

Issuer, Bond, Holding, Watchlist를 첫 core domain으로 제공한다. MVP에서는 회원을 구분하지 않는 1인 포트폴리오로 동작한다. 등록된 발행기업의 DART 공시를 증분 수집하고, 원문이 달라진 정정공시는 과거 원문을 보존한 새 Version으로 기록한다. 수집 원문은 section과 table 의미를 보존한 텍스트로 정규화하고, deterministic pre-filter로 AI 분석 대상 여부와 대상 section을 기록한다. `ANALYZE` 문서는 구조화된 AI extraction을 거쳐 검증 전 `CandidateRiskEvent`로 저장한다.

## 제외 범위

Candidate 검증과 Canonical Risk Event 승격, Risk Snapshot/Change, Since I Bought, Alert, Historical Replay, 운영용 Admin Dashboard는 아직 구현하지 않는다.
