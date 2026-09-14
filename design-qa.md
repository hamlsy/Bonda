# Bonda Monitoring Design QA

final result: passed

## Comparison contract

- Source target: `docs/design/monitoring-pulse-command-target.png` (1487×1058)
- Implementation capture: `docs/design/monitoring-desktop.png` (1280×800)
- Same-input comparison: `docs/design/monitoring-design-qa-comparison.png` (2560×800)
- Comparison transform: the source's top 1487×929 area was scaled to 1280×800 and placed on the left; the implementation's 1280×800 desktop viewport was placed on the right.
- Browser state: `/monitoring`, light color scheme, Korean locale, reduced motion, default selected bond `롯데케미칼 59-1`, `요약` tab.
- Responsive evidence: `docs/design/monitoring-tablet.png` (768×1024), `docs/design/monitoring-mobile-390.png` (390×844), `docs/design/monitoring-mobile-320.png` (320×800).

## Iteration history

### Pass 1

- P0: none.
- P1: the implementation used a white global header, breaking the continuous navy monitoring command band in the selected target.
- P1: route and interaction tests still expected the retired Evidence Rail labels and desktop-only search behavior.
- P2: implementation used two analytical panels instead of the target's three-column analytical region.

Actions: connected the global header to the navy command band, added target-aligned active navigation styling, updated the test contract to `Credit Pulse`, `변화 기록`, and `공시 원문`, and routed tablet search through the compact tools.

### Pass 2

- P0: none.
- P1: none. Header continuity, monitoring hierarchy, selected holding rail, event timeline, alert detail, risk visualization, financial bars, and activity table now match the selected direction.
- P2: the target's historical heatmap was not copied because the product has no verified historical category series. The implementation shows a deterministic current-state matrix instead.
- P2: target and implementation counts differ because the implementation renders the repository's demo fixtures rather than numbers painted into the concept image.
- P3: minor type-scale and spacing differences remain across Korean system-font environments.

Disposition: passed. No P0 or P1 issue remains; P2 differences preserve the product data contract and avoid fabricated financial history.

## Verification

- `npm run build` — passed.
- `npm run check:ui` — passed.
- `npm run test:ui` — 24 passed across desktop, tablet, 390px mobile, and 320px mobile.
- Horizontal overflow — passed at every tested viewport.
- Browser visual inspection — passed in the in-app browser on `/monitoring`.
