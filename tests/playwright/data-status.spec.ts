import { test, expect } from "@playwright/test";
import { mockApi, openApp, openAppOffline, ui } from "./helpers";

test.describe("สถานะและการดึงข้อมูล", () => {
  test("TC-DATA-01 แสดงสถานะ 'สด' เมื่อดึงข้อมูลสำเร็จ", { tag: "@smoke" }, async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    await expect(ui.status(page)).toHaveClass(/live/);
    await expect(ui.status(page)).toContainText("อัปเดต");
  });

  test("TC-DATA-02 ใช้ข้อมูลสำรองเมื่อเชื่อมต่อ API ไม่ได้", { tag: "@smoke" }, async ({ page }) => {
    await mockApi(page, "abort");
    await openAppOffline(page);
    await expect(ui.status(page)).toHaveClass(/off/);
    // ข้อมูลสำรองของ THB = 33.5 (ดู src/currencies.ts)
    await expect(ui.result(page)).toHaveText("33,500 THB");
  });

  test("TC-DATA-03 API ตอบ HTTP 500 หรือไม่มี rates → ออฟไลน์", async ({ page }) => {
    const mock = await mockApi(page, "http500");
    await openAppOffline(page);
    mock.mode = "norates";
    await ui.refresh(page).click();
    await expect(ui.status(page)).toContainText("ออฟไลน์");
    await expect(ui.refresh(page)).toBeEnabled();
  });

  test("TC-DATA-04 ปุ่มรีเฟรชดึงอัตราใหม่", { tag: "@smoke" }, async ({ page }) => {
    const mock = await mockApi(page);
    await openApp(page);
    mock.rates.THB = 36;
    await ui.refresh(page).click();
    await expect(ui.result(page)).toHaveText("36,000 THB");
    expect(mock.hits).toBeGreaterThanOrEqual(2);
  });

  test("TC-DATA-05 อัปเดตอัตโนมัติทุก 60 วินาที", async ({ page }) => {
    const mock = await mockApi(page);
    await page.clock.install();
    await openApp(page);
    const before = mock.hits;
    mock.rates.THB = 34;
    await page.clock.fastForward(60_000);
    await expect(ui.result(page)).toHaveText("34,000 THB");
    expect(mock.hits).toBeGreaterThan(before);
  });
});
