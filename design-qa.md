# Design QA — Evidence Rail

- Review date: 2026-09-14
- Selected direction: user-selected option 1, `Evidence Rail`
- Source design: `docs/design/evidence-rail-reference.png`
- Implementation: `http://127.0.0.1:4173/monitoring`
- Side-by-side evidence: `docs/design/evidence-rail-comparison.png`
- Fixed captures: `monitoring-desktop.png`, `monitoring-tablet.png`, `monitoring-mobile-390.png`, `monitoring-mobile-320.png`

## Outcome

The canonical monitoring route now follows the selected evidence-first direction: a compact bond list, selected-bond identity strip, discrete event chronology, current risk matrix, baseline/current financial comparison, evidence table, and a secondary AI disclosure. The runtime no longer imports either legacy mock application or its Tailwind override layer.

This is a passed implementation of the approved frontend slice, not a production-data completion claim. The primary remaining limitation is data integration: `/monitoring` still uses explicitly labelled demo fixtures while the preserved detail/replay routes use the backend API.

## Cold visual comparison

| Axis | Score | Verdict |
|---|---:|---|
| Information hierarchy | 9/10 | Change chronology and evidence are clearly primary; AI is correctly demoted. |
| Selected-reference fidelity | 8/10 | Grid, rule, color roles, event rail, matrix, comparison chart, table and mobile composition match the reference closely. |
| Professional credibility | 8/10 | The purple AI-SaaS register, gradients, broad shadows and nested cards are gone. Some demo copy still prevents a fully institutional finish. |
| Data readability | 8/10 | Aligned columns and tabular numerals scan well. The horizontal bars are intentionally simple and traceable, but not a substitute for production financial-series data. |
| Mobile task flow | 7/10 | Selection goes directly to detail and utility actions use 44px icons. At 390×844 the event rail fills most of the first viewport, so the matrix requires one vertical scroll. This is a deliberate readability tradeoff, but it is less dense than the reference. |
| Distinctiveness | 8/10 | The event-to-evidence rail is product-specific and survives without decorative effects. |
| Production completeness | 6/10 | Demo fixtures are labelled, but live monitoring summaries, real DART deep links and user-measured desirability are still outstanding. |

Overall visual/product score: **7.8/10**. This is materially better and credible enough to proceed, but it is not honest to call it finished production UX until real portfolio data and target-user task evidence replace the demo assumptions.

## Functional and accessibility evidence

- Search filters the portfolio and exposes a mobile search disclosure with focusable input.
- Desktop bond rows and the mobile native selector both update the selected detail immediately.
- Event selection updates the connected evidence explanation; the evidence action moves to the matching evidence dataset.
- Tabs support click plus Left/Right/Home/End keyboard navigation.
- Dialogs expose an accessible name, trap focus, close on Escape, and return focus to the trigger.
- Mobile utility actions use labelled 44px icon controls; navigation retains icons and visible text.
- All tested viewports keep `document.scrollWidth <= document.clientWidth`.
- Charts include exact textual values and the risk matrix is exposed as a table.
- Reduced-motion test configuration removes content animation without removing information.
- Monitoring browser inspection reported no runtime console error. Replay tests intentionally exercised the visible backend-unavailable state because the local backend was not running.

## Verification results

| Gate | Result |
|---|---|
| `npm run check:ui` | passed |
| `npm run build` | passed; 1,883 modules transformed |
| `npm run test:ui` | passed; 24/24 across 1280×800, 768×1024, 390×844 and 320×800 |
| `npx -p @google/design.md designmd lint DESIGN.md` | 0 errors; token-reference warnings recorded |
| Frontend Design Premium strict audit | passed; 0 errors, 0 warnings |
| Screenshot comparison | passed for hierarchy, density, palette, chart/table composition and mobile detail-first flow |

## Regressions blocked by repository checks

- Monitoring route importing `frontend/mock/bonda_mock_main`
- Decorative gradient, persistent pulse and catch-all transition in the canonical monitoring slice
- Unsupported real-time/100%/zero-error claims
- Investment recommendation, default-risk guarantee and confirmed-return copy
- Clickable non-button containers and forms without app-owned validation
- Missing native Date/Select ownership and missing UI contracts

## Remaining launch gaps

1. Replace `monitoringRecords` with `GET /api/holdings/summary` plus since-bought/evidence adapters while preserving loading, empty, stale and error states.
2. Connect an evidence row to the actual `riskEventId` detail and DART source URI; the current demo action only opens the evidence dataset.
3. Validate the desirability gate with target users. No user study was performed, so “있어 보인다” is supported by the selected reference and implementation review, not by measured preference.
4. Re-test replay success data with the backend running; current browser coverage proves route rendering and failure resilience only.
5. Decide whether the mobile matrix must appear in the first 844px viewport. Doing so would require denser type or collapsing the selected-event explanation, both of which reduce readability.

final result: passed
