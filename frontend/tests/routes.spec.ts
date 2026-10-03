import { expect, test } from "@playwright/test";

test("랜딩에서 모니터링 작업공간으로 진입한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /사는 순간부터/ })).toBeVisible();
  await expect(page.getByText("3개 발행사")).toBeVisible();
  await expect(page.getByText("5건")).toBeVisible();
  await page.getByRole("link", { name: "내 채권 확인하기" }).click();
  await expect(page).toHaveURL(/\/monitoring$/);
  await expect(page.getByRole("heading", { name: "순차입금 증가 확인" })).toBeVisible();
});

test("과거 재현 route가 공통 UI 계약 안에서 렌더링된다", async ({ page }) => {
  await page.goto("/admin/replay");
  await expect(page.getByRole("heading", { name: "선택한 날짜까지 공개된 정보" })).toBeVisible();
  await expect(page.getByLabel("발행기업")).toBeVisible();
  await expect(page.getByLabel("기준일")).toBeVisible();
  await expect(page.getByText("HISTORICAL REPLAY")).toHaveCount(0);
  const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});

test("존재하지 않는 경로도 공통 제품 셸 안에서 복구할 수 있다", async ({ page }) => {
  await page.goto("/missing-route");
  await expect(page.getByRole("heading", { name: "이 주소에는 화면이 없습니다." })).toBeVisible();
  await expect(page.getByText("ROUTE CHECK")).toBeVisible();
  await expect(page.getByRole("link", { name: "내 채권 보기" })).toBeVisible();
});

test("상세와 공시 route도 공통 제품 셸을 유지한다", async ({ page }) => {
  for (const [route, shell] of [["/holdings/1/since-bought", "since-shell"], ["/risk-events/1", "evidence-page-shell"]] as const) {
    await page.goto(route);
    await expect(page.locator(`.${shell}`)).toBeVisible();
    const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  }
});

test("전체 화면 시각 검증 캡처", { tag: "@capture" }, async ({ page }, testInfo) => {
  test.skip(!process.env.BONDA_CAPTURE_DOCS, "기존 docs/design 캡처는 명시적으로 요청할 때만 갱신합니다.");
  const routes = [
    ["landing", "/"],
    ["holding", "/holdings/1/since-bought"],
    ["source", "/risk-events/1"],
    ["replay", "/admin/replay"],
    ["not-found", "/missing-route"],
  ] as const;
  for (const [name, route] of routes) {
    await page.goto(route);
    await page.screenshot({ path: `../docs/design/${name}-${testInfo.project.name}.png`, fullPage: false, animations: "disabled" });
  }
});
