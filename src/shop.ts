export interface ShopResult {
  /** แลกตามเรทกลาง */
  market: number;
  /** แลกที่ร้าน หลังหักค่าธรรมเนียม */
  shop: number;
  /** shop − market (ติดลบ = ได้น้อยกว่าเรทกลาง) */
  diff: number;
  diffPct: number;
}

/**
 * เทียบการแลกที่ร้านกับเรทกลาง
 * shop = (จำนวนเงิน − ค่าธรรมเนียมคงที่) × เรทร้าน × (1 − ค่าธรรมเนียม%/100)
 */
export function compareShop(
  amount: number,
  marketRate: number,
  shopRate: number,
  feePct: number,
  feeFixed: number,
): ShopResult {
  const market = amount * marketRate;
  const shop = Math.max(0, amount - feeFixed) * shopRate * (1 - feePct / 100);
  const raw = shop - market;
  const diff = Math.abs(raw) < 1e-9 ? 0 : raw;
  return { market, shop, diff, diffPct: market ? (diff / market) * 100 : 0 };
}
