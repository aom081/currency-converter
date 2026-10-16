import { test, expect } from "@playwright/test";
import { mockApi, openApp, ui } from "./helpers";

// API จริงส่งมาเกิน 160 สกุล — ทดสอบด้วย CZK ที่ไม่อยู่ในรายการหลัก 33 สกุล
test.describe("สกุลเงินเพิ่มเติมจาก API", () => {
  test.beforeEach(async ({ page }) => {
    const mock = await mockApi(page);
    mock.rates.CZK = 22;
    await openApp(page);
  });

  test("TC-CUR-01 สกุลที่ API ส่งมาเพิ่มขึ้นในรายการและค้นหาได้", { tag: "@smoke" }, async ({ page }) => {
    await expect(ui.allItems(page)).toHaveCount(34);
    await ui.search(page).fill("czk");
    await expect(ui.allItems(page)).toHaveCount(1);
    await expect(ui.allItems(page)).toContainText("CZK");
  });

  test("TC-CUR-02 เลือกสกุลเพิ่มเติมเป็นปลายทางแล้วคำนวณได้", async ({ page }) => {
    await ui.to(page).selectOption("CZK");
    await expect(ui.result(page)).toHaveText("22,000 CZK");
  });

  test("TC-CUR-03 ติดตามสกุลเพิ่มเติมได้", async ({ page }) => {
    await ui.listStar(page, "CZK").click();
    await expect(ui.cards(page)).toHaveCount(1);
    await expect(ui.cardRate(page)).toContainText("1.5909"); // 35 / 22
  });
});
