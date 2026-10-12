import { test, expect } from "@playwright/test";
import { mockApi, openApp, ui } from "./helpers";

test.describe("การแปลงค่าเงิน", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await openApp(page);
  });

  test("TC-CONV-01 แสดงผลเริ่มต้น 1,000 USD → THB", { tag: "@smoke" }, async ({ page }) => {
    await expect(ui.amount(page)).toHaveValue("1000");
    await expect(ui.from(page)).toHaveValue("USD");
    await expect(ui.to(page)).toHaveValue("THB");
    await expect(ui.result(page)).toHaveText("35,000 THB");
  });

  test("TC-CONV-02 เปลี่ยนจำนวนเงินแล้วผลลัพธ์เปลี่ยนทันที", { tag: "@smoke" }, async ({ page }) => {
    await ui.amount(page).fill("2");
    await expect(ui.result(page)).toHaveText("70 THB");
  });

  test("TC-CONV-03 เปลี่ยนสกุลปลายทางเป็น JPY", async ({ page }) => {
    await ui.to(page).selectOption("JPY");
    await expect(ui.result(page)).toHaveText("150,000 JPY");
  });

  test("TC-CONV-04 ปุ่มสลับสกุล", async ({ page }) => {
    await ui.swap(page).click();
    await expect(ui.from(page)).toHaveValue("THB");
    await expect(ui.to(page)).toHaveValue("USD");
    await expect(ui.result(page)).toHaveText("28.5714 USD");
  });

  test("TC-CONV-05 แสดงอัตราแลกเปลี่ยนทั้งสองทิศทาง", async ({ page }) => {
    await expect(ui.rateline(page)).toContainText("1 USD = 35 THB");
    await expect(ui.rateline(page)).toContainText("1 THB = 0.028571 USD");
  });

  test("TC-CONV-06 จำนวนเงินว่างหรือ 0 แสดงผลเป็น 0", async ({ page }) => {
    await ui.amount(page).fill("");
    await expect(ui.result(page)).toHaveText("0 THB");
    await ui.amount(page).fill("0");
    await expect(ui.result(page)).toHaveText("0 THB");
  });

  test("TC-CONV-07 สกุลต้นทางและปลายทางเหมือนกัน", async ({ page }) => {
    await ui.from(page).selectOption("EUR");
    await ui.to(page).selectOption("EUR");
    await expect(ui.result(page)).toHaveText("1,000 EUR");
  });
});
