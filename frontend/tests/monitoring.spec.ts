import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto("/monitoring");
  const entryHeading = testInfo.project.name.startsWith("mobile") ? "롯데케미칼 59-1" : "변화와 근거를 한 화면에서 확인하세요";
  await expect(page.getByRole("heading", { name: entryHeading })).toBeVisible();
});

test("채권 변화에서 원문 근거까지 이동한다", async ({ page }, testInfo) => {
  const isCompact = testInfo.project.name.startsWith("mobile") || testInfo.project.name === "tablet";

  if (isCompact) {
    await page.getByLabel("확인할 채권").selectOption("cgv");
  } else {
    await page.getByRole("button", { name: /CJ CGV 35/ }).click();
  }

  await expect(page.getByRole("heading", { name: "CJ CGV 35" })).toBeVisible();
  await expect(page.getByText("채무보증 증가", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "근거" }).click();
  await expect(page.getByRole("heading", { name: "최근 변화와 원문 근거" })).toBeVisible();
  await expect(page.getByText("사업보고서 · [데모]")).toBeVisible();
});

test("검색, 키보드 탭, 도움말 대화상자가 작동한다", async ({ page }, testInfo) => {
  const usesMobileSearch = testInfo.project.name.startsWith("mobile");

  if (usesMobileSearch) {
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
  await expect(page.getByRole("tab", { name: "변화" })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "분석 구조 도움말" }).click();
  await expect(page.getByRole("dialog", { name: "Bonda 분석 구조" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Bonda 분석 구조" })).toBeHidden();
  await expect(page.getByRole("button", { name: "분석 구조 도움말" })).toBeFocused();
});

test("고정 viewport에서 가로 넘침 없이 핵심 정보가 보인다", async ({ page }) => {
  const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  await expect(page.getByRole("heading", { name: "근거 연결형 사건 연대기" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "현재 위험 상태" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "재무 변화" })).toBeVisible();
});

test("시각 검증용 고정 화면을 캡처한다", { tag: "@capture" }, async ({ page }, testInfo) => {
  const captureName = `monitoring-${testInfo.project.name}.png`;
  await page.screenshot({ path: `../docs/design/${captureName}`, fullPage: false, animations: "disabled" });
});
