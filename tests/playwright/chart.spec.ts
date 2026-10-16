import { test, expect } from "@playwright/test";
import { mockApi, openApp, ui } from "./helpers";

test.describe("กราฟย้อนหลัง", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await openApp(page);
  });

  test("TC-CHART-01 แสดงกราฟเริ่มต้น 30 วันของ USD → THB", { tag: "@smoke" }, async ({ page }) => {
    await expect(ui.chartTitle(page)).toHaveText("USD → THB");
    await expect(ui.rangeBtn(page, 30)).toHaveAttribute("aria-pressed", "true");
    await expect(ui.chartSvg(page)).toHaveAttribute("data-points", "31");
    // mock: ต้นช่วง 0.9×35 = 31.5, ปลายช่วง 35
    await expect(ui.stLatest(page)).toHaveText("35");
    await expect(ui.stMin(page)).toHaveText("31.5");
    await expect(ui.stMax(page)).toHaveText("35");
    await expect(ui.stChg(page)).toHaveText("+11.111%");
    await expect(ui.stChg(page)).toHaveClass(/up/);
  });

  test("TC-CHART-02 สลับช่วง 7 / 90 วัน", async ({ page }) => {
    await ui.rangeBtn(page, 7).click();
    await expect(ui.rangeBtn(page, 7)).toHaveAttribute("aria-pressed", "true");
    await expect(ui.chartSvg(page)).toHaveAttribute("data-points", "8");
    await ui.rangeBtn(page, 90).click();
    await expect(ui.rangeBtn(page, 90)).toHaveAttribute("aria-pressed", "true");
    await expect(ui.chartSvg(page)).toHaveAttribute("data-points", "91");
    await expect(ui.rangeBtn(page, 7)).toHaveAttribute("aria-pressed", "false");
  });

  test("TC-CHART-03 เปลี่ยนคู่เงินในตัวแปลง กราฟเปลี่ยนตาม", async ({ page }) => {
    await ui.to(page).selectOption("JPY");
    await expect(ui.chartTitle(page)).toHaveText("USD → JPY");
    await expect(ui.stLatest(page)).toHaveText("150");
    await expect(ui.stMin(page)).toHaveText("135");
    await expect(ui.stMax(page)).toHaveText("150");
  });

  test("TC-CHART-04 สกุลต้นทางและปลายทางเหมือนกัน", async ({ page }) => {
    await ui.to(page).selectOption("USD");
    await expect(ui.chartMsg(page)).toContainText("เลือกสองสกุลที่ต่างกัน");
    await expect(ui.chartSvg(page)).toHaveCount(0);
  });

  test("TC-CHART-05 ผู้ให้บริการไม่มีข้อมูลย้อนหลังของสกุลนั้น", async ({ page }) => {
    await ui.to(page).selectOption("VND"); // mock ไม่มี VND → 404
    await expect(ui.chartMsg(page)).toContainText("ไม่มีข้อมูลย้อนหลัง");
    await expect(ui.chartSvg(page)).toHaveCount(0);
    await ui.to(page).selectOption("EUR"); // กลับมาใช้ได้
    await expect(ui.chartSvg(page)).toHaveAttribute("data-points", "31");
  });
});

test("TC-CHART-06 โหลดข้อมูลย้อนหลังไม่ได้ ไม่กระทบตัวแปลงหลัก", async ({ page }) => {
  const mock = await mockApi(page);
  mock.historyMode = "abort";
  await openApp(page);
  await expect(ui.chartMsg(page)).toContainText("ไม่มีข้อมูลย้อนหลัง");
  await expect(ui.result(page)).toHaveText("35,000 THB");
  await expect(ui.status(page)).toHaveClass(/live/);
});
