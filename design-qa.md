# Design QA

- Source design: `frontend/mock/bonda_mock_main` and
  `frontend/mock/bonda_mock_onboarding`
- Implementation: `http://127.0.0.1:5173/monitoring` and `/`
- Review date: 2026-09-13

## Visual comparison

| Viewport | Result | Evidence |
| --- | --- | --- |
| Desktop 1200×900 | passed | In-app browser before/after captures; two-pane hierarchy, selected state, header metrics, tabs and first evidence row remained visible. |
| Mobile iframe 390×844 | passed | Rendered viewport measured `clientWidth=380`, `scrollWidth=380`; header, search, three evidence controls, filters, list and selected detail remained reachable. |
| Mobile dialog | passed | Measured 364×828 with internal scroll (`scrollHeight=990`), Escape close, and trigger focus restoration. |

## Interaction and accessibility checks

- Search reduced six sample bonds to one and clear restored all six.
- Risk filter reduced the list to two and reset restored all six.
- Empty results exposed a named reset action.
- ArrowRight moved the selected tab from overview to raw facts.
- Dialogs expose a name, stay modal, close on Escape, and return focus.
- Required form failure stays in the dialog, announces an inline alert, and focuses
  the first invalid input.
- Browser console contained no runtime error during the checked flows.

## Anti-slop and trust checks

- Removed decorative gradients and status emoji from the monitoring product surface.
- Removed broad card shadows and reduced large radii without removing information.
- Replaced unsupported real-time, 24-hour, 100%, zero-error, and hard-coded model
  claims with explicit demo or planned-state copy.
- Automated `npm run check:ui` passed.
- TypeScript `npx tsc --noEmit` passed.

final result: passed
