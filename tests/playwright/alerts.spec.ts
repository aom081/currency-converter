import { test, expect } from "@playwright/test";
import { mockApi, openApp, openAppOffline, refreshAndWait, setAlert, ui, type Mock } from "./helpers";

test.describe("แจ้งเตือนราคาเป้าหมาย", () => {
  let mock: Mock;

  test.beforeEach(async ({ page }) => {
    mock = await mockApi(page);
    await openApp(page);
    await ui.listStar(page, "JPY").click(); // JPY/THB เริ่มต้น = 35/150 = 0.233333
  });

  test("TC-ALERT-01 การ์ดที่ติดตามมีฟอร์มตั้งแจ้งเตือน", { tag: "@smoke" }, async ({ page }) => {
    await expect(ui.alertDir(page, "JPY")).toBeVisible();
    await expect(ui.alertTarget(page, "JPY")).toBeVisible();
    await expect(ui.alertSet(page, "JPY")).toBeVisible();
  });

  test("TC-ALERT-02 เป้าหมายว่างหรือ 0 แสดงข้อผิดพลาด ไม่สร้างแจ้งเตือน", async ({ page }) => {
    await ui.alertSet(page, "JPY").click();
    await expect(ui.alertErr(page, "JPY")).toContainText("กรุณากรอกราคาเป้าหมาย");
    await ui.alertTarget(page, "JPY").fill("0");
    await ui.alertSet(page, "JPY").click();
    await expect(ui.alertErr(page, "JPY")).toContainText("กรุณากรอกราคาเป้าหมาย");
    await expect(ui.alertState(page)).toHaveCount(0);
  });

  test("TC-ALERT-03 ตั้งแจ้งเตือนแล้วแสดงเงื่อนไข", { tag: "@smoke" }, async ({ page }) => {
    await setAlert(page, "JPY", "above", "0.24");
    await expect(ui.alertState(page)).toContainText("≥ 0.24 THB");
    await expect(ui.alertSet(page, "JPY")).toHaveCount(0);
  });

  test("TC-ALERT-04 ยังไม่ถึงเป้าหมาย รีเฟรชแล้วไม่แจ้ง", async ({ page }) => {
    await setAlert(page, "JPY", "above", "0.24");
    await refreshAndWait(page, mock);
    await expect(ui.toasts(page)).toHaveCount(0);
    await expect(ui.alertState(page)).not.toHaveClass(/hit/);
  });

  test("TC-ALERT-05 เรทสูงถึงเป้าหมาย แจ้งเตือนและทำเครื่องหมาย", { tag: "@smoke" }, async ({ page }) => {
    await setAlert(page, "JPY", "above", "0.24");
    mock.rates.JPY = 140; // 35/140 = 0.25 ≥ 0.24
    await refreshAndWait(page, mock);
    await expect(ui.toasts(page)).toHaveCount(1);
    await expect(ui.toasts(page)).toContainText("JPY/THB");
    await expect(ui.toasts(page)).toContainText("สูงกว่า");
    await expect(ui.alertState(page)).toContainText("ถึงเป้าหมายแล้ว");
    await expect(ui.alertState(page)).toHaveClass(/hit/);
  });

  test("TC-ALERT-06 เรทต่ำถึงเป้าหมาย แจ้งเตือน", async ({ page }) => {
    await setAlert(page, "JPY", "below", "0.23");
    await expect(ui.alertState(page)).toContainText("≤ 0.23 THB");
    mock.rates.JPY = 160; // 35/160 = 0.21875 ≤ 0.23
    await refreshAndWait(page, mock);
    await expect(ui.toasts(page)).toContainText("ต่ำกว่า");
    await expect(ui.alertState(page)).toContainText("ถึงเป้าหมายแล้ว");
  });

  test("TC-ALERT-07 แจ้งเพียงครั้งเดียวต่อการตั้ง", async ({ page }) => {
    await setAlert(page, "JPY", "above", "0.24");
    mock.rates.JPY = 140;
    await refreshAndWait(page, mock);
    await expect(ui.toasts(page)).toHaveCount(1);
    mock.rates.JPY = 130; // ยังสูงกว่าเป้าหมายอยู่ แต่ต้องไม่แจ้งซ้ำ
    await refreshAndWait(page, mock);
    await expect(ui.toasts(page)).toHaveCount(1);
  });

  test("TC-ALERT-08 ลบแจ้งเตือนแล้วกลับเป็นฟอร์ม", async ({ page }) => {
    await setAlert(page, "JPY", "above", "0.24");
    await ui.alertClear(page, "JPY").click();
    await expect(ui.alertState(page)).toHaveCount(0);
    await expect(ui.alertSet(page, "JPY")).toBeVisible();
  });

  test("TC-ALERT-09 แจ้งเตือนคงอยู่หลังรีโหลด", async ({ page }) => {
    await setAlert(page, "JPY", "above", "0.24");
    await page.reload();
    await expect(ui.status(page)).toContainText("● สด");
    await expect(ui.alertState(page)).toContainText("≥ 0.24 THB");
  });

  test("TC-ALERT-10 ปิดการแจ้งเตือนด้วยปุ่ม ×", async ({ page }) => {
    await setAlert(page, "JPY", "above", "0.24");
    mock.rates.JPY = 140;
    await refreshAndWait(page, mock);
    await expect(ui.toasts(page)).toHaveCount(1);
    await page.locator("#toasts .toast-x").click();
    await expect(ui.toasts(page)).toHaveCount(0);
  });

  test("TC-ALERT-12 เลิกติดตามสกุลแล้วแจ้งเตือนของสกุลนั้นถูกลบ", async ({ page }) => {
    await setAlert(page, "JPY", "above", "0.24");
    await ui.cardStar(page, "JPY").click();
    await ui.listStar(page, "JPY").click();
    await expect(ui.alertState(page)).toHaveCount(0);
    await expect(ui.alertSet(page, "JPY")).toBeVisible();
  });
});

test.describe("แจ้งเตือนกับโหมดออฟไลน์", () => {
  test("TC-ALERT-11 ข้อมูลตัวอย่างตอนออฟไลน์ไม่ทริกเกอร์ และทริกเกอร์เมื่อได้ข้อมูลสด", async ({ page }) => {
    const mock = await mockApi(page, "abort");
    await openAppOffline(page);
    await ui.listStar(page, "JPY").click();
    // ข้อมูลสำรอง THB/JPY = 33.5/150 = 0.2233 ≤ 0.23 แต่ต้องไม่ทริกเกอร์เพราะยังเป็นข้อมูลตัวอย่าง
    await setAlert(page, "JPY", "below", "0.23");
    await expect(ui.alertState(page)).toContainText("≤ 0.23 THB");
    await expect(ui.toasts(page)).toHaveCount(0);
    await expect(ui.alertState(page)).not.toHaveClass(/hit/);

    mock.mode = "ok";
    mock.rates.THB = 34; // 34/150 = 0.2267 ≤ 0.23
    await ui.refresh(page).click();
    await expect(ui.status(page)).toContainText("● สด");
    await expect(ui.toasts(page)).toHaveCount(1);
    await expect(ui.alertState(page)).toContainText("ถึงเป้าหมายแล้ว");
  });
});
