import type { HistoryPoint, Rates } from "./types";

/** ตั้งค่า VITE_RATES_URL / VITE_HISTORY_URL เพื่อชี้ไป mock server ตอนทดสอบ */
const RATES_URL: string =
  import.meta.env.VITE_RATES_URL ?? "https://open.er-api.com/v6/latest/USD";
const HISTORY_URL: string = import.meta.env.VITE_HISTORY_URL ?? "https://api.frankfurter.dev/v1";

interface ApiResponse {
  result?: string;
  rates?: Rates;
}

/** ดึงอัตราแลกเปลี่ยนล่าสุด (ต่อ 1 USD) */
export async function fetchRates(): Promise<Rates> {
  const res = await fetch(RATES_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ApiResponse;
  if (!data.rates) throw new Error("ไม่พบข้อมูลอัตราแลกเปลี่ยน");
  return data.rates;
}

const ymd = (d: Date): string => d.toISOString().slice(0, 10);

/** ดึงอัตราย้อนหลัง `days` วัน ของ 1 `from` = ? `to` (Frankfurter time series) */
export async function fetchHistory(from: string, to: string, days: number): Promise<HistoryPoint[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const url = `${HISTORY_URL}/${ymd(start)}..${ymd(end)}?base=${from}&symbols=${to}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { rates?: Record<string, Record<string, number>> };
  if (!data.rates) throw new Error("ไม่มีข้อมูลย้อนหลัง");
  const points = Object.entries(data.rates)
    .filter(([, r]) => typeof r[to] === "number")
    .map(([date, r]) => ({ date, value: r[to] }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (points.length < 2) throw new Error("ข้อมูลย้อนหลังไม่พอ");
  return points;
}
