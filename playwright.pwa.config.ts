import { defineConfig, devices } from "@playwright/test";

/** ทดสอบ PWA: build แอปแล้วเปิดด้วย vite preview (service worker ลงทะเบียนเฉพาะ production) */
export default defineConfig({
  testDir: "./tests/playwright",
  testMatch: /pwa\.spec\.ts/,
  retries: process.env.CI ? 2 : 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "pwa", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
