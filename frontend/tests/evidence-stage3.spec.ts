import { expect, test } from "@playwright/test";
import type { RiskEventDetail } from "../src/types";

const source: RiskEventDetail = {
  id: 1,
  eventType: "BORROWING_INCREASE",
  eventDate: "2026-03-14",
  amount: 1200000000,
  currency: "KRW",
  disclosureTitle: "[데모] 2025 사업보고서",
  publishedAt: "2026-03-14T09:00:00+09:00",
  sourceReceiptNo: "DEMO-20260314",
  evidence: [{ id: 1, section: "차입금", evidenceText: "[데모] 연결 기준 총차입금이 전기보다 증가했습니다.", sourceUrl: null }],
};

test("S3-1 verified quotation leads at 390px and 1440px @stage3-evidence-capture", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Capture both requested viewports once");
  await page.route("**/api/risk-events/1", (route) => route.fulfill({ json: source }));

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/risk-events/1");
    const quotation = page.locator(".evidence-page-list blockquote");
    await expect(quotation).toHaveText(source.evidence[0].evidenceText);
    await expect(page.locator(".evidence-citation")).toContainText(source.disclosureTitle);
    await expect(page.locator(".evidence-citation")).toContainText("접수번호 DEMO-20260314");
    await expect(page.getByText("SOURCE CHECK")).toHaveCount(0);
    const quoteBox = await quotation.boundingBox();
    const citationBox = await page.locator(".evidence-citation").boundingBox();
    expect(quoteBox).not.toBeNull();
    expect(citationBox).not.toBeNull();
    expect(quoteBox!.y + quoteBox!.height).toBeLessThan(citationBox!.y);
    if (viewport.width === 390) expect(quoteBox!.y + quoteBox!.height).toBeLessThan(844);
    const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client);

    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-3/evidence-${viewport.name}-${viewport.width}x${viewport.height}.png`, animations: "disabled" });
    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-3/evidence-${viewport.name}-full.png`, animations: "disabled", fullPage: true });
  }
});

test("S3-1 source link and empty evidence state remain usable", async ({ page }) => {
  await page.route("**/api/risk-events/1", (route) => route.fulfill({ json: { ...source, evidence: [{ ...source.evidence[0], sourceUrl: "https://dart.fss.or.kr/example" }] } }));
  await page.goto("/risk-events/1");
  await expect(page.getByRole("link", { name: /원문에서 확인하기/ })).toHaveAttribute("href", "https://dart.fss.or.kr/example");
  await expect(page.getByRole("link", { name: /원문에서 확인하기/ })).toHaveAttribute("target", "_blank");

  await page.unroute("**/api/risk-events/1");
  await page.route("**/api/risk-events/1", (route) => route.fulfill({ json: { ...source, evidence: [] } }));
  await page.reload();
  await expect(page.getByText("연결된 원문 구간이 없습니다.")).toBeVisible();
  await expect(page.locator(".quiet-empty")).toContainText(source.disclosureTitle);
});
