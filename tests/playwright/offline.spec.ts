import { test, expect } from "@playwright/test";
import { mockApi, openApp, openAppOffline, ui } from "./helpers";

test.describe("ใช้งานออฟไลน์", () => {
  test("TC-OFFLINE-01 ออฟไลน์แล้วใช้อัตราล่าสุดที่เคยบันทึกไว้", { tag: "@smoke" }, async ({ page }) => {
    const mock = await mockApi(page);
    await openApp(page); // THB = 35 ถูกบันทึกลงเครื่อง
    mock.mode = "abort";
    await page.reload();
    await expect(ui.status(page)).toContainText("ออฟไลน์");
    await expect(ui.status(page)).toContainText("บันทึกไว้");
    await expect(ui.result(page)).toHaveText("35,000 THB"); // ไม่ใช่อัตราตัวอย่าง 33.5
  });

  test("TC-OFFLINE-02 ไม่เคยมีข้อมูลสด ใช้อัตราตัวอย่าง", async ({ page }) => {
    await mockApi(page, "abort");
    await openAppOffline(page);
    await expect(ui.status(page)).toContainText("ข้อมูลตัวอย่าง");
    await expect(ui.status(page)).not.toContainText("บันทึกไว้");
    await expect(ui.result(page)).toHaveText("33,500 THB");
  });
});
