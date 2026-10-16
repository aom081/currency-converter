import { test, expect } from "@playwright/test";
import { mockApi, openApp, refreshAndWait, setAlert, ui, type Mock } from "./helpers";

test.describe("สลับภาษา ไทย/อังกฤษ", () => {
  let mock: Mock;

  test.beforeEach(async ({ page }) => {
    mock = await mockApi(page);
    await openApp(page);
  });

  test("TC-LANG-01 ค่าเริ่มต้นเป็นภาษาไทย", { tag: "@smoke" }, async ({ page }) => {
    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await expect(ui.h1(page)).toContainText("เครื่องคำนวณค่าเงิน");
    await expect(ui.langBtn(page, "th")).toHaveAttribute("aria-pressed", "true");
  });

  test("TC-LANG-02 สลับเป็นภาษาอังกฤษ", { tag: "@smoke" }, async ({ page }) => {
    await ui.langBtn(page, "en").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(ui.h1(page)).toHaveText("💱 Currency Converter");
    await expect(page.locator('label[for="amt"]')).toHaveText("Amount");
    await expect(ui.refresh(page)).toHaveText("Refresh");
    await expect(ui.status(page)).toContainText("● Live");
    await expect(ui.langBtn(page, "en")).toHaveAttribute("aria-pressed", "true");
  });

  test("TC-LANG-03 จำภาษาที่เลือกหลังรีโหลด", async ({ page }) => {
    await ui.langBtn(page, "en").click();
    await page.reload();
    await expect(ui.status(page)).toContainText("● Live");
    await expect(ui.h1(page)).toHaveText("💱 Currency Converter");
    await ui.langBtn(page, "th").click();
    await expect(ui.h1(page)).toContainText("เครื่องคำนวณค่าเงิน");
  });

  test("TC-LANG-04 ข้อความที่สร้างจากโปรแกรมเปลี่ยนเป็นอังกฤษด้วย", async ({ page }) => {
    await ui.langBtn(page, "en").click();
    await expect(page.locator("#watch .empty")).toContainText("No currencies are being watched yet");
    await ui.listStar(page, "JPY").click();
    mock.rates.JPY = 140;
    await refreshAndWait(page, mock);
    await expect(ui.deltaLast(page)).toHaveText("▲ Last +7.143%");
    await expect(ui.deltaSince(page)).toHaveText("▲ Since watching +7.143%");
    await expect(ui.multiHead(page)).toHaveText("From 1,000 USD");
  });

  test("TC-LANG-05 ข้อความแจ้งเตือนราคาเป็นอังกฤษ", async ({ page }) => {
    await ui.langBtn(page, "en").click();
    await ui.listStar(page, "JPY").click();
    await setAlert(page, "JPY", "above", "0.24");
    mock.rates.JPY = 140;
    await refreshAndWait(page, mock);
    await expect(ui.toasts(page)).toContainText("JPY/THB above target 0.24 reached");
    await expect(ui.alertState(page)).toContainText("Target reached");
  });

  test("TC-LANG-06 ชื่อสกุลเงินเปลี่ยนตามภาษา", async ({ page }) => {
    const jpy = ui.allItems(page).filter({ hasText: "JPY" });
    await expect(jpy).toContainText("เยน");
    await ui.langBtn(page, "en").click();
    await expect(jpy).toContainText("Yen");
    await ui.langBtn(page, "th").click();
    await expect(jpy).toContainText("เยน");
  });
});
