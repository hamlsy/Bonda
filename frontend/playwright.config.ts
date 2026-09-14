import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  workers: 2,
  reporter: "line",
  outputDir: "test-results",
  use: {
    baseURL: "http://127.0.0.1:4174",
    browserName: "chromium",
    channel: "msedge",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile-390", use: { ...devices["Desktop Edge"], viewport: { width: 390, height: 844 }, isMobile: false } },
    { name: "mobile-320", use: { ...devices["Desktop Edge"], viewport: { width: 320, height: 800 }, isMobile: false } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174/monitoring",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
