import { test, expect } from "@playwright/test";
import { mockApi, openApp, ui } from "./helpers";

test.describe("รายการสกุลเงิน การค้นหา และการจำค่า", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await openApp(page);
  });

  test("TC-LIST-01 แสดงสกุลเงินครบ 33 รายการ", async ({ page }) => {
    await expect(ui.allItems(page)).toHaveCount(33);
  });

  test("TC-LIST-02 ค้นหาด้วยรหัส (ไม่สนตัวพิมพ์เล็กใหญ่)", { tag: "@smoke" }, async ({ page }) => {
    await ui.search(page).fill("jpy");
    await expect(ui.allItems(page)).toHaveCount(1);
    await expect(ui.allItems(page)).toContainText("JPY");
  });

  test("TC-LIST-03 ค้นหาด้วยชื่อภาษาไทย", async ({ page }) => {
    await ui.search(page).fill("ยูโร");
    await expect(ui.allItems(page)).toHaveCount(1);
    await expect(ui.allItems(page)).toContainText("EUR");
  });

  test("TC-LIST-04 ค้นหาแล้วไม่พบ", async ({ page }) => {
    await ui.search(page).fill("zzz");
    await expect(ui.allItems(page)).toHaveCount(0);
    await expect(page.locator("#all .empty")).toHaveText("ไม่พบสกุลเงิน");
  });

  test("TC-PREF-01 จำสกุลที่เลือกไว้หลังรีโหลด", async ({ page }) => {
    await ui.from(page).selectOption("EUR");
    await ui.to(page).selectOption("GBP");
    await ui.base(page).selectOption("USD");
    await page.reload();
    await expect(ui.status(page)).toContainText("● สด");
    await expect(ui.from(page)).toHaveValue("EUR");
    await expect(ui.to(page)).toHaveValue("GBP");
    await expect(ui.base(page)).toHaveValue("USD");
  });
});

test.describe("มือถือ", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("TC-UI-01 หน้าจอเล็กไม่มีการเลื่อนแนวนอน", async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    await ui.listStar(page, "JPY").click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
