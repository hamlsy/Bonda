import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/monitoring");
  await expect(page.getByRole("heading", { name: "순차입금 증가 확인" })).toBeVisible();
});

test("채권 변화에서 공시 원문까지 이동한다", async ({ page }, testInfo) => {
  const isCompact = testInfo.project.name.startsWith("mobile") || testInfo.project.name === "tablet";

  if (isCompact) {
    await page.getByLabel("확인할 채권").selectOption("cgv");
  } else {
    await page.getByRole("button", { name: /CJ CGV 35/ }).click();
  }

  await expect(page.getByRole("heading", { name: "CJ CGV 35" })).toBeVisible();
  await expect(page.locator(".pulse-latest-change").getByRole("heading", { name: "채무보증 증가" })).toBeVisible();
  await page.getByRole("tab", { name: "공시 원문" }).click();
  await expect(page.getByRole("heading", { name: "최근 확인된 변화" })).toBeVisible();
  await expect(page.locator(".pulse-latest-change")).toHaveCount(0);
  await expect(page.locator(".pulse-source-list").getByText("사업보고서 · [데모]")).toBeVisible();
});

test("검색, 키보드 탭, 도움말 대화상자가 작동한다", async ({ page }, testInfo) => {
  const usesCompactTools = testInfo.project.name !== "desktop";

  if (usesCompactTools) {
    await page.getByRole("button", { name: "채권 검색" }).click();
    await page.getByLabel("모바일 채권 검색").fill("대한항공");
    await expect(page.getByLabel("확인할 채권")).toHaveValue("korean-air");
  } else {
    await page.getByRole("searchbox", { name: "채권 검색" }).fill("대한항공");
    if (testInfo.project.name === "tablet") {
      await expect(page.getByLabel("확인할 채권")).toHaveValue("korean-air");
    } else {
      await expect(page.getByRole("button", { name: /대한항공 101/ })).toBeVisible();
    }
  }

  const overview = page.getByRole("tab", { name: "요약" });
  await overview.focus();
  await overview.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "변화 기록" })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("tab", { name: "더보기" }).click();
  const helpButton = page.getByRole("button", { name: "계산 기준" });
  await helpButton.click();
  await expect(page.getByRole("dialog", { name: "Bonda 계산 기준" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Bonda 계산 기준" })).toBeHidden();
  await expect(helpButton).toBeFocused();
});

test("고정 viewport에서 가로 넘침 없이 핵심 정보가 보인다", async ({ page }) => {
  const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  await expect(page.getByRole("heading", { name: "변화 기록" })).toBeVisible();
  await expect(page.locator(".pulse-risk-details summary")).toContainText("전체 상태 보기");
  await expect(page.getByRole("heading", { name: "재무 변화" })).toBeVisible();
});

test("390px 첫 화면에서 선택 채권의 최신 변화와 원문 진입점을 확인한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const summary = page.locator(".pulse-latest-change");
  await expect(summary).toContainText("순차입금 증가 확인");
  await expect(summary).toContainText("2026. 05. 16.");
  await expect(page.locator(".pulse-identity")).toContainText("관찰");
  await expect(summary).toContainText("연결 기준 순차입금 증가가 분기보고서에서 확인되었습니다.");
  const link = summary.getByRole("button", { name: "공시 원문 보기" });
  const box = await link.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThan(790);
  await link.click();
  await expect(page.getByRole("heading", { name: "최근 확인된 변화" })).toBeVisible();
  await page.getByLabel("확인할 채권").selectOption("cgv");
  await expect(summary).toContainText("채무보증 증가가 사업보고서에서 확인되었습니다.");
  await expect(summary).not.toContainText("총차입금");
});

test("390px 재무 변화 네 행의 수치와 변화율이 패널 안에 보인다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const panel = page.locator(".pulse-financial-panel");
  const bounds = await panel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  const rows = panel.locator(".pulse-financial-row");
  await expect(rows).toHaveCount(4);
  for (const row of await rows.all()) {
    await expect(row.locator("span").first()).toContainText("→");
    await expect(row.locator("em")).toContainText(/^[+-]\d+\.\d%$/);
    for (const element of [row.locator("span").first(), row.locator("em"), row.locator(".pulse-metric-comparison")]) {
      const box = await element.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
  }
});

test("선택 사건은 한 번 설명되고 전체 기록과 계산 기준에 접근할 수 있다", async ({ page }) => {
  const summary = page.locator(".pulse-latest-change");
  await expect(page.getByText("연결 기준 순차입금 증가가 분기보고서에서 확인되었습니다.")).toHaveCount(1);
  await page.locator(".pulse-timeline li").filter({ hasText: "총차입금 증가" }).getByRole("button").click();
  await expect(summary).toContainText("총차입금 증가");
  await expect(summary).toContainText("2026. 03. 14.");
  await expect(page.locator(".pulse-timeline li[data-active='true']")).toContainText("총차입금 증가");
  await page.getByRole("tab", { name: "변화 기록" }).click();
  await expect(page.getByRole("heading", { name: "최근 확인 활동" })).toBeVisible();
  await page.getByRole("tab", { name: "더보기" }).click();
  await page.getByRole("button", { name: "계산 기준" }).click();
  await expect(page.getByRole("dialog", { name: "Bonda 계산 기준" })).toBeVisible();
});

test("상태 줄은 지정 높이를 지키고 미확인 수 동작을 유지한다", async ({ page }) => {
  const status = page.getByRole("region", { name: "모니터링 현황" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(status).toHaveCSS("height", "40px");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(status).toHaveCSS("height", "56px");
  await expect(status).toContainText("2026. 09. 14. 10:24");
  await status.getByRole("button", { name: /새 변화 5건/ }).click();
  await expect(page.getByText("읽지 않은 변화 5건을 확인했습니다.")).toBeVisible();
});

test("위험 상태는 펼침에서 확인하고 전후 재무 값은 같은 단위로 읽는다", async ({ page }) => {
  await page.locator(".pulse-risk-details summary").click();
  const risk = page.getByRole("table", { name: "위험 범주별 현재 상태" });
  await expect(risk.getByRole("columnheader")).toHaveText(["범주", "현재 상태", "최근 변화"]);
  await expect(risk.getByRole("row")).toHaveCount(6);
  await expect(risk.getByRole("row", { name: /유동성/ })).toContainText("관찰");
  const current = page.locator(".pulse-financial-row").first().locator("b");
  await expect(current).toHaveText("11 조원");
  const fontSize = await current.evaluate((element) => getComputedStyle(element).fontSize);
  expect(fontSize).toBe("18px");
});

test("390px 마지막 재무 행은 하단 navigation에 가리지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const action = await page.locator(".pulse-financial-row").last().boundingBox();
  const navigation = await page.getByRole("navigation", { name: "모바일 주요 메뉴" }).boundingBox();
  expect(action).not.toBeNull();
  expect(navigation).not.toBeNull();
  expect(action!.y + action!.height).toBeLessThanOrEqual(navigation!.y);
});

test("시각 검증용 고정 화면을 캡처한다", { tag: "@capture" }, async ({ page }, testInfo) => {
  const captureName = `monitoring-${testInfo.project.name}.png`;
  await page.screenshot({ path: `../docs/design/${captureName}`, fullPage: false, animations: "disabled" });
});
