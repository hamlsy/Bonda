import { expect, test } from "@playwright/test";

test("랜딩에서 모니터링 작업공간으로 진입한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /내가 산 뒤/ })).toBeVisible();
  await page.getByRole("link", { name: "모니터링 열기" }).click();
  await expect(page).toHaveURL(/\/monitoring$/);
  await expect(page.getByRole("heading", { name: "지금도, 당신의 채권을 지켜보고 있습니다." })).toBeVisible();
});

test("과거 재현 route가 공통 UI 계약 안에서 렌더링된다", async ({ page }) => {
  await page.goto("/admin/replay");
  await expect(page.getByRole("heading", { name: "그때까지 알 수 있던 것만 봅니다." })).toBeVisible();
  await expect(page.getByLabel("발행기업")).toBeVisible();
  await expect(page.getByLabel("기준일")).toBeVisible();
  const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});
