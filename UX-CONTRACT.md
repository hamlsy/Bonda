# UX Contract

## Product context

- Audience: 한국 개인 회사채 투자자
- Primary jobs: 보유 채권의 새 변화를 찾고, 매수 후 사건과 계산을 비교하고, 검증된 원문 근거를 확인한다.
- Target market(s): 대한민국
- Active locales: `ko-KR`
- Language/content register and native-review policy: 한국어 우선, 금융·법적 표현은 제품 책임자가 검토한다.
- Timezone/calendar policy: `Asia/Seoul`, Gregorian calendar, 날짜는 `YYYY. MM. DD.`로 표시한다.
- Accessibility target: WCAG 2.2 AA

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| 제품 범위와 금지 표현 | `docs/PRODUCT.md` | Product brief | 2026-09-14 |
| 데이터 lifecycle와 API | `docs/IMPLEMENTATION_SPEC.md` | Domain/API spec | 2026-09-14 |
| 삭제와 중복 처리 | `docs/IMPLEMENTATION_SPEC.md` Holding/Watchlist | Domain spec | 2026-09-14 |
| 시각 개선 승인 범위 | `docs/FRONTEND_REFINEMENT_PLAN.md` | Approved plan | 2026-09-14 |
| 한국 금융 콘텐츠 관례 | `docs/PRODUCT.md` | Product brief | 2026-09-14 |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`
- Token ownership model: existing runtime canonical
- Runtime design-system/token source: `frontend/src/styles.css`
- Mapping/export/adapters: CSS custom properties in `:root`; React components consume semantic class names.
- Token drift gate: `npm run check:ui`, Design.md lint, strict premium audit
- Supported themes: light and forced-colors; dark theme is out of scope.
- Design-context owner/review policy: product owner approves material direction changes; implementation updates both runtime tokens and `DESIGN.md` in one slice.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Table Selection | page-owned row selection | `MonitoringPage.tsx` | current page only | component + E2E |
| Select/Listbox | native `<select>` | `HistoricalReplayPage.tsx`, responsive bond selector | native | keyboard + popup |
| Date | native `<input type="date">` | landing/replay registration forms | native | locale + keyboard + E2E |
| Form | React app validation | route component | create / edit | validation E2E |
| Scrollbar | global CSS | `frontend/src/styles.css` | horizontal chart overflow only | computed style |
| Toast | shared `Toast` | `frontend/src/Dialogs.tsx` | success / warning / info / error | live-region test |
| CRUD | route component + `api.ts` | REST contract | return / stay by ledger | full-flow E2E |

## Component behavior

| Component | Default | Hover | Focus | Active | Disabled | Busy | Error |
|---|---|---|---|---|---|---|---|
| Button | stable label | semantic color change | 2px outline | 1px press | reason available | width stable + spinner | inline status |
| Icon button | icon + accessible name | surface tint | 2px outline | pressed tint | unavailable | same target | inline status |
| Input | label + helper | rule darkens | 2px outline | n/a | read-only tone | submit owns pending | inline message + `aria-invalid` |
| Search | clear + immediate local filter | rule darkens | 2px outline | n/a | n/a | n/a | no-results recovery |
| Textarea | resize none | rule darkens | 2px outline | n/a | read-only tone | submit owns pending | inline message |
| Table/list | aligned rows | row tint | row/action outline | selected rail | muted | geometry retained | in-place recovery |

## Dataset navigation

- Admin tables: historical replay is a separate advanced route; no bulk selection in MVP.
- Exploratory lists: monitoring search/filter is local and retains selected bond when still present.
- URL state: route and section hash are committed; search/filter text stays transient because it is local demo state.
- Page size: no pagination for the MVP portfolio list; future API pagination must use 20 rows by default.
- Empty/no-results/error/loading treatment: keep workspace geometry, state the reason, provide one recovery action.
- Back/scroll restoration: browser back restores route; selected mobile detail scrolls to its heading without obscuring focus.
- Selection scope: one bond at a time, keyboard-operable button rows; filter changes selection only when the prior item is absent.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery | Focus outcome | Source ref |
|---|---|---|---|---|---|---|---|
| Create holding/watchlist | submit validated form | disable duplicate submit | monitoring list | inline status/toast | preserve values, retry | created row or first error | `docs/IMPLEMENTATION_SPEC.md` |
| Delete | explicit delete + confirm | disable confirm | current list | row removed + status | dialog remains, retry | next row or trigger | `docs/IMPLEMENTATION_SPEC.md` |
| Search | type query | immediate local result | same workspace | result count | reset action | search remains focused | approved plan |
| Cancel/back | cancel or Escape | n/a | previous surface | none | n/a | opener restored | `Dialogs.tsx` |
| Upload/background job | admin execution | stable progress status | current route | deterministic result | retry only safe failures | status heading | `docs/IMPLEMENTATION_SPEC.md` |

## Navigation and responsive behavior

- Route document title policy: `{현재 화면} | Bonda`; Not Found uses `페이지를 찾을 수 없음 | Bonda`.
- Route error / 403 page behavior: keep app header, explain unavailable state, provide safe route back.
- Breadcrumb/tab/route-state policy: routes own major tasks; tabs own in-page datasets and use ARIA tab semantics.
- Sidebar/drawer/bottom-sheet transformation: desktop list becomes a compact native bond selector below 820px; selected detail remains primary.
- Responsive table strategy: evidence table keeps source/title/date columns on desktop and becomes labelled stacked rows on mobile.
- Truncation/full-value access: names may ellipsize only when adjacent title/accessible name exposes the full value; financial numbers do not truncate.
- Focus restoration and sticky-obstruction policy: focus is never hidden under header or mobile nav; sheet/dialog closes to its trigger.

## Overlays and feedback

- Dialog primitive: shared `Dialog` in `frontend/src/Dialogs.tsx`, focus trap, Escape, backdrop, opener restoration.
- Destructive confirmation levels: explicit confirmation dialog for persisted deletion; no destructive primary styling elsewhere.
- Toast placement/duration/deduplication: bottom end, 5 seconds, one route message at a time, `role=status`.
- Alert/banner scope and persistence: data/loading/error banners live inside the owning route and persist until resolved.
- Tooltip delay/dismissal: native `title` is insufficient for critical meaning; icon name remains available to assistive tech.
- Unsaved-changes behavior: no navigation block for non-persisted demo forms; persisted edit flow must add explicit guard.
- Layer/z-index contract: dialog 600 > backdrop 500 > sticky 100; toast 900 and never intercepts unrelated content.

## Async and resilience

- Mutation default: pessimistic.
- Idempotency and duplicate-submit policy: submit is disabled while pending; backend unique/idempotency contract remains authoritative.
- Auto-save/draft recovery: none in MVP.
- Offline/read-stale/write behavior: show the last completed content only when labelled with checked time; block writes offline.
- Retry/backoff/timeout behavior: explicit retry for read failure; no invisible infinite retry.
- Version conflict and multi-tab behavior: fresh API response wins; no collaborative editing.
- Session expiry/re-authentication: return to login with intended route preserved when authentication is implemented.
- Long-running progress and return path: status remains in route and is reachable through admin replay.
- Stale-request cancellation/invalidation and pending-state ownership: route owns request lifecycle and ignores superseded responses.
- Dialog/form preservation and retry after mutation failure: preserve user input and keep focus in dialog.

## Validation

- Schema/validation layer: React route validation matching REST constraints; backend remains authoritative.
- Trigger timing: required/format checks on submit, then on change after first error.
- Error summary/inline policy: inline per field; first invalid field receives focus.
- Server error mapping: known field errors inline, unknown errors in route/dialog alert.
- Sensitive-value handling: secrets are never entered in product UI or echoed in feedback.
- All forms use `noValidate`, prevent duplicate submit, preserve values on failure, and restore the submit action after recovery.

## Permission and clipboard

- Permission UI strategy: unavailable admin operations are hidden from consumer navigation; direct unauthorized routes use a 403 state.
- Clipboard copy policy: only explicit source identifiers may be copied; toast never includes secret or full sensitive value.
- Disabled-state explanation: adjacent helper text or accessible description explains the reason.

## Migration status

- Migration ledger location: `docs/FRONTEND_REFINEMENT_PLAN.md`
- Canonical primitives and owners: `frontend/src`, `frontend/src/styles.css`, shared `Navigation.tsx` and `Dialogs.tsx`.
- Current risk-prioritized slices: `/monitoring`, then mobile, then landing and preserved routes.
- Legacy import/token enforcement: runtime routes must not import `frontend/mock`; broad class-string overrides are prohibited.
- Rollout/rollback and removal gates: each route moves only after build, strict audit, interaction and fixed-viewport capture pass.

## Verification

- Required static commands: `npm run check:ui`, `npm run build`, `npm run test:ui`, Design.md lint, strict premium audit.
- Browser/device/locale/theme matrix: Chromium at 1280×800, 768×1024, 390×844, 320×800; `ko-KR`; normal/reduced motion/forced colors smoke check.
- Accessibility checks: keyboard main task, visible focus, names/roles, target size, reflow, chart text alternative.
- Native-language/domain review and target-user evidence: product owner reviews Korean risk and non-recommendation copy; task evidence is recorded in `design-qa.md`.
- Component-state/visual regression coverage: default, selected, no-results, dialog, mobile detail, reduced-motion.
- Canonical sibling flow used for comparison: selected design reference in `docs/design/evidence-rail-reference.png`.
- Project audit command/result: recorded at completion in `design-qa.md`.
- CRUD full-flow evidence: create/delete demo or API fixture flow when the backend is available.
- Failure-path evidence: no-results and API read failure recovery are mandatory captures/tests.
