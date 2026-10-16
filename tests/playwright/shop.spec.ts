import { test, expect } from "@playwright/test";
import { mockApi, openApp, ui } from "./helpers";

test.describe("เทียบกับเรทร้านแลกเงิน/ธนาคาร (1,000 USD → THB, เรทกลาง 35)", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await openApp(page);
  });

  test("TC-SHOP-01 ยังไม่กรอกเรท แสดงข้อความแนะนำ", { tag: "@smoke" }, async ({ page }) => {
    await expect(ui.shopHint(page)).toBeVisible();
    await expect(ui.shopOut(page)).toBeHidden();
  });

  test("TC-SHOP-02 เรทร้านต่ำกว่าเรทกลาง", { tag: "@smoke" }, async ({ page }) => {
    await ui.shopRate(page).fill("34");
    await expect(ui.shopHint(page)).toBeHidden();
    await expect(ui.shopMarket(page)).toHaveText("35,000 THB");
    await expect(ui.shopResult(page)).toHaveText("34,000 THB");
    await expect(ui.shopDiff(page)).toHaveText("-1,000 THB (-2.857%)");
    await expect(ui.shopDiff(page)).toHaveClass(/down/);
    await expect(ui.shopVerdict(page)).toHaveText("ร้านให้น้อยกว่าเรทกลาง");
  });

  test("TC-SHOP-03 หักค่าธรรมเนียมเป็นเปอร์เซ็นต์", async ({ page }) => {
    await ui.shopRate(page).fill("34");
    await ui.shopFeePct(page).fill("1");
    await expect(ui.shopResult(page)).toHaveText("33,660 THB");
    await expect(ui.shopDiff(page)).toHaveText("-1,340 THB (-3.829%)");
  });

  test("TC-SHOP-04 หักค่าธรรมเนียมคงที่ (หน่วยสกุลต้นทาง)", async ({ page }) => {
    await ui.shopRate(page).fill("34");
    await ui.shopFeeFixed(page).fill("5");
    await expect(ui.shopResult(page)).toHaveText("33,830 THB"); // (1000 − 5) × 34
    await expect(ui.shopDiff(page)).toHaveText("-1,170 THB (-3.343%)");
  });

  test("TC-SHOP-05 เรทร้านสูงกว่าเรทกลาง", async ({ page }) => {
    await ui.shopRate(page).fill("36");
    await expect(ui.shopResult(page)).toHaveText("36,000 THB");
    await expect(ui.shopDiff(page)).toHaveText("+1,000 THB (+2.857%)");
    await expect(ui.shopDiff(page)).toHaveClass(/up/);
    await expect(ui.shopVerdict(page)).toHaveText("ร้านให้มากกว่าเรทกลาง");
  });

  test("TC-SHOP-06 เปลี่ยนจำนวนเงินแล้วผลเปลี่ยนตาม", async ({ page }) => {
    await ui.shopRate(page).fill("34");
    await ui.amount(page).fill("2");
    await expect(ui.shopMarket(page)).toHaveText("70 THB");
    await expect(ui.shopResult(page)).toHaveText("68 THB");
    await expect(ui.shopDiff(page)).toHaveText("-2 THB (-2.857%)");
  });

  test("TC-SHOP-07 ป้ายกำกับตามคู่เงินที่เลือก", async ({ page }) => {
    await expect(ui.shopRateLabel(page)).toContainText("1 USD = ? THB");
    await expect(ui.shopFixedLabel(page)).toContainText("USD");
    await ui.from(page).selectOption("EUR");
    await expect(ui.shopRateLabel(page)).toContainText("1 EUR = ? THB");
    await expect(ui.shopFixedLabel(page)).toContainText("EUR");
  });
});
