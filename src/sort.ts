export type SortMode = "manual" | "gain" | "loss" | "code";

export const SORT_MODES: SortMode[] = ["manual", "gain", "loss", "code"];

/** ลำดับ "กำหนดเอง": ตามรายการ order ก่อน แล้วตามด้วยสกุลที่ยังไม่อยู่ใน order */
export function manualOrder(codes: string[], order: string[]): string[] {
  return [...order.filter((c) => codes.includes(c)), ...codes.filter((c) => !order.includes(c))];
}

/** เรียงสกุลที่ติดตาม (gain/loss เรียงตาม % ตั้งแต่ติดตาม, เท่ากันให้ใช้ลำดับกำหนดเอง) */
export function sortCodes(
  codes: string[],
  mode: SortMode,
  order: string[],
  since: (code: string) => number,
): string[] {
  const manual = manualOrder(codes, order);
  const idx = (c: string) => manual.indexOf(c);
  switch (mode) {
    case "gain":
      return [...manual].sort((a, b) => since(b) - since(a) || idx(a) - idx(b));
    case "loss":
      return [...manual].sort((a, b) => since(a) - since(b) || idx(a) - idx(b));
    case "code":
      return [...manual].sort((a, b) => a.localeCompare(b));
    default:
      return manual;
  }
}
