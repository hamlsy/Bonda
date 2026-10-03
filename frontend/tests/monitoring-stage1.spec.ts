import { expect, test } from "@playwright/test";

test("Stage 1 monitoring review captures and numeric semantics @stage1-capture", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Capture both requested viewports once");

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/monitoring");

    const latest = page.locator(".pulse-latest-change");
    await expect(page.getByRole("heading", { name: "롯데케미칼 59-1" })).toBeVisible();
    await expect(latest.getByRole("heading", { name: "순차입금 증가 확인" })).toBeVisible();
    await expect(latest).toContainText("2026. 05. 16.");
    await expect(latest).toContainText("관련 범주 · 유동성");
    await expect(latest.getByRole("button", { name: "공시 원문 보기" })).toBeVisible();
    await expect(page.locator(".pulse-identity")).toContainText("신용등급 AA · 전망 안정적");
    await expect(page.locator(".pulse-identity")).toContainText("Bonda 확인 상태");

    const cash = page.locator(".pulse-financial-row").filter({ hasText: "현금성자산" });
    const flow = page.locator(".pulse-financial-row").filter({ hasText: "영업현금흐름" });
    await expect(cash).toContainText("3.1 조원 → 2.7 조원");
    await expect(flow).toContainText("0.82 조원 → 0.64 조원");
    await expect(cash.locator("em")).toHaveCSS("color", "rgb(11, 23, 54)");
    await expect(flow.locator("em")).toHaveCSS("color", "rgb(11, 23, 54)");
    await expect(page.getByRole("heading", { name: "재무 변화" })).toBeVisible();
    await expect(page.locator(".pulse-financial-panel")).toContainText("데모 비교값");
    const viewportWidth = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(viewportWidth.scroll).toBeLessThanOrEqual(viewportWidth.client);
    const timelineDateSize = await page.locator(".pulse-timeline time").first().evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    expect(timelineDateSize).toBeGreaterThanOrEqual(12);

    if (viewport.width === 390) {
      const source = await latest.getByRole("button", { name: "공시 원문 보기" }).boundingBox();
      expect(source).not.toBeNull();
      expect(source!.y + source!.height).toBeLessThan(790);
    } else {
      const list = page.locator(".pulse-bond-list");
      await expect(list).toContainText("새로 확인할 변화 5건");
      await expect(list.locator(".pulse-bond-row").first()).toContainText("순차입금 증가 확인");
      await expect(list.locator(".pulse-quiet-group summary")).toContainText("새 변화 없음 1개");
    }

    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-1/monitoring-${viewport.name}-${viewport.width}x${viewport.height}.png`, animations: "disabled" });
    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-1/monitoring-${viewport.name}-full.png`, animations: "disabled", fullPage: true });

    if (viewport.width === 1440) {
      await page.locator(".pulse-quiet-group summary").click();
      await expect(page.locator(".pulse-bond-row-quiet")).toContainText("대한항공 101");
      await page.getByRole("button", { name: /CJ CGV 35/ }).click();
    } else {
      await page.getByLabel("확인할 채권").selectOption("cgv");
    }
    const negative = page.locator(".pulse-financial-row").filter({ hasText: "영업현금흐름" }).locator(".pulse-metric-comparison");
    const positions = await negative.evaluate((element) => ({
      zero: Number.parseFloat((element.querySelector(".pulse-comparison-zero") as HTMLElement).style.left),
      current: Number.parseFloat((element.querySelector(".pulse-comparison-point.after") as HTMLElement).style.left),
    }));
    expect(positions.current).toBeLessThan(positions.zero);
    await expect(page.locator(".pulse-financial-row").filter({ hasText: "영업현금흐름" })).toContainText("-0.06 조원");
  }
});

test("S1-R1 quiet bond has neutral no-change semantics at both review viewports @stage1-r1-capture", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Capture both requested viewports once");

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/monitoring");

    const latest = page.locator(".pulse-latest-change");
    await expect(latest.locator(".pulse-change-dots")).toHaveCount(1);
    await expect(latest.locator(".pulse-change-kicker")).toHaveText("새 변화 2건");
    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-1/monitoring-r1-${viewport.name}-default-${viewport.width}x${viewport.height}.png`, animations: "disabled" });

    if (viewport.width === 1440) {
      await page.locator(".pulse-quiet-group summary").click();
      const quiet = page.locator(".pulse-bond-row-quiet");
      await expect(quiet.locator(".pulse-row-change")).toHaveText("새로 확인할 변화 없음");
      await expect(quiet.locator(".pulse-change-dots")).toHaveCount(0);
      await quiet.click();
    } else {
      await page.getByLabel("확인할 채권").selectOption("korean-air");
      await expect(page.getByLabel("확인할 채권").locator("option:checked")).toContainText("새로 확인할 변화 없음");
    }

    await expect(page.getByRole("heading", { name: "대한항공 101" })).toBeVisible();
    await expect(latest.locator(".pulse-change-kicker")).toHaveText("새로 확인할 변화 없음");
    await expect(latest.locator(".pulse-change-dots")).toHaveCount(0);
    await expect(latest).not.toContainText("새 변화 0건");
    await expect(page.locator(".pulse-identity")).toContainText("Bonda 확인 상태 정상");
    const markerColor = await page.locator(".pulse-timeline li[data-active='true'] .pulse-node").evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(markerColor).toBe("rgb(47, 107, 255)");
    const quietColor = await latest.locator(".pulse-change-kicker").evaluate((node) => getComputedStyle(node).color);
    expect(quietColor).toBe("rgb(11, 23, 54)");
    await page.screenshot({ path: `../design/audit/2026-10-02-redesign/stage-1/monitoring-r1-${viewport.name}-quiet-${viewport.width}x${viewport.height}.png`, animations: "disabled" });

    if (viewport.width === 1440) {
      await page.getByRole("button", { name: /CJ CGV 35/ }).click();
    } else {
      await page.getByLabel("확인할 채권").selectOption("cgv");
    }
    await expect(latest.locator(".pulse-change-kicker")).toHaveText("새 변화 3건");
    await expect(latest.locator(".pulse-change-dots")).toHaveCount(1);
  }
});
