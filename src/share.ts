export interface ShareParams {
  amt?: string;
  from?: string;
  to?: string;
  lang?: "th" | "en";
}

/** สร้าง query สำหรับลิงก์แชร์ (ลำดับคงที่: amt, from, to, lang) */
export function buildQuery(p: { amt: string; from: string; to: string; lang: string }): string {
  return new URLSearchParams({ amt: p.amt, from: p.from, to: p.to, lang: p.lang }).toString();
}

/** อ่านพารามิเตอร์จาก URL โดยข้ามค่าที่ไม่ถูกต้อง */
export function parseShareParams(search: string): ShareParams {
  const q = new URLSearchParams(search);
  const out: ShareParams = {};
  const amt = q.get("amt");
  if (amt !== null && amt.trim() !== "" && isFinite(Number(amt)) && Number(amt) >= 0) out.amt = String(Number(amt));
  for (const key of ["from", "to"] as const) {
    const v = (q.get(key) ?? "").toUpperCase();
    if (/^[A-Z]{3}$/.test(v)) out[key] = v;
  }
  const lang = q.get("lang");
  if (lang === "th" || lang === "en") out.lang = lang;
  return out;
}
