import { expect, test } from "@playwright/test";
import type { Bond, HistoricalReplayResponse } from "../src/types";

const issuer = { id: 1, corpCode: "DEMO0001", name: "[데모] 한결산업", stockCode: null };
const bond: Bond = {
  id: 1, issuer, isin: "DEMO-ISIN-001", bondCode: "DEMO-BOND-001",
  name: "[데모] 한결산업 1회 회사채", issueDate: "2025-01-15", maturityDate: "2028-01-15",
  couponRate: 4.25, creditRating: "AA-", createdAt: "2025-01-15T09:00:00+09:00",
};
const replay: HistoricalReplayResponse = {
  issuer, cutoffDate: "2026-03-14",
  disclosuresUsed: [{ disclosureId: 1, title: "[데모] 2025 사업보고서", versionId: 1, versionNumber: 1, versionPublishedAt: "2026-03-14T09:00:00+09:00" }],
  riskEvents: [{ id: 1, sourceVersionId: 1, eventType: "BORROWING_INCREASE", eventDate: "2026-03-14", effectiveDate: "2026-03-14", sourcePublishedAt: "2026-03-14T09:00:00+09:00", evidenceText: "[데모] 연결 기준 총차입금이 전기보다 증가했습니다." }],
  financialSnapshot: { id: 2, period: "2025", statementDate: "2025-12-31", publishedOn: "2026-03-14" },
  riskSnapshot: { asOf: "2026-03-14", overall: "WATCH", liquidity: "WATCH", cashFlow: "NORMAL", leverage: "WATCH", earnings: "NORMAL", credit: "NORMAL", ruleVersion: "RISK_POLICY_V1" },
  riskChanges: [],
  timeline: [{ date: "2026-03-14", type: "RISK_EVENT", title: "총차입금 증가", summary: "[데모] 검증된 공시 변화", sourceId: 1, riskEventId: 1 }],
  metadata: { riskRuleVersion: "RISK_POLICY_V1", promptVersions: [], models: [], inputFingerprint: "demo-review-fixture", executedAt: "2026-03-14T10:00:00+09:00", executionTimeMs: 12 },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/bonds", (route) => route.fulfill({ json: [bond] }));
});

test("S3-2 date, state, and first event lead at 390px and 1440px @stage3-replay-capture", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Capture both fixed viewports in one project.");
  await page.route("**/api/admin/replay", (route) => route.fulfill({ json: replay }));
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/admin/replay");
    await expect(page.getByRole("heading", { name: "선택한 날짜까지 공개된 정보" })).toBeVisible();
    await page.getByLabel("발행기업").selectOption("1");
    await page.getByLabel("기준일").fill("2026-03-14");
    await page.getByRole("button", { name: "이 시점 재현하기" }).click();
    const status = page.getByRole("heading", { name: "2026-03-14 당시 상태: 관찰" });
    const firstEvent = page.locator(".replay-timeline li").first();
    await expect(status).toBeVisible();
    await expect(firstEvent).toContainText("총차입금 증가 (빌린 돈)");
    expect((await page.locator("main").innerText()).match(/빌린 돈/g)).toHaveLength(1);
    await expect(page.getByText("HISTORICAL REPLAY")).toHaveCount(0);
    const statusBox = await status.boundingBox();
    const eventBox = await firstEvent.boundingBox();
    expect(statusBox).not.toBeNull();
    expect(eventBox).not.toBeNull();
    expect(statusBox!.y).toBeLessThan(eventBox!.y);
    expect(eventBox!.y + eventBox!.height).toBeLessThanOrEqual(viewport.height);
    const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-3/replay-${viewport.name}-${viewport.width}x${viewport.height}.png`, animations: "disabled" });
    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-3/replay-${viewport.name}-full.png`, animations: "disabled", fullPage: true });
  }
});

test("S3-2 validation, replay request, and empty result stay functional", async ({ page }) => {
  let requested = false;
  await page.route("**/api/admin/replay", async (route) => {
    requested = true;
    expect(route.request().postDataJSON()).toMatchObject({ issuerId: 1, cutoffDate: "2026-03-14" });
    await route.fulfill({ json: { ...replay, timeline: [] } });
  });
  await page.goto("/admin/replay");
  await page.getByRole("button", { name: "이 시점 재현하기" }).click();
  await expect(page.getByRole("alert")).toContainText("발행기업을 선택");
  await page.getByLabel("발행기업").selectOption("1");
  await page.getByRole("button", { name: "이 시점 재현하기" }).click();
  await expect(page.getByRole("alert")).toContainText("기준일을 입력");
  await page.getByLabel("기준일").fill("2026-03-14");
  await page.getByRole("button", { name: "이 시점 재현하기" }).click();
  await expect(page.getByRole("heading", { name: "2026-03-14 당시 상태: 관찰" })).toBeVisible();
  await expect(page.getByText("기준일까지 사용할 수 있었던 공시·재무 변화가 없습니다.")).toBeVisible();
  expect(requested).toBe(true);
});
