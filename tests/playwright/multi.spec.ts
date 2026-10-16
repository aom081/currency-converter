import { test, expect } from "@playwright/test";
import { mockApi, openApp, ui } from "./helpers";

test.describe("แปลงเป็นหลายสกุลพร้อมกัน", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await openApp(page);
  });

  test("TC-MULTI-01 ยังไม่ติดตามสกุลใด แสดงข้อความแนะนำ", { tag: "@smoke" }, async ({ page }) => {
    await expect(ui.multiRows(page)).toHaveCount(0);
    await expect(page.locator("#multi .empty")).toContainText("ติดตามสกุลเงิน");
  });

  test("TC-MULTI-02 แสดงผลทุกสกุลที่ติดตาม", { tag: "@smoke" }, async ({ page }) => {
    for (const c of ["JPY", "EUR", "GBP"]) await ui.listStar(page, c).click();
    await expect(ui.multiHead(page)).toHaveText("จาก 1,000 USD");
    await expect(ui.multiRows(page)).toHaveCount(3);
    await expect(ui.multiVal(page, "JPY")).toHaveText("150,000 JPY");
    await expect(ui.multiVal(page, "EUR")).toHaveText("900 EUR");
    await expect(ui.multiVal(page, "GBP")).toHaveText("800 GBP");
  });

  test("TC-MULTI-03 เปลี่ยนจำนวนเงินแล้วตารางเปลี่ยนตาม", async ({ page }) => {
    for (const c of ["JPY", "EUR"]) await ui.listStar(page, c).click();
    await ui.amount(page).fill("2");
    await expect(ui.multiHead(page)).toHaveText("จาก 2 USD");
    await expect(ui.multiVal(page, "JPY")).toHaveText("300 JPY");
    await expect(ui.multiVal(page, "EUR")).toHaveText("1.8 EUR");
  });

  test("TC-MULTI-04 เปลี่ยนสกุลต้นทาง และไม่แสดงแถวของสกุลต้นทางเอง", async ({ page }) => {
    for (const c of ["THB", "JPY", "EUR"]) await ui.listStar(page, c).click();
    await ui.from(page).selectOption("THB");
    await expect(ui.multiRows(page)).toHaveCount(2); // ไม่มีแถว THB
    await expect(ui.multiVal(page, "JPY")).toHaveText("4,285.71 JPY"); // 1000 × 150/35
    await expect(ui.multiVal(page, "EUR")).toHaveText("25.7143 EUR"); // 1000 × 0.9/35
  });

  test("TC-MULTI-05 เลิกติดตามแล้วแถวหายไป", async ({ page }) => {
    await ui.listStar(page, "JPY").click();
    await expect(ui.multiRows(page)).toHaveCount(1);
    await ui.listStar(page, "JPY").click();
    await expect(ui.multiRows(page)).toHaveCount(0);
  });
});
