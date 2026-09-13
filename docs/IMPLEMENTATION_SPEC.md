# Bonda Implementation Specification

## 기술 구성

- Frontend: React, TypeScript, Vite, React Router, CSS
- Backend: Java 21, Spring Boot, Gradle, Spring Web, Spring Data JPA, Validation, PostgreSQL, Flyway, JUnit 5
- Deployment target: Vercel(frontend), Koyeb(backend), Neon(PostgreSQL)

## 구조 원칙

- backend는 DDD 기반 Modular Monolith를 유지한다.
- 현재 module은 `issuer`, `bond`, `portfolio`, `disclosure`이며 필요한 곳에만 `presentation`, `application`, `domain`, `infrastructure` package를 둔다.
- module 간 entity association 대신 식별자로 참조한다.
- frontend는 `src` 바로 아래의 소수 파일로 구성하고 상태관리/UI framework를 추가하지 않는다.
- MSA, Kafka, Redis, Kubernetes와 불필요한 abstraction은 도입하지 않는다.

## Core domain

- Issuer: `id`, `corpCode`, `name`, `stockCode`, `createdAt`, `updatedAt`
- Bond: `id`, `issuerId`, `isin`, `bondCode`, `name`, `issueDate`, `maturityDate`, `couponRate`, `creditRating`, `createdAt`
- Holding: `id`, `bondId`, `purchaseDate`, `purchaseAmount`, `createdAt`
- Watchlist: `id`, `bondId`, `createdAt`

Holding은 여러 매수 건을 허용한다. Watchlist는 동일 채권의 중복 등록을 허용하지 않는다.

## Disclosure ingestion

- OpenDART `list.json`으로 등록된 Issuer의 공시 목록을 조회하고 `document.xml` ZIP 원문을 수집한다.
- `Disclosure.receiptNo`는 unique이며, 각 원문은 `DisclosureVersion`으로 보존한다.
- Version은 `(disclosureId, versionNumber)`가 unique이고, 동일 Disclosure의 동일 SHA-256 `documentHash`는 다시 저장하지 않는다.
- `sourceReceiptNo`는 각 Version이 어떤 DART 접수에서 왔는지 추적한다.
- 정정 제목이 기존 Disclosure의 기준 제목과 유일하게 일치할 때만 새 Version으로 연결한다. 관계가 모호하면 별도 Disclosure로 저장한다.
- 외부 HTTP 요청은 저장 transaction 밖에서 수행한다.
- Scheduler는 기본 비활성화하며 한 번에 ID 순 5개 Issuer까지만 수집한다. 숫자 8자리 DART `corpCode`가 아닌 데모 대상은 건너뛴다.

## Disclosure preparation

- DART HTML/XML/plain text 원문은 `NORMALIZATION_V1` 규칙으로 정리하고 section heading, table row/header 관계, 금액과 날짜를 보존한 `normalizedContent`를 생성한다.
- `documentHash`는 `SHA-256(normalizedContent)`를 사용한다. 기존 normalization hash로 저장된 Version도 전환 중 중복 판정에 함께 사용한다.
- `PRE_FILTER_V1`은 title, section, risk keyword, 변화·정량 문맥과 문서 길이를 조합해 `ANALYZE` 또는 `SKIP`을 결정한다.
- 판정, matched rule/keyword, target section, 판정 시각과 rule version은 `DisclosureVersion`에 저장한다. migration 이전 Version의 pre-filter 필드는 미평가 상태로 nullable을 유지한다.
- pre-filter 결과가 `ANALYZE`인 Version만 AI extraction 입력이 된다.

## AI extraction

