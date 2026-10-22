import { test, expect } from "@playwright/test";
import { openApp, ui } from "./helpers";

const numericResult = /^[\d,.]+ [A-Z]{3}$/;

test("LIVE-API-01 เปิดแอปและรับสถานะ Live", async ({ page }) => {
  await openApp(page);
  await expect(ui.status(page)).toHaveClass(/live/);
  await expect(ui.rateline(page)).toContainText("USD");
  await expect(ui.rateline(page)).toContainText("THB");
  await expect(ui.result(page)).not.toHaveText("—");
});

test("LIVE-API-02 API ตอบกลับด้วยข้อมูลอัตราที่มีโครงสร้างถูกต้อง", async ({ page }) => {
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("open.er-api.com") && response.request().method() === "GET",
  );
  await page.goto("/");
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.rates).toBeDefined();
  expect(Number.isFinite(body.rates.USD)).toBeTruthy();
  expect(Number.isFinite(body.rates.THB)).toBeTruthy();
  expect(body.rates.USD).toBeGreaterThan(0);
  expect(body.rates.THB).toBeGreaterThan(0);
});

test("LIVE-CONV-01 แปลง USD เป็น THB ด้วยเรตจริง", async ({ page }) => {
  await openApp(page);
  await ui.amount(page).fill("1000");
  await expect(ui.result(page)).toHaveText(/^[\d,.]+ THB$/);
  await expect(ui.rateline(page)).toContainText("USD");
  await expect(ui.rateline(page)).toContainText("THB");
});

test("LIVE-CONV-02 ผลลัพธ์เปลี่ยนตามจำนวนเงินและรักษาสัดส่วน", async ({ page }) => {
  await openApp(page);
  await ui.amount(page).fill("1");
  const oneText = await ui.result(page).textContent();
  const one = Number((oneText ?? "").replace(/[^\d.]/g, ""));
  await ui.amount(page).fill("2");
  const twoText = await ui.result(page).textContent();
  const two = Number((twoText ?? "").replace(/[^\d.]/g, ""));
  expect(one).toBeGreaterThan(0);
  expect(two).toBeGreaterThan(0);
  expect(two).toBeCloseTo(one * 2, 2);
});

test("LIVE-CONV-03 เปลี่ยนสกุลเงินปลายทางเป็น JPY", async ({ page }) => {
  await openApp(page);
  await ui.amount(page).fill("2");
  await ui.to(page).selectOption("JPY");
  await expect(ui.result(page)).toHaveText(/^[\d,.]+ JPY$/);
  await expect(ui.rateline(page)).toContainText("USD");
  await expect(ui.rateline(page)).toContainText("JPY");
});

test("LIVE-CONV-04 สลับสกุลเงินต้นทางและปลายทาง", async ({ page }) => {
  await openAppAtPair(page, "USD", "JPY");
  await ui.amount(page).fill("2");
  await ui.swap(page).click();
  await expect(ui.from(page)).toHaveValue("JPY");
  await expect(ui.to(page)).toHaveValue("USD");
  await expect(ui.result(page)).toHaveText(/^[\d,.]+ USD$/);
  await expect(ui.rateline(page)).toContainText("JPY");
  await expect(ui.rateline(page)).toContainText("USD");
});

test("LIVE-CONV-05 สกุลเงินต้นทางและปลายทางเป็นสกุลเดียวกัน", async ({ page }) => {
  await openApp(page);
  await ui.amount(page).fill("2");
  await ui.from(page).selectOption("EUR");
  await ui.to(page).selectOption("EUR");
  await expect(ui.result(page)).toHaveText("2 EUR");
});

test("LIVE-DATA-01 กด Refresh แล้วเรียก API ใหม่", async ({ page }) => {
  await openApp(page);
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("open.er-api.com") && response.request().method() === "GET",
  );
  await ui.refresh(page).click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  await expect(ui.refresh(page)).toBeEnabled();
  await expect(ui.result(page)).toHaveText(numericResult);
});

test("LIVE-DATA-02 รีโหลดหน้าแล้วดึงข้อมูลได้อีกครั้ง", async ({ page }) => {
  await openApp(page);
  await page.reload();
  await expect(ui.status(page)).toHaveClass(/live/);
  await expect(ui.result(page)).toHaveText(numericResult);
  await expect(ui.rateline(page)).toContainText("USD");
});

test("LIVE-HISTORY-01 โหลดข้อมูลกราฟย้อนหลังจาก API จริง", async ({ page }) => {
  await openApp(page);
  await ui.rangeBtn(page, 7).click();
  await expect(ui.chartTitle(page)).toContainText("USD");
  const hasChart = await ui.chartSvg(page).isVisible().catch(() => false);
  const hasMessage = await ui.chartMsg(page).isVisible().catch(() => false);
  expect(hasChart || hasMessage).toBeTruthy();
  if (hasChart) {
    await expect(ui.stLatest(page)).not.toContainText("NaN");
  } else {
    await expect(ui.chartMsg(page)).not.toContainText("NaN");
  }
});

test("LIVE-ROBUST-01 API ตอบสนองช้าแต่หน้าไม่ค้างถาวร", async ({ page }) => {
  await page.route("https://open.er-api.com/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await openApp(page);
  await expect(ui.refresh(page)).toBeEnabled();
  await ui.refresh(page).click();
  await expect(ui.refresh(page)).toBeEnabled({ timeout: 10_000 });
  await expect(ui.result(page)).toHaveText(numericResult);
});

async function openAppAtPair(page: Parameters<typeof openApp>[0], from: string, to: string): Promise<void> {
  await page.goto(`/?from=${from}&to=${to}`);
  await expect(ui.status(page)).toContainText(/● (สด|Live)/);
}
