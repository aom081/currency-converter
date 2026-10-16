import { expect, type Page } from "@playwright/test";

/** อัตราตัวอย่างสำหรับทดสอบ (ต่อ 1 USD) — ค่าคงที่เพื่อให้ผลลัพธ์คำนวณได้แน่นอน */
export const BASE_RATES: Record<string, number> = { USD: 1, THB: 35, JPY: 150, EUR: 0.9, GBP: 0.8 };

export type MockMode = "ok" | "http500" | "abort" | "norates";

export interface Mock {
  rates: Record<string, number>;
  mode: MockMode;
  hits: number;
  /** โหมดของ API ย้อนหลัง: ok | abort (เครือข่ายล่ม) */
  historyMode: "ok" | "abort";
  historyHits: number;
}

/**
 * อัตราย้อนหลังจำลอง: วันที่ i จาก n วัน = p * (0.9 + 0.1 * i/(n-1))
 * (ต้นช่วง = 0.9p, ปลายช่วง = p) — ต้องตรงกับ mock ใน tests/robot/libs/AppServers.py
 */
export function historyBody(rates: Record<string, number>, base: string, sym: string, start: string, end: string) {
  const p = rates[sym] / rates[base];
  const s = new Date(`${start}T00:00:00Z`);
  const n = Math.round((new Date(`${end}T00:00:00Z`).getTime() - s.getTime()) / 86_400_000) + 1;
  const series: Record<string, Record<string, number>> = {};
  for (let i = 0; i < n; i++) {
    const d = new Date(s.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    series[d] = { [sym]: Math.round(p * (0.9 + (0.1 * i) / (n - 1)) * 1e6) / 1e6 };
  }
  return { amount: 1, base, start_date: start, end_date: end, rates: series };
}

/** ดักการเรียก API อัตราแลกเปลี่ยน แล้วตอบด้วยข้อมูลที่ควบคุมได้ */
export async function mockApi(page: Page, mode: MockMode = "ok"): Promise<Mock> {
  const mock: Mock = { rates: { ...BASE_RATES }, mode, hits: 0, historyMode: "ok", historyHits: 0 };
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

  // API ย้อนหลัง (Frankfurter): /v1/<start>..<end>?base=X&symbols=Y
  await page.route("https://api.frankfurter.dev/**", async (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    mock.historyHits++;
    if (mock.historyMode === "abort") return route.abort();
    const url = new URL(route.request().url());
    const base = url.searchParams.get("base") ?? "USD";
    const sym = url.searchParams.get("symbols") ?? "";
    const [start, end] = (url.pathname.split("/").pop() ?? "").split("..");
    if (!(base in mock.rates) || !(sym in mock.rates)) {
      return route.fulfill({ status: 404, headers: cors, json: { message: "not found" } });
    }
    return route.fulfill({ status: 200, headers: cors, json: historyBody(mock.rates, base, sym, start, end) });
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
  // ธีม
  themeBtn: (p: Page, mode: "light" | "dark" | "auto") => p.locator(`[data-theme-set="${mode}"]`),
  // แจ้งเตือน
  alertDir: (p: Page, code: string) => p.locator(`[data-al-dir="${code}"]`),
  alertTarget: (p: Page, code: string) => p.locator(`[data-al-target="${code}"]`),
  alertSet: (p: Page, code: string) => p.locator(`[data-al-set="${code}"]`),
  alertClear: (p: Page, code: string) => p.locator(`[data-al-clear="${code}"]`),
  alertErr: (p: Page, code: string) => p.locator(`[data-al-err="${code}"]`),
  alertState: (p: Page) => p.locator("#watch .al-state"),
  toasts: (p: Page) => p.locator("#toasts .toast"),
  // กราฟ
  chartTitle: (p: Page) => p.locator("#chart-title"),
  chartMsg: (p: Page) => p.locator("#chart-msg"),
  chartSvg: (p: Page) => p.locator("#chart-svg svg.chart"),
  rangeBtn: (p: Page, days: 7 | 30 | 90) => p.locator(`#chart-range [data-range="${days}"]`),
  stLatest: (p: Page) => p.locator("#st-latest"),
  stMin: (p: Page) => p.locator("#st-min"),
  stMax: (p: Page) => p.locator("#st-max"),
  stChg: (p: Page) => p.locator("#st-chg"),
  // ภาษา
  langBtn: (p: Page, lang: "th" | "en") => p.locator(`[data-lang-set="${lang}"]`),
  h1: (p: Page) => p.locator("h1"),
  // เทียบเรทร้าน
  shopRate: (p: Page) => p.locator("#shop-rate"),
  shopFeePct: (p: Page) => p.locator("#shop-fee-pct"),
  shopFeeFixed: (p: Page) => p.locator("#shop-fee-fixed"),
  shopHint: (p: Page) => p.locator("#shop-hint"),
  shopOut: (p: Page) => p.locator("#shop-out"),
  shopMarket: (p: Page) => p.locator("#shop-market"),
  shopResult: (p: Page) => p.locator("#shop-result"),
  shopDiff: (p: Page) => p.locator("#shop-diff"),
  shopVerdict: (p: Page) => p.locator("#shop-verdict"),
  shopRateLabel: (p: Page) => p.locator("#shop-rate-label"),
  shopFixedLabel: (p: Page) => p.locator("#shop-fixed-label"),
  // แชร์ลิงก์
  shareBtn: (p: Page) => p.locator("#share"),
  shareRow: (p: Page) => p.locator("#share-row"),
  shareUrl: (p: Page) => p.locator("#share-url"),
  // เรียงลำดับ / ส่งออก
  sortSelect: (p: Page) => p.locator("#watch-sort"),
  cardCodes: (p: Page) => p.locator("#watch .w .code"),
  moveUp: (p: Page, code: string) => p.locator(`[data-move-up="${code}"]`),
  moveDown: (p: Page, code: string) => p.locator(`[data-move-down="${code}"]`),
  exportChart: (p: Page) => p.locator("#export-chart"),
  exportWatch: (p: Page) => p.locator("#export-watch"),
  // แปลงหลายสกุล
  multiHead: (p: Page) => p.locator("#multi-head"),
  multiRows: (p: Page) => p.locator("#multi .mrow"),
  multiVal: (p: Page, code: string) => p.locator(`[data-multi="${code}"] .mval`),
};

/** ตั้งการแจ้งเตือนในการ์ดของสกุล `code` (เป้าหมายคิดเป็นสกุลฐาน) */
export async function setAlert(page: Page, code: string, dir: "above" | "below", target: string): Promise<void> {
  await ui.alertDir(page, code).selectOption(dir);
  await ui.alertTarget(page, code).fill(target);
  await ui.alertSet(page, code).click();
}

/** กดรีเฟรชและรอจนแอปเรียก API ครบรอบ (ปุ่มกลับมาใช้ได้) */
export async function refreshAndWait(page: Page, mock: Mock): Promise<void> {
  const before = mock.hits;
  await ui.refresh(page).click();
  await expect.poll(() => mock.hits).toBeGreaterThan(before);
  await expect(ui.refresh(page)).toBeEnabled();
}

/** เปิดหน้าเว็บและรอจนได้ข้อมูลสด */
export async function openApp(page: Page): Promise<void> {
  await page.goto("/");
  await expect(ui.status(page)).toContainText("● สด");
}

/** เปิดหน้าเว็บที่ path/query ที่กำหนด (เช่น "/?amt=250&from=EUR&to=JPY") แล้วรอข้อมูลสด */
export async function openAppAt(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(ui.status(page)).toContainText(/● (สด|Live)/);
}

/** เปิดหน้าเว็บโดยไม่รอข้อมูลสด (ใช้กับกรณีออฟไลน์) */
export async function openAppOffline(page: Page): Promise<void> {
  await page.goto("/");
  await expect(ui.status(page)).toContainText("ออฟไลน์");
}