- `RiskEventExtractor` port와 OpenAI-compatible Responses API adapter를 분리한다. 기본 비활성화 상태에서는 `fake-local-v1` extractor가 외부 호출 없이 동작한다.
- 실제 adapter의 모델은 `BONDA_AI_MODEL` 한 곳에서 설정하며 기본값은 비용 민감형 `gpt-5.6-luna`다. API key는 `OPENAI_API_KEY` 환경변수만 사용한다.
- `RISK_EXTRACTION_V1` prompt와 strict JSON schema는 6개 Event Type만 허용한다: `DEBT_INCREASE`, `CASH_DECREASE`, `OPERATING_LOSS`, `CREDIT_RATING_CHANGE`, `GUARANTEE_INCREASE`, `LIQUIDITY_WARNING`.
- target section이 있으면 해당 section을 우선 전달하고 입력 길이를 제한한다. 동일 `documentHash + model + promptVersion`의 성공 실행은 재사용한다.
- `AnalysisRun`은 상태, token, latency, retry, nullable estimated USD cost와 오류를 기록한다. 일시적 timeout/429/5xx만 최대 3회 재시도한다.
- 추출 결과는 fingerprint로 실행 내 중복을 줄인 뒤 상태가 `PENDING`인 `CandidateRiskEvent`로 저장한다.

## Candidate validation and canonical events

- `RISK_VALIDATION_V1`은 Candidate의 issuer/source 연결, 원문 evidence 포함 여부, 원·천원·백만원·억원 금액의 정확 일치, 명시된 event date와 Event Type별 최소 사실 조건을 deterministic하게 검증한다.
- 검증 실패는 모든 사유를 기록하고 Candidate를 `REJECTED`로 변경한다. 검증 성공은 Candidate를 `VERIFIED`로 변경하면서 Canonical `RiskEvent`와 최소 한 건의 `RiskEventEvidence`를 같은 transaction에서 생성한다.
- Canonical fingerprint는 `issuerId + eventType + eventDate + amount + disclosureVersionId`의 SHA-256이다. 동일 fingerprint가 있으면 새 Canonical을 만들지 않고 Candidate를 기존 Event에 `VERIFIED`로 연결한다.
- 검증 API는 이미 처리된 Candidate에 대해 기존 결과를 반환한다. 시스템 예외는 검증 실패로 간주하지 않으며 transaction rollback으로 `PENDING` 상태를 보존한다.

## Financial and issuer risk snapshots

- `FinancialSnapshot`은 MVP에서 연결 재무제표만 허용하고 `(issuerId, period, statementScope)`로 중복을 막는다. `publishedOn`은 replay의 정보 가용 시점을 나타낸다. 입력에서 누락되면 ingestion 날짜(미래 statement라면 statement 날짜)를 사용하며, 기존 행도 생성일보다 앞선 날짜로 소급하지 않는다. `totalDebt`는 `shortTermDebt + longTermDebt`로 계산하며 같은 기간의 다른 값은 충돌로 처리한다.
- 증감률은 이전 값이 없거나 0이면 nullable로 유지한다. 현금·부채 잔액은 음수를 허용하지 않고, 영업현금흐름과 영업이익은 음수를 허용해 절댓값 기준 악화율과 양수→음수 전환을 계산한다.
- `RISK_POLICY_V1`은 `NORMAL`, `WATCH`, `CAUTION`만 사용한다. 모든 threshold는 `RiskThresholds`에 모으고 최근 180일의 Canonical Event만 반영한다.
- `IssuerRiskSnapshot`은 `(issuerId, snapshotDate, ruleVersion)`이 unique이며 source input fingerprint와 category별 reason/source ID trace를 저장한다. Snapshot date는 최신 재무 기준일과 최신 Canonical Event 유효일 중 늦은 날짜다.
- `RiskChange`는 직전 Snapshot과 실제로 달라진 category만 저장한다. `(currentSnapshotId, category)` unique와 input fingerprint 재사용으로 Snapshot/Change 재계산을 idempotent하게 유지한다.

## Since I Bought

