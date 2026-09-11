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
- 이 단계에서는 LLM을 호출하거나 Risk Event를 생성하지 않는다.

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

## Database

PostgreSQL schema는 Flyway migration으로만 변경한다. 개발 확인용 seed는 이름과 코드에 `[데모]` 또는 `DEMO`를 명시한다. DART API Key는 `DART_API_KEY` 환경변수로만 주입한다.

## Frontend scope

현재 화면은 Bond 목록 조회와 Holding/Watchlist 등록 연결을 확인하는 최소 제품 UI다. 본격적인 visual redesign은 별도 단계에서 제공 목업과 Loopy loop를 기준으로 진행한다.

## 제외 범위

LLM 기반 extraction, Risk Event/Snapshot/Change, Since I Bought, 알림, 과거 전체 재생과 운영용 관리자 화면은 구현하지 않는다.
