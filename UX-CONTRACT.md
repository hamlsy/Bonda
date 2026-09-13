# Bonda UX Contract

이 문서는 [DESIGN.md](./DESIGN.md)의 시각 언어와 분리된 공통 행동 계약이다. 제품 사실과 API 범위는 `docs/PRODUCT.md`, `docs/IMPLEMENTATION_SPEC.md`를 따른다.

## Surface map

| Surface | Route | Register | Purpose |
|---|---|---|---|
| 소개와 체험 | `/` | Brand | Bonda의 근거 중심 방식을 이해하고 제품으로 진입 |
| 내 채권 | `/monitoring` | Product | 보유·관심 채권, 변화, 알림 확인과 등록 |
| 매수 이후 | `/holdings/:id/since-bought` | Product | 매수일 이후 검증된 변화 추적 |
| 원문 근거 | `/risk-events/:id` | Product | 검증에 사용한 공시 구간 확인 |
| 과거 재현 | `/admin/replay` | Product/Admin | cutoff 당시 공개 정보로 상태 재계산 |

## Capability ownership

| Capability | Canonical owner | Variant |
|---|---|---|
| Navigation | `Navigation.tsx` | landing / product / mobile |
| Dialog | `Dialogs.tsx` | informational / form |
| Toast | `Dialogs.tsx` | polite status; errors remain inline |
| Select/Listbox | native `select` | OS popup geometry accepted |
| Date | native `input[type=date]` | OS locale and geometry accepted |
| Form validation | screen form handler | create / demo; `noValidate` required |
| Scrollbar | global `styles.css` | visible global baseline |
| API request | `api.ts` + screen lifecycle | abort stale reads; prevent duplicate mutation |

## Truthful capability states

- `live`: API response drives the UI and success feedback.
- `demo`: interaction completes only in memory and is labelled `예시` or `데모`.
- `planned`: UI explains the future capability and performs no external side effect.
- `static`: informational content requires no backend.

Authentication, billing, Kakao/email delivery, custom AI questions, manual document analysis and pricing selection remain demo/planned until an authoritative backend contract exists. These flows must never display a persisted, charged, authenticated or delivered success state.

## Navigation and recovery

- Landing CTA enters `/monitoring`; product back links return to `/monitoring`.
- Route titles are localized and unique.
- An unknown route renders an app-owned 404 with links to `/` and `/monitoring`.
- Successful holding/watchlist create remains on `/monitoring`, refreshes the owner list, and announces the exact object.
- Failed requests preserve entered values and show a recoverable inline message.
- A stale portfolio keeps the last successful session snapshot visible and offers explicit retry.

## Search and filtering

- Bond search is local while the bond list API has no query contract.
- Search is Korean IME-safe because filtering does not submit on Enter or issue remote requests.
- A non-empty query always has a labelled clear button that restores focus.
- Query and filter are stored in `/monitoring` URL search parameters.
- No-results differs from an empty portfolio and provides a clear reset action.

## Dialog and feedback

- Opening a dialog moves focus inside; Tab stays inside; Escape closes; closing restores trigger focus.
- The document behind a modal cannot scroll.
- Long dialog bodies scroll internally while heading and actions remain reachable.
- One toast live region is used across the app. Informational demo notices auto-dismiss; actionable errors remain inline.

## Responsive behavior

- Desktop monitoring uses a bond list and detail pane.
- Narrow screens place search/filter and the selected bond summary in document order; no hidden actions or hover-only detail.
- The page owns document scrolling. Only a long dialog body and the desktop bond list may scroll internally.
- Mobile actions have at least 44px height and remain reachable above safe-area insets.

## Accessibility and locale

- Target: WCAG 2.2 AA.
- Locale: `ko-KR`; domain time zone: `Asia/Seoul`.
- Native controls, visible focus, semantic headings, labelled icon buttons and status live regions are required.
- Motion is optional and removed with `prefers-reduced-motion`.

## Deferred backend roadmap

1. Authentication/session and user-owned portfolios.
2. Notification preference storage, verified contact channels and delivery history.
3. Subscription, billing, cancellation and refund lifecycle.
4. Server bond search/filter/pagination plus market-price and yield data.
5. Disclosure list/raw-document access beyond verified evidence.
6. Custom ingestion, analysis-run state and safe AI follow-up questions.

Until each contract exists, its frontend remains explicitly demo/planned and does not imitate an external success.
