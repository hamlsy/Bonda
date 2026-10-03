import { expect, test } from "@playwright/test";
import type { RiskEventDetail, SinceBoughtResponse } from "../src/types";

const holding: SinceBoughtResponse = {
  holding: { id: 1, bondId: 1, bondName: "[데모] 한결산업 1회 회사채", issuerId: 1, issuerName: "[데모] 한결산업", purchaseDate: "2025-08-12", purchaseAmount: 10000000 },
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

const source: RiskEventDetail = {
  id: 1, eventType: "BORROWING_INCREASE", eventDate: "2026-03-14", amount: 1200000000,
  currency: "KRW", disclosureTitle: "[데모] 2025 사업보고서", publishedAt: "2026-03-14T09:00:00+09:00",
  sourceReceiptNo: "DEMO-20260314", evidence: [{ id: 1, section: "차입금", evidenceText: "[데모] 연결 기준 총차입금이 전기보다 증가했습니다.", sourceUrl: null }],
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/holdings/1/since-bought", (route) => route.fulfill({ json: holding }));
  await page.route("**/api/risk-events/1", (route) => route.fulfill({ json: source }));
});

test("Stage 2 default holding captures and evidence behavior @stage2-capture", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Capture both review viewports once");
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/holdings/1/since-bought");
    await expect(page.getByRole("heading", { name: holding.holding.bondName })).toBeVisible();
    const latest = page.locator(".since-latest");
    await expect(latest.getByRole("heading", { name: "총차입금 증가" })).toBeVisible();
    await expect(latest).toContainText("2026년 3월 14일");
    await expect(latest).toContainText("Bonda 현재 상태 · 관찰");
    await expect(latest.getByRole("button", { name: "원문에서 확인" })).toBeVisible();
    await expect(page.getByText("HOLDING PULSE")).toHaveCount(0);
    await expect(page.locator(".pulse-summary-board")).toHaveCount(0);
    await expect(page.locator(".explanation-section")).toHaveCount(0);
    await expect(page.locator(".financial-list")).toContainText("2024년 ₩9,800,000,000 → 2025년 ₩11,000,000,000");
    await expect(page.locator(".financial-list strong")).toHaveText("+12.2%");
    await expect(page.locator(".financial-list strong")).toHaveCSS("color", "rgb(11, 23, 54)");
    const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client);
    if (viewport.width === 390) {
      const button = await latest.getByRole("button", { name: "원문에서 확인" }).boundingBox();
      expect(button).not.toBeNull();
      expect(button!.y + button!.height).toBeLessThan(844);
    }
    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-2/holding-${viewport.name}-${viewport.width}x${viewport.height}.png`, animations: "disabled" });
    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-2/holding-${viewport.name}-full.png`, animations: "disabled", fullPage: true });
    await latest.getByRole("button", { name: "원문에서 확인" }).click();
    await expect(latest).toContainText("[데모] 연결 기준 총차입금이 전기보다 증가했습니다.");
    await page.locator(".since-risk-details summary").click();
    await expect(page.locator(".risk-state-grid")).toContainText("부채 부담");
  }
});

test("Stage 2 no-change response keeps a dated neutral summary", async ({ page }) => {
  await page.unroute("**/api/holdings/1/since-bought");
  await page.route("**/api/holdings/1/since-bought", (route) => route.fulfill({ json: { ...holding, timeline: [holding.timeline[0]], financialChanges: [] } }));
  await page.goto("/holdings/1/since-bought");
  await expect(page.locator(".since-latest")).toContainText("새 변화 없음");
  await expect(page.locator(".since-latest")).toContainText("마지막 확인");
  await expect(page.locator(".since-latest").getByRole("button", { name: "원문에서 확인" })).toHaveCount(0);
  await expect(page.getByText("비교 가능한 재무 변화가 아직 없습니다.")).toBeVisible();
});

test("Stage 2 featured source recovers from an API error", async ({ page }) => {
  await page.unroute("**/api/risk-events/1");
  let requests = 0;
  await page.route("**/api/risk-events/1", (route) => {
    requests += 1;
    return requests === 1 ? route.fulfill({ status: 500, body: "error" }) : route.fulfill({ json: source });
  });
  await page.goto("/holdings/1/since-bought");
  const latest = page.locator(".since-latest");
  await latest.getByRole("button", { name: "원문에서 확인" }).click();
  await expect(latest.getByRole("alert")).toContainText("공시 원문을 불러오지 못했습니다.");
  await latest.getByRole("button", { name: "다시 시도" }).click();
  await expect(latest).toContainText("[데모] 연결 기준 총차입금이 전기보다 증가했습니다.");
});