- Holding의 `purchaseDate`를 포함한 이후 Canonical `RiskEvent`와 RiskChange만 조회하고, 매수 시점을 Timeline 시작점으로 포함한다. 날짜가 없는 Event를 임의로 배치하지 않는다.
- 재무 기준점은 매수일 이전의 가장 가까운 Snapshot, 현재 값은 최신 Snapshot을 사용한다. 10% 이상 변화 또는 부호 전환만 최대 4개까지 deterministic하게 표시한다.
- Cross-document explanation은 Canonical Event, RiskChange, 선택한 재무 Snapshot과 현재 Risk State만 입력으로 사용한다. 새 Event 또는 Change가 없으면 호출하지 않는다.
- 설명 cache fingerprint는 Holding, 모델·prompt version, 전체 Event/Change ID, 재무 기준점과 현재 Risk Snapshot identity를 포함한다. 같은 입력은 저장된 설명을 재사용한다.
- `SINCE_BOUGHT_EXPLANATION_V1`은 3~5문장의 보수적인 한국어 설명만 허용하고 Risk State 결정, 인과 단정, 부도 예측과 투자 추천을 금지한다.

## Alert and monitoring

- Alert는 검증된 Canonical `RiskEvent` 또는 deterministic `RiskChange`만 source로 사용하고 AI에게 생성 여부나 severity를 맡기지 않는다.
- `AlertPolicy`는 CAUTION 전환을 `IMPORTANT`, WATCH 전환을 `WATCH`, 정상 방향 전환을 `INFO`로 분류한다. Event 단독 알림은 `LIQUIDITY_WARNING`, `CREDIT_RATING_CHANGE`만 허용하고 `IMPORTANT`를 만들지 않는다.
- RiskChange가 생성된 실행에서는 RiskChange Alert를 우선하고 같은 Event의 단독 Alert를 추가하지 않는다.
- Alert는 Issuer의 모든 Bond를 통해 Holding과 Watchlist에 연결한다. Holding에는 매수일 이후 source만 연결하며 target마다 stable fingerprint를 저장한다. DB unique constraint가 validation/recalculation 재실행 중복을 막는다.
- Candidate validation과 Risk recalculation의 기존 transaction은 유지한다. `MonitoringService`가 검증, 재계산, 짧은 Alert 생성 transaction을 순서대로 orchestration한다.
- 읽음 처리는 idempotent하며 최초 `readAt`을 보존한다.
- My Bonds summary는 Holding별 최신 IssuerRiskSnapshot, 매수 이후 최신 RiskChange와 Canonical Event 수, unread Alert 수와 최근 Alert를 조합하고 unread 항목을 우선 정렬한다.

## Historical Replay

- `issuerId + cutoffDate` 입력으로 cutoff의 Asia/Seoul 일 종료 시점까지 공개된 Disclosure만 조회한다.
- Disclosure마다 cutoff까지 공개된 Version 중 `publishedAt`, `versionNumber` 순 최신 하나만 선택한다. 현재 latestVersion을 과거 시점에 재사용하지 않는다.
- Canonical Event는 선택된 Version에 연결되고 `eventDate <= cutoffDate`인 항목만 사용한다. eventDate가 없으면 source Version 공개일을 effective date로 사용한다.
- FinancialSnapshot은 `statementDate <= cutoffDate`와 `publishedOn <= cutoffDate`를 모두 만족해야 한다.
- 현재 `RISK_POLICY_V1`을 cutoff date 기준으로 순수 계산하고 source 공개 시점별 상태 변화를 재현한다. Replay service는 read-only transaction이며 IssuerRiskSnapshot, RiskChange, Alert를 저장하지 않는다.
- 결과 fingerprint는 issuer, cutoff, rule version, 선택 Version/Event/Financial ID로 만들며 실행 시각과 successful AnalysisRun의 model/promptVersion을 metadata에 포함한다.

## Evaluation

- `evaluation/golden/risk-events.jsonl`은 실제 DART 원문을 사람이 검토한 `REVIEWED` label만 허용한다. synthetic sample은 `evaluation/fixtures`에 분리한다.
- 동일 document 안에서 eventType이 같은 prediction과 GT를 one-to-one matching한다. amount는 1% tolerance, date는 exact, evidence는 normalized substring 또는 token Jaccard 0.5를 사용한다.
- Keyword와 Regex baseline, production analysis endpoint를 사용하는 LLM, pre-filter가 ANALYZE인 문서만 호출하는 Hybrid를 비교한다.
- LLM cache key는 `documentHash + model + promptVersion`이며 cache miss는 `disclosureVersionId`와 실행 중인 backend가 있을 때만 호출한다. 조건이 없으면 `NOT_MEASURED`로 기록한다.
- report는 Precision, Recall, F1, Event Type/Amount/Date/Evidence Accuracy, pre-filter recall/skip ratio, calls/token/cost/latency와 FP/FN stage를 Markdown/JSON으로 생성한다.

