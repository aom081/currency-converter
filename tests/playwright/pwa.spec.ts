// ทดสอบ PWA บนไฟล์ที่ build จริง (service worker ทำงานเฉพาะ production) — รันด้วย: npm run test:e2e:pwa
import { test, expect } from "@playwright/test";
import { mockApi, openApp, ui } from "./helpers";

test.describe("PWA (ติดตั้งและใช้ออฟไลน์)", () => {
  test("TC-PWA-01 มี manifest ที่ติดตั้งเป็นแอปได้", { tag: "@smoke" }, async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBeTruthy();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", /#/);
    const res = await page.request.get("/manifest.webmanifest");
    expect(res.ok()).toBe(true);
    const m = await res.json();
    expect(m.display).toBe("standalone");
    expect(m.name).toBeTruthy();
    const sizes = (m.icons as { sizes: string }[]).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  test("TC-PWA-02 ลงทะเบียน service worker สำเร็จ", async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    await expect
      .poll(() =>
        page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state ?? "none"),
      )
      .toBe("activated");
  });

  test("TC-PWA-03 ปิดเน็ตแล้วเปิดแอปซ้ำได้ ใช้อัตราที่บันทึกไว้", async ({ page, context }) => {
    const mock = await mockApi(page);
    await openApp(page);
    await expect
      .poll(() => page.evaluate(async () => (await (await caches.open("cw-shell-v1")).keys()).length))
      .toBeGreaterThan(2); // ไฟล์ของแอปถูกเก็บไว้แล้ว
    mock.mode = "abort";
    await context.setOffline(true);
    await page.reload();
    await expect(ui.result(page)).toHaveText("35,000 THB");
    await expect(ui.status(page)).toContainText("ออฟไลน์");
    await expect(ui.status(page)).toContainText("บันทึกไว้");
  });
});
