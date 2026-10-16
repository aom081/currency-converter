/** [ชื่อไทย, อัตราตัวอย่างต่อ 1 USD (ใช้เมื่อดึงข้อมูลสดไม่ได้)] */
export const CURRENCIES: Record<string, [string, number]> = {
  USD: ["ดอลลาร์สหรัฐ", 1],
  THB: ["บาทไทย", 33.5],
  EUR: ["ยูโร", 0.92],
  JPY: ["เยนญี่ปุ่น", 150],
  GBP: ["ปอนด์สเตอร์ลิง", 0.78],
  CNY: ["หยวนจีน", 7.2],
  KRW: ["วอนเกาหลีใต้", 1350],
  SGD: ["ดอลลาร์สิงคโปร์", 1.33],
  HKD: ["ดอลลาร์ฮ่องกง", 7.8],
  TWD: ["ดอลลาร์ไต้หวัน", 31.5],
  MYR: ["ริงกิตมาเลเซีย", 4.5],
  IDR: ["รูเปียห์อินโดนีเซีย", 16000],
  VND: ["ดองเวียดนาม", 25000],
  PHP: ["เปโซฟิลิปปินส์", 57],
  INR: ["รูปีอินเดีย", 84],
  AUD: ["ดอลลาร์ออสเตรเลีย", 1.52],
  NZD: ["ดอลลาร์นิวซีแลนด์", 1.66],
  CAD: ["ดอลลาร์แคนาดา", 1.37],
  CHF: ["ฟรังก์สวิส", 0.87],
  SEK: ["โครนาสวีเดน", 10.4],
  NOK: ["โครนนอร์เวย์", 10.7],
  DKK: ["โครนเดนมาร์ก", 6.9],
  AED: ["ดีแรห์มสหรัฐอาหรับเอมิเรตส์", 3.67],
  SAR: ["ริยัลซาอุดีอาระเบีย", 3.75],
  TRY: ["ลีราตุรกี", 34],
  BRL: ["เรอัลบราซิล", 5.5],
  MXN: ["เปโซเม็กซิโก", 19.5],
  ZAR: ["แรนด์แอฟริกาใต้", 18],
  RUB: ["รูเบิลรัสเซีย", 92],
  PLN: ["ซลอตีโปแลนด์", 4],
  LAK: ["กีบลาว", 21500],
  KHR: ["เรียลกัมพูชา", 4100],
  MMK: ["จ๊าตเมียนมา", 2100],
};

export const CODES = Object.keys(CURRENCIES);

const displayNames: Record<string, Intl.DisplayNames | null> = {};

/** ชื่อสกุลเงินจากระบบของเบราว์เซอร์ (ใช้กับสกุลที่ไม่อยู่ในรายการหลัก) */
function displayName(code: string, lang: string): string {
  try {
    displayNames[lang] ??= new Intl.DisplayNames([lang], { type: "currency" });
    return displayNames[lang]?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** ชื่อสกุลเงิน: ภาษาไทยใช้ชื่อที่ตั้งไว้ก่อน ส่วนภาษาอังกฤษและสกุลอื่นใช้ Intl.DisplayNames */
export const nameOf = (code: string, lang = "th"): string =>
  lang === "th" ? (CURRENCIES[code]?.[0] ?? displayName(code, "th")) : displayName(code, "en");

/** สกุลทั้งหมดที่รู้จัก: รายการหลัก (ตามลำดับเดิม) ตามด้วยสกุลอื่นที่ API ส่งมา (เรียงตามตัวอักษร) */
export function allCodes(rates: Record<string, number>, extra: string[] = []): string[] {
  const rest = [...Object.keys(rates), ...extra]
    .filter((c) => /^[A-Z]{3}$/.test(c) && !(c in CURRENCIES))
    .sort();
  return [...CODES, ...new Set(rest)];
}

export const fallbackRates = (): Record<string, number> =>
  Object.fromEntries(CODES.map((c) => [c, CURRENCIES[c][1]]));
