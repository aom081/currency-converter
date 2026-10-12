import type { Rates } from "./types";

/** ตั้งค่า VITE_RATES_URL เพื่อชี้ไป mock server ตอนทดสอบ */
const RATES_URL: string =
  import.meta.env.VITE_RATES_URL ?? "https://open.er-api.com/v6/latest/USD";

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
