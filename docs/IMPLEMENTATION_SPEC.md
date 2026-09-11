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

- `FinancialSnapshot`은 MVP에서 연결 재무제표만 허용하고 `(issuerId, period, statementScope)`로 중복을 막는다. `totalDebt`는 `shortTermDebt + longTermDebt`로 계산하며 같은 기간의 다른 값은 충돌로 처리한다.
- 증감률은 이전 값이 없거나 0이면 nullable로 유지한다. 현금·부채 잔액은 음수를 허용하지 않고, 영업현금흐름과 영업이익은 음수를 허용해 절댓값 기준 악화율과 양수→음수 전환을 계산한다.
- `RISK_POLICY_V1`은 `NORMAL`, `WATCH`, `CAUTION`만 사용한다. 모든 threshold는 `RiskThresholds`에 모으고 최근 180일의 Canonical Event만 반영한다.
- `IssuerRiskSnapshot`은 `(issuerId, snapshotDate, ruleVersion)`이 unique이며 source input fingerprint와 category별 reason/source ID trace를 저장한다. Snapshot date는 최신 재무 기준일과 최신 Canonical Event 유효일 중 늦은 날짜다.
- `RiskChange`는 직전 Snapshot과 실제로 달라진 category만 저장한다. `(currentSnapshotId, category)` unique와 input fingerprint 재사용으로 Snapshot/Change 재계산을 idempotent하게 유지한다.

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

## Database

PostgreSQL schema는 Flyway migration으로만 변경한다. 개발 확인용 seed는 이름과 코드에 `[데모]` 또는 `DEMO`를 명시한다. DART와 AI API key는 각각 `DART_API_KEY`, `OPENAI_API_KEY` 환경변수로만 주입한다.

## Frontend scope

현재 화면은 Bond 목록 조회와 Holding/Watchlist 등록 연결을 확인하는 최소 제품 UI다. 본격적인 visual redesign은 별도 단계에서 제공 목업과 Loopy loop를 기준으로 진행한다.

## 제외 범위

Since I Bought, 알림, 과거 전체 재생과 운영용 관리자 화면은 구현하지 않는다.
