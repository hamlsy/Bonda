import { expect, test } from "@playwright/test";
import type { Bond, HistoricalReplayResponse, RiskEventDetail, SinceBoughtResponse } from "../src/types";

// Review-only API responses use the existing frontend contract. Production requests are unchanged.
const issuer = { id: 1, corpCode: "DEMO0001", name: "[데모] 한결산업", stockCode: null };
const bond: Bond = {
  id: 1, issuer, isin: "DEMO-ISIN-001", bondCode: "DEMO-BOND-001",
  name: "[데모] 한결산업 1회 회사채", issueDate: "2025-01-15", maturityDate: "2028-01-15",
  couponRate: 4.25, creditRating: "AA-", createdAt: "2025-01-15T09:00:00+09:00",
};
const source: RiskEventDetail = {
  id: 1, eventType: "BORROWING_INCREASE", eventDate: "2026-03-14", amount: 1200000000,
  currency: "KRW", disclosureTitle: "[데모] 2025 사업보고서", publishedAt: "2026-03-14T09:00:00+09:00",
  sourceReceiptNo: "DEMO-20260314", evidence: [{ id: 1, section: "차입금", evidenceText: "[데모] 연결 기준 총차입금이 전기보다 증가했습니다.", sourceUrl: null }],
};
const holding: SinceBoughtResponse = {
  holding: { id: 1, bondId: 1, bondName: bond.name, issuerId: 1, issuerName: issuer.name, purchaseDate: "2025-08-12", purchaseAmount: 10000000 },
  currentRiskState: { snapshotId: 1, snapshotDate: "2026-03-14", liquidity: "WATCH", cashFlow: "NORMAL", leverage: "WATCH", earnings: "NORMAL", credit: "NORMAL", ruleVersion: "RISK_POLICY_V1" },
  timeline: [
    { date: "2025-08-12", type: "PURCHASE", title: "채권 매수", summary: "[데모] 매수 기준점", severity: null, riskEventId: null, riskChangeId: null, evidenceAvailable: false },
    { date: "2026-03-14", type: "RISK_EVENT", title: "총차입금 증가", summary: "[데모] 검증된 원문에서 차입 증가가 확인되었습니다.", severity: "WATCH", riskEventId: 1, riskChangeId: null, evidenceAvailable: true },
  ],
  financialChanges: [{ metric: "TOTAL_DEBT", label: "총차입금", baselineValue: 9800000000, currentValue: 11000000000, changeRate: 0.122, direction: "INCREASE", summary: "[데모] 총차입금 증가" }],
  financialContext: { baseline: { id: 1, period: "2024", statementDate: "2024-12-31" }, current: { id: 2, period: "2025", statementDate: "2025-12-31" } },
  explanation: { status: "NOT_NEEDED", summary: null, relatedEventIds: [], relatedRiskChangeIds: [], reused: false, model: null, promptVersion: null },
  updatedAt: "2026-03-14T10:00:00+09:00",
};
const replay: HistoricalReplayResponse = {
  issuer, cutoffDate: "2026-03-14",
  disclosuresUsed: [{ disclosureId: 1, title: source.disclosureTitle, versionId: 1, versionNumber: 1, versionPublishedAt: source.publishedAt }],
  riskEvents: [{ id: 1, sourceVersionId: 1, eventType: source.eventType, eventDate: source.eventDate, effectiveDate: "2026-03-14", sourcePublishedAt: source.publishedAt, evidenceText: source.evidence[0].evidenceText }],
  financialSnapshot: { id: 2, period: "2025", statementDate: "2025-12-31", publishedOn: "2026-03-14" },
  riskSnapshot: { asOf: "2026-03-14", overall: "WATCH", liquidity: "WATCH", cashFlow: "NORMAL", leverage: "WATCH", earnings: "NORMAL", credit: "NORMAL", ruleVersion: "RISK_POLICY_V1" },
  riskChanges: [],
  timeline: [{ date: "2026-03-14", type: "RISK_EVENT", title: "총차입금 증가", summary: "[데모] 검증된 공시 변화", sourceId: 1, riskEventId: 1 }],
  metadata: { riskRuleVersion: "RISK_POLICY_V1", promptVersions: [], models: [], inputFingerprint: "demo-review-fixture", executedAt: "2026-03-14T10:00:00+09:00", executionTimeMs: 12 },
};

test("handoff 정상 상태 캡처", { tag: "@handoff-capture" }, async ({ page }, testInfo) => {
  test.skip(!process.env.BONDA_CAPTURE_CURRENT, "Before 캡처는 명시적으로 요청할 때만 갱신합니다.");
  test.skip(testInfo.project.name !== "mobile-390", "한 프로젝트에서만 고정 viewport 캡처 생성");
  await page.route("**/api/holdings/1/since-bought", (route) => route.fulfill({ json: holding }));
  await page.route("**/api/risk-events/1", (route) => route.fulfill({ json: source }));
  await page.route("**/api/bonds", (route) => route.fulfill({ json: [bond] }));
  await page.route("**/api/admin/replay", (route) => route.fulfill({ json: replay }));
  const viewports = [{ name: "mobile-390", width: 390, height: 844 }, { name: "desktop-1440", width: 1440, height: 900 }];
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const [name, path, heading] of [
      ["holding", "/holdings/1/since-bought", bond.name],
      ["source", "/risk-events/1", "공시 원문"],
      ["replay", "/admin/replay", "당시 공개된 사건"],
    ]) {
      await page.goto(path);
      if (name === "replay") {
        await page.getByLabel("발행기업").selectOption("1");
        await page.getByLabel("기준일").fill("2026-03-14");
        await page.getByRole("button", { name: "이 시점 재현하기" }).click();
      }
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await page.screenshot({ path: `../design/audit/current/${name}-${viewport.name}.png`, animations: "disabled", fullPage: true });
    }
    await page.goto("/monitoring");
    await expect(page.getByRole("heading", { name: "순차입금 증가 확인" })).toBeVisible();
    await page.screenshot({ path: `../design/audit/current/monitoring-${viewport.name}.png`, animations: "disabled", fullPage: true });
  }
});
