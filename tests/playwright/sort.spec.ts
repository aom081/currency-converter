import { test, expect } from "@playwright/test";
import { mockApi, openApp, refreshAndWait, ui, type Mock } from "./helpers";

test.describe("จัดเรียงรายการที่ติดตาม", () => {
  let mock: Mock;

  test.beforeEach(async ({ page }) => {
    mock = await mockApi(page);
    await openApp(page);
    for (const c of ["JPY", "EUR", "GBP"]) await ui.listStar(page, c).click();
  });

  test("TC-SORT-01 ค่าเริ่มต้นเรียงตามที่เพิ่ม (กำหนดเอง)", { tag: "@smoke" }, async ({ page }) => {
    await expect(ui.sortSelect(page)).toHaveValue("manual");
    await expect(ui.cardCodes(page)).toHaveText(["JPY", "EUR", "GBP"]);
  });

  test("TC-SORT-02 เลื่อนการ์ดขึ้น/ลงด้วยปุ่ม ▲▼", async ({ page }) => {
    await expect(ui.moveUp(page, "JPY")).toBeDisabled(); // ใบแรกเลื่อนขึ้นไม่ได้
    await expect(ui.moveDown(page, "GBP")).toBeDisabled(); // ใบสุดท้ายเลื่อนลงไม่ได้
    await ui.moveDown(page, "JPY").click();
    await expect(ui.cardCodes(page)).toHaveText(["EUR", "JPY", "GBP"]);
    await ui.moveUp(page, "GBP").click();
    await expect(ui.cardCodes(page)).toHaveText(["EUR", "GBP", "JPY"]);
  });

  test("TC-SORT-03 เรียงตามรหัสสกุล A→Z", async ({ page }) => {
    await ui.sortSelect(page).selectOption("code");
    await expect(ui.cardCodes(page)).toHaveText(["EUR", "GBP", "JPY"]);
  });

  test("TC-SORT-04 เรียงตามแข็งค่า/อ่อนค่ามากสุด", { tag: "@smoke" }, async ({ page }) => {
    mock.rates.JPY = 140; // JPY +7.143%
    mock.rates.EUR = 0.95; // EUR -5.263%, GBP 0%
    await refreshAndWait(page, mock);
    await ui.sortSelect(page).selectOption("gain");
    await expect(ui.cardCodes(page)).toHaveText(["JPY", "GBP", "EUR"]);
    await ui.sortSelect(page).selectOption("loss");
    await expect(ui.cardCodes(page)).toHaveText(["EUR", "GBP", "JPY"]);
  });

  test("TC-SORT-05 จำโหมดเรียงและลำดับที่จัดเองหลังรีโหลด", async ({ page }) => {
    await ui.moveDown(page, "JPY").click(); // EUR, JPY, GBP
    await page.reload();
    await expect(ui.status(page)).toContainText("● สด");
    await expect(ui.cardCodes(page)).toHaveText(["EUR", "JPY", "GBP"]);
    await ui.sortSelect(page).selectOption("code");
    await page.reload();
    await expect(ui.status(page)).toContainText("● สด");
    await expect(ui.sortSelect(page)).toHaveValue("code");
    await expect(ui.cardCodes(page)).toHaveText(["EUR", "GBP", "JPY"]);
  });

  test("TC-SORT-06 ปุ่ม ▲▼ แสดงเฉพาะโหมดกำหนดเอง", async ({ page }) => {
    await expect(page.locator("[data-move-down]")).toHaveCount(3);
    await ui.sortSelect(page).selectOption("code");
    await expect(page.locator("[data-move-down]")).toHaveCount(0);
    await ui.sortSelect(page).selectOption("manual");
    await expect(page.locator("[data-move-down]")).toHaveCount(3);
  });
});
