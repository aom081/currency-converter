import type { AlertDir } from "./types";

export const alertKey = (code: string, base: string): string => `${code}/${base}`;

/** ถึงเป้าหมายหรือยัง (เท่ากับถือว่าถึง) */
export function isTriggered(dir: AlertDir, rate: number, target: number): boolean {
  return dir === "above" ? rate >= target : rate <= target;
}

/** แปลงข้อความที่กรอกเป็นราคาเป้าหมาย คืน null ถ้าไม่ถูกต้อง (ว่าง, ไม่ใช่ตัวเลข, ≤ 0) */
export function parseTarget(raw: string): number | null {
  const n = parseFloat(raw);
  return isFinite(n) && n > 0 ? n : null;
}