## REST API

- `GET /api/health`
- `GET /api/bonds`
- `GET /api/bonds/{bondId}`
- `POST /api/holdings`
- `GET /api/holdings`
- `DELETE /api/holdings/{holdingId}`
- `POST /api/watchlist`
- `GET /api/watchlist`
- `DELETE /api/watchlist/{watchlistId}`
- `POST /api/admin/disclosures/collect?issuerId={issuerId}`
- `POST /api/admin/analysis/{disclosureVersionId}`
- `POST /api/admin/candidates/{candidateId}/validate`
- `POST /api/admin/issuers/{issuerId}/financial-snapshots`
- `POST /api/admin/issuers/{issuerId}/risk/recalculate`
- `GET /api/holdings/{holdingId}/since-bought`
- `GET /api/risk-events/{riskEventId}`
- `GET /api/alerts?unreadOnly={boolean}&limit={number}`
- `PATCH /api/alerts/{alertId}/read`
- `GET /api/holdings/summary`
- `POST /api/admin/replay`

## Database

PostgreSQL schema는 Flyway migration으로만 변경한다. 개발 확인용 seed는 이름과 코드에 `[데모]` 또는 `DEMO`를 명시한다. DART와 AI API key는 각각 `DART_API_KEY`, `OPENAI_API_KEY` 환경변수로만 주입한다.

## Frontend scope

My Bonds 화면은 변화가 있는 Holding과 unread Alert를 먼저 보여주며, Holding별 Since I Bought 또는 Risk Event Evidence로 명확히 이동한다. Holding/Watchlist 등록과 Since I Bought의 현재 Risk State, 날짜순 Timeline, 원문 Evidence, 보수적인 변화 설명, 재무 기준점 비교를 mobile-first로 유지한다.

### Frontend-first capability status

UI는 `/` 온보딩과 `/monitoring` 작업공간으로 나눈다. 현재 API가 있는 기능은 실제 데이터와 연결하고, 아직 서버 계약이 없는 기능은 `데모` 또는 `연동 준비 중`으로 명시한다. 미연동 기능은 결제·인증·저장·외부 발송이 완료된 것처럼 표시하지 않는다.

| 기능 | 현재 frontend | 필요한 후속 backend |
|---|---|---|
| 보유·관심 채권, 알림, 매수 이후, 원문, 과거 재현 | 실제 API 연동 | 기존 계약 유지 |
| 보유·관심 채권 삭제 | 확인 dialog 후 실제 API 연동 | 기존 DELETE 계약 유지 |
| 채권 검색·등급·만기·위험 필터 | client-side | query, sort, paging가 포함된 검색 API |
| 로그인·사용자 메뉴 | session 내 UI demo | 사용자 domain, OAuth, session, 포트폴리오 소유권 |
| 알림 조건·카카오·이메일 | 설정·메시지 preview | 연락처 인증, preference, delivery adapter와 이력 |
| 요금제·결제 | 가격 비교 UI demo | 상품 정책, 구독 lifecycle, 결제·해지·환불 |
| 직접 채권 진단 | 입력과 결과 상태 demo | 채권 식별, 공시 ingestion, analysis run, candidate validation |
| 재분석·추가 질문 | pending/result/failure UI demo | 비용·rate limit가 있는 분석 endpoint와 근거 제한 |
| 시장가격·YTM·상세 비율 | 데이터 미연동 상태 표시 | 시장 데이터와 정규화된 재무 metric API |

인증, 외부 알림, 결제는 MVP 제외 범위를 유지하며 각 domain/API 계약이 승인된 뒤에만 실제 side effect를 연결한다.

## 제외 범위

Push/Email/SMS, Evaluation Dashboard와 AI 추천 화면은 구현하지 않는다.
