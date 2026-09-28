# Bonda Project Rules

- `docs/PRODUCT.md`와 `docs/IMPLEMENTATION_SPEC.md`는 제품 및 구현의 source of truth다. `SPEC.md`는 간결한 요약과 링크를 제공한다.
- 큰 기능은 검증 가능한 작은 vertical slice로 나누고, 기존 코드와 관련 문서를 먼저 읽은 뒤 필요한 파일만 수정한다.
- 불필요한 파일, dependency, frontend 계층을 추가하지 않는다. Backend domain rule에는 필요한 만큼만 DDD를 적용한다.
- LLM output을 검증된 사실로 저장하지 않는다. 숫자 계산과 risk state 결정은 deterministic logic으로 구현한다.
- 핵심 domain logic에는 테스트가 필요하다. secret은 환경변수로 주입하고 코드·설정·로그에 저장하지 않는다.

## Development Workflow

- 시작할 때 `AGENTS.md`, `STATUS.md`, `PLAN.md`, `git status`를 읽고 필요하면 `git diff`를 확인한다. 관련 작업에서만 `SPEC.md`와 상세 source 문서를 읽는다.
- Main Codex가 기본 개발자이며 직접 구현하고 테스트한다. 승인된 현재 milestone이 없으면 제품 작업을 시작하지 않는다.
- 기본 흐름: STATUS/현재 milestone 확인 → 필요한 코드 조사 → 필요한 경우 bounded read-only explorer → Main 구현 → build/test → milestone acceptance 확인 → milestone review → STATUS/PLAN 갱신.
- 상태와 재개 지점은 작업 시작 및 의미 있는 전환마다 `STATUS.md`에 기록한다. PLAN은 milestone 상태나 acceptance가 바뀔 때 갱신한다.
- 기존 사용자 변경을 보존한다. 대규모 dependency upgrade, 파괴적 DB migration, production deploy, credential 변경, force push, 강제 reset, branch 삭제를 recovery 작업에서 하지 않는다. 사람 판단이 필요한 작업은 `BLOCKED`로 둔다.

## Delegation and Review

- Subagent는 독립적인 read-only 조사에만 우선 사용한다. 최대 동시 수는 2이며 child agent는 다른 agent를 spawn하지 않는다. 한 milestone에서 원칙적으로 두 개까지만 사용하고 단순 구현을 위임하지 않는다.
- 같은 파일을 여러 write agent가 수정하지 않는다. Main Codex가 모든 변경과 테스트를 책임진다.
- 작은 작업마다 review하지 않는다. milestone 완료 시 reviewer를 한 번 호출하고 결과를 `BLOCKER`와 `FOLLOW-UP`으로 나눈다. FOLLOW-UP은 현재 milestone을 막지 않는다. BLOCKER 수정 후 필요한 경우에만 한 번 재검토한다.

## Testing

- AI의 추정은 테스트 근거가 아니다. 관련 명령을 실제 실행하고 결과를 확인한다. 순서는 build/compile → unit → integration → API → E2E다. 실행하지 않은 단계는 통과로 보고하지 않는다.
- 현재 명령: backend `backend\gradlew.bat test`; frontend `npm run build` (frontend 디렉터리); E2E `npm run test:ui` (frontend 디렉터리).

## Finance Review Rules

금융 로직 변경 시 금액 단위와 precision, 날짜 기준, 상태 전이, 중복 및 멱등성, transaction boundary와 rollback, null·예외 데이터, 기존 계산 회귀, 데이터 provenance를 확인한다.

## Context and Recovery

- 저장소 전체를 매 단계 재분석하지 말고 SPEC/PLAN/STATUS와 관련 파일만 읽는다. 대형 로그를 대화에 복사하지 않는다.
- Recovery는 durable STATUS부터 이어간다. 사용량 제한이면 `WAITING_FOR_RESET`, 사람 조치가 필요하면 `BLOCKED`, 모든 승인된 milestone이 끝났으면 `DONE`으로 기록한다.
- 이번 자동화 migration 중에는 신규 채권 제품 기능을 시작하지 않는다.
