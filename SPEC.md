# Bonda product specification

This is the durable product summary. `docs/PRODUCT.md` defines product scope; `docs/IMPLEMENTATION_SPEC.md` is the detailed technical and domain source of truth. Read those documents before changing product behavior.

## Purpose and user

Bonda helps an individual corporate-bond investor monitor issuer credit risk after purchase and inspect what changed and the evidence behind it. MVP is a single, unsegmented investor portfolio.

## Core user flows

- Register bonds, holdings and watchlist interests.
- Collect issuer DART disclosures, preserve changed filings as versions, and inspect normalized source evidence.
- Extract candidate risk events, validate them deterministically, and surface confirmed changes in issuer risk, Since I Bought timelines and alerts.
- Replay issuer risk at a historical information cutoff without changing current state.

## Scope and boundaries

The MVP includes portfolio, DART ingestion, event extraction and validation, deterministic risk snapshots/changes, monitoring and alerts, historical replay, and evaluation tooling. Push/email/SMS, an operations evaluation dashboard, and AI investment recommendations are out of scope.

## Financial and provenance rules

- Financial facts retain source disclosure/version and evidence provenance; unverified LLM output is never canonical fact.
- Monetary comparisons preserve source units and exact precision. Risk validation normalizes declared units deterministically; no floating point is used for money.
- Dates use the source's disclosed/effective date and Asia/Seoul cutoff semantics for replay. Missing event dates are not fabricated.
- Risk state and alert severity are deterministic policy outcomes, never model decisions.
- Event promotion, snapshots, changes and alerts must be idempotent under their defined fingerprints/unique keys and preserve existing transaction boundaries.
- Historical replay is read-only and must not modify current snapshots, changes or alerts.

## Durable product source

Use `docs/PRODUCT.md`, `docs/IMPLEMENTATION_SPEC.md`, existing tests, and `PLAN.md` acceptance criteria together. `PLAN.md` summarizes milestone status; `STATUS.md` is the only live work/resume record.
