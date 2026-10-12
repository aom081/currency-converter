import { expect, type Page } from "@playwright/test";

/** อัตราตัวอย่างสำหรับทดสอบ (ต่อ 1 USD) — ค่าคงที่เพื่อให้ผลลัพธ์คำนวณได้แน่นอน */
export const BASE_RATES: Record<string, number> = { USD: 1, THB: 35, JPY: 150, EUR: 0.9, GBP: 0.8 };

export type MockMode = "ok" | "http500" | "abort" | "norates";

export interface Mock {
  rates: Record<string, number>;
  mode: MockMode;
  hits: number;
}

/** ดักการเรียก API อัตราแลกเปลี่ยน แล้วตอบด้วยข้อมูลที่ควบคุมได้ */
export async function mockApi(page: Page, mode: MockMode = "ok"): Promise<Mock> {
  const mock: Mock = { rates: { ...BASE_RATES }, mode, hits: 0 };
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };

  await page.route("https://open.er-api.com/**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: cors });
    }
    mock.hits++;
    switch (mock.mode) {
      case "abort":
        return route.abort();
      case "http500":
        return route.fulfill({ status: 500, headers: cors, body: "error" });
      case "norates":
        return route.fulfill({ status: 200, headers: cors, json: { result: "error" } });
      default:
        return route.fulfill({ status: 200, headers: cors, json: { result: "success", rates: mock.rates } });
    }
  });
  return mock;
}

export const ui = {
  amount: (p: Page) => p.locator("#amt"),
  from: (p: Page) => p.locator("#from"),
  to: (p: Page) => p.locator("#to"),
  base: (p: Page) => p.locator("#base"),
  swap: (p: Page) => p.locator("#swap"),
  refresh: (p: Page) => p.locator("#refresh"),
  result: (p: Page) => p.locator("#result"),
  rateline: (p: Page) => p.locator("#rateline"),
  status: (p: Page) => p.locator("#status"),
  search: (p: Page) => p.locator("#q"),
  allItems: (p: Page) => p.locator("#all .item"),
  listStar: (p: Page, code: string) => p.locator(`#all [data-star="${code}"]`),
  cardStar: (p: Page, code: string) => p.locator(`#watch [data-star="${code}"]`),
  cards: (p: Page) => p.locator("#watch .w"),
  cardRate: (p: Page) => p.locator("#watch .w .rate"),
  deltaLast: (p: Page) => p.locator("#watch .chg span").nth(0),
  deltaSince: (p: Page) => p.locator("#watch .chg span").nth(1),
};

/** เปิดหน้าเว็บและรอจนได้ข้อมูลสด */
export async function openApp(page: Page): Promise<void> {
  await page.goto("/");
  await expect(ui.status(page)).toContainText("● สด");
}

/** เปิดหน้าเว็บโดยไม่รอข้อมูลสด (ใช้กับกรณีออฟไลน์) */
export async function openAppOffline(page: Page): Promise<void> {
  await page.goto("/");
  await expect(ui.status(page)).toContainText("ออฟไลน์");
}
