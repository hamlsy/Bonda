# Bonda milestones

This plan consolidates the existing MVP scope and progress. The v1 task queue contained no product tasks. DONE states below are based on the current product/implementation specifications, README and UX contract, implemented modules/routes, and existing test coverage; they do not represent a new feature task.

## M1. Core portfolio

Status: DONE

Purpose: Manage issuers, bonds, holdings and watchlists for one investor.

Acceptance criteria:
- Bond and portfolio APIs validate inputs and preserve domain constraints.
- Multiple purchases are represented as holdings; duplicate watchlist entries are prevented.
- Existing backend/API tests cover core CRUD and constraints.

Dependencies: none

## M2. DART disclosure evidence

Status: DONE

Purpose: Collect and preserve issuer filings as traceable disclosure versions.

Acceptance criteria:
- Collection is bounded, manually invokable and excludes demo corp codes.
- Changed source content creates a version without losing prior evidence.
- Normalization preserves meaningful sections/tables and deterministic pre-filter decisions.
- Ingestion and normalization behavior has backend tests.

Dependencies: M1

## M3. Verified risk events and deterministic risk state

Status: DONE

Purpose: Convert analyzed filings to validated canonical events and reproducible issuer risk snapshots/changes.

Acceptance criteria:
- LLM extraction creates candidates only; deterministic evidence, issuer, amount and event rules govern promotion.
- Duplicate promotion/recalculation is idempotent and transactional.
- Risk policy, financial precision, dates and source trace are deterministic and tested.

Dependencies: M2

## M4. Since I Bought and source inspection

Status: DONE

Purpose: Show post-purchase event, risk and meaningful financial changes with their source evidence.

Acceptance criteria:
- Timeline begins at purchase date and does not invent dates for undated events.
- Explanation uses verified data only and does not set risk state or make recommendations.
- Existing route and service tests cover the timeline and event evidence.

Dependencies: M3

## M5. Monitoring and alerts

Status: DONE

Purpose: Surface deterministic risk changes and actionable portfolio summaries.

Acceptance criteria:
- Alerts derive only from verified events or deterministic risk changes.
- Policy severity and target association are deterministic and duplicate-safe.
- Read state is idempotent and My Bonds prioritizes unread/current changes.

Dependencies: M1, M3

## M6. Historical replay and evaluation

Status: DONE

Purpose: Reproduce historical issuer risk from information available at a cutoff and compare event extraction against reviewed data.

Acceptance criteria:
- Replay selects only disclosures, versions, events and financial data available by cutoff and does not write current state.
- Golden labels remain separate from synthetic fixtures; evaluation reports quality and cost metrics.
- Existing replay/evaluation tests and reports remain available.

Dependencies: M2, M3

## M7. Pulse Command product experience

Status: DONE

Purpose: Provide consistent landing, monitoring, holding timeline, event source, replay and fallback routes.

Acceptance criteria:
- Runtime routes use the shared navigation, visual tokens and feedback/accessibility conventions.
- Fixed viewport Playwright flows cover desktop, tablet and narrow mobile.
- Design QA evidence remains recorded in `design-qa.md` and the referenced design captures.

Dependencies: M4, M5, M6

## Next milestone

No unstarted milestone existed in the v1 task list. Do not invent product scope. Add a user-approved, independently verifiable milestone here before starting additional product work.
