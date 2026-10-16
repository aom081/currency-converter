import { test, expect } from "@playwright/test";
import { mockApi, openApp, openAppAt, ui } from "./helpers";

test.describe("แชร์ลิงก์ผลลัพธ์", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test("TC-SHARE-01 กดแชร์แล้วแสดงลิงก์ของค่าปัจจุบัน", { tag: "@smoke" }, async ({ page }) => {
    await openApp(page);
    await expect(ui.shareRow(page)).toBeHidden();
    await ui.shareBtn(page).click();
    await expect(ui.shareRow(page)).toBeVisible();
    await expect(ui.shareUrl(page)).toHaveValue(/^http.*\?amt=1000&from=USD&to=THB&lang=th$/);
  });

  test("TC-SHARE-02 ลิงก์และแถบที่อยู่อัปเดตตามค่าที่เปลี่ยน", async ({ page }) => {
    await openApp(page);
    await ui.amount(page).fill("250");
    await ui.from(page).selectOption("EUR");
    await ui.to(page).selectOption("JPY");
    await expect.poll(() => page.url()).toContain("?amt=250&from=EUR&to=JPY&lang=th");
    await ui.shareBtn(page).click();
    await expect(ui.shareUrl(page)).toHaveValue(/\?amt=250&from=EUR&to=JPY&lang=th$/);
  });

  test("TC-SHARE-03 เปิดลิงก์ที่แชร์แล้วได้ค่าตามลิงก์", { tag: "@smoke" }, async ({ page }) => {
    await openAppAt(page, "/?amt=250&from=EUR&to=JPY");
    await expect(ui.amount(page)).toHaveValue("250");
    await expect(ui.from(page)).toHaveValue("EUR");
    await expect(ui.to(page)).toHaveValue("JPY");
    await expect(ui.result(page)).toHaveText("41,666.67 JPY"); // 250 × 150/0.9
  });

  test("TC-SHARE-04 พารามิเตอร์ที่ไม่ถูกต้องถูกข้าม ใช้ค่าเริ่มต้น", async ({ page }) => {
    await openAppAt(page, "/?amt=abc&from=ZZ&to=12&lang=fr");
    await expect(ui.amount(page)).toHaveValue("1000");
    await expect(ui.from(page)).toHaveValue("USD");
    await expect(ui.to(page)).toHaveValue("THB");
    await expect(ui.result(page)).toHaveText("35,000 THB");
    await expect(page.locator("html")).toHaveAttribute("lang", "th");
  });

  test("TC-SHARE-05 ลิงก์ที่ระบุ lang=en เปิดเป็นภาษาอังกฤษ", async ({ page }) => {
    await openAppAt(page, "/?lang=en");
    await expect(ui.h1(page)).toHaveText("💱 Currency Converter");
  });

  test("TC-SHARE-06 คัดลอกลิงก์ลงคลิปบอร์ด", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openApp(page);
    await ui.shareBtn(page).click();
    await expect(ui.toasts(page)).toContainText("คัดลอกลิงก์แล้ว");
    const url = await ui.shareUrl(page).inputValue();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  });
});
