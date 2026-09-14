import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/monitoring");
  await expect(page.getByRole("heading", { name: "지금도, 당신의 채권을 지켜보고 있습니다." })).toBeVisible();
});

test("채권 변화에서 공시 원문까지 이동한다", async ({ page }, testInfo) => {
  const isCompact = testInfo.project.name.startsWith("mobile") || testInfo.project.name === "tablet";

  if (isCompact) {
    await page.getByLabel("확인할 채권").selectOption("cgv");
  } else {
    await page.getByRole("button", { name: /CJ CGV 35/ }).click();
  }

  await expect(page.getByRole("heading", { name: "CJ CGV 35" })).toBeVisible();
  await expect(page.getByText("채무보증 증가", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "공시 원문" }).click();
  await expect(page.getByRole("heading", { name: "최근 확인된 변화" })).toBeVisible();
  await expect(page.getByText("사업보고서 · [데모]")).toBeVisible();
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

  const helpButton = page.getByRole("button", { name: usesCompactTools ? "분석 구조 도움말" : "계산 기준" });
  await helpButton.click();
  await expect(page.getByRole("dialog", { name: "Bonda 계산 기준" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Bonda 계산 기준" })).toBeHidden();
  await expect(helpButton).toBeFocused();
});

test("고정 viewport에서 가로 넘침 없이 핵심 정보가 보인다", async ({ page }) => {
  const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  await expect(page.getByRole("heading", { name: "Credit Pulse" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "현재 위험 상태" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "재무 변화" })).toBeVisible();
});

test("시각 검증용 고정 화면을 캡처한다", { tag: "@capture" }, async ({ page }, testInfo) => {
  const captureName = `monitoring-${testInfo.project.name}.png`;
  await page.screenshot({ path: `../docs/design/${captureName}`, fullPage: false, animations: "disabled" });
});
