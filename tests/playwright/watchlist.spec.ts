import { test, expect } from "@playwright/test";
import { mockApi, openApp, ui, type Mock } from "./helpers";

test.describe("รายการที่ติดตาม", () => {
  let mock: Mock;

  test.beforeEach(async ({ page }) => {
    mock = await mockApi(page);
    await openApp(page);
  });

  test("TC-WATCH-01 เริ่มต้นแสดงข้อความว่าง", { tag: "@smoke" }, async ({ page }) => {
    await expect(page.locator("#watch .empty")).toContainText("ยังไม่มีสกุลเงินที่ติดตาม");
  });

  test("TC-WATCH-02 กดดาวเพื่อติดตามแล้วขึ้นการ์ด", { tag: "@smoke" }, async ({ page }) => {
    await ui.listStar(page, "JPY").click();
    await expect(ui.listStar(page, "JPY")).toHaveText("★");
    await expect(ui.cards(page)).toHaveCount(1);
    await expect(ui.cards(page)).toContainText("JPY");
    await expect(ui.cardRate(page)).toContainText("0.233333"); // 35 / 150
  });

  test("TC-WATCH-03 เลิกติดตามจากการ์ด", async ({ page }) => {
    await ui.listStar(page, "JPY").click();
    await ui.cardStar(page, "JPY").click();
    await expect(ui.cards(page)).toHaveCount(0);
    await expect(ui.listStar(page, "JPY")).toHaveText("☆");
    await expect(page.locator("#watch .empty")).toBeVisible();
  });

  test("TC-WATCH-04 รายการติดตามคงอยู่หลังรีโหลดหน้า", async ({ page }) => {
    await ui.listStar(page, "EUR").click();
    await page.reload();
    await expect(ui.status(page)).toContainText("● สด");
    await expect(ui.cards(page)).toHaveCount(1);
    await expect(ui.cards(page)).toContainText("EUR");
  });

  test("TC-WATCH-05 สกุลเงินแข็งค่าขึ้น แสดง ▲ สีเขียว", { tag: "@smoke" }, async ({ page }) => {
    await ui.listStar(page, "JPY").click();
    mock.rates.JPY = 140; // เยนแข็งขึ้น: 35/140 = 0.25
    await ui.refresh(page).click();
    await expect(ui.deltaLast(page)).toHaveText("▲ ล่าสุด +7.143%");
    await expect(ui.deltaSince(page)).toHaveText("▲ ตั้งแต่ติดตาม +7.143%");
    await expect(ui.deltaLast(page)).toHaveClass(/up/);
  });

  test("TC-WATCH-06 สกุลเงินอ่อนค่าลง แสดง ▼ สีแดง", async ({ page }) => {
    await ui.listStar(page, "JPY").click();
    mock.rates.JPY = 160; // 35/160 = 0.21875
    await ui.refresh(page).click();
    await expect(ui.deltaLast(page)).toHaveText("▼ ล่าสุด -6.250%");
    await expect(ui.deltaSince(page)).toHaveText("▼ ตั้งแต่ติดตาม -6.250%");
    await expect(ui.deltaLast(page)).toHaveClass(/down/);
  });

  test("TC-WATCH-07 อัตราไม่เปลี่ยน แสดง • 0.000%", async ({ page }) => {
    await ui.listStar(page, "JPY").click();
    await ui.refresh(page).click();
    await expect.poll(() => mock.hits).toBeGreaterThanOrEqual(2);
    await expect(ui.deltaLast(page)).toHaveText("• ล่าสุด 0.000%");
    await expect(ui.deltaLast(page)).toHaveClass(/flat/);
  });

  test("TC-WATCH-08 เปลี่ยนสกุลฐานแล้วอัตราในการ์ดเปลี่ยนตาม", async ({ page }) => {
    await ui.listStar(page, "JPY").click();
    await ui.base(page).selectOption("USD");
    await expect(ui.cardRate(page)).toContainText("0.006667"); // 1 / 150
  });

  test("TC-WATCH-09 ติดตามสกุลเดียวกับสกุลฐาน ไม่แสดงการ์ด", async ({ page }) => {
    await ui.listStar(page, "THB").click(); // สกุลฐานเริ่มต้นคือ THB
    await expect(ui.cards(page)).toHaveCount(0);
    await expect(page.locator("#watch .empty")).toContainText("เลือกสกุลอื่น");
  });

  test("TC-WATCH-10 ติดตามหลายสกุลพร้อมกัน", async ({ page }) => {
    await ui.listStar(page, "JPY").click();
    await ui.listStar(page, "EUR").click();
    await ui.listStar(page, "GBP").click();
    await expect(ui.cards(page)).toHaveCount(3);
  });
});
