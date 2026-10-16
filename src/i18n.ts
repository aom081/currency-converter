import { load, save } from "./storage";

export type Lang = "th" | "en";

const DICT: Record<Lang, Record<string, string>> = {
  th: {
    "app.title": "เครื่องคำนวณค่าเงิน",
    "app.h1": "💱 เครื่องคำนวณค่าเงิน",
    "status.loading": "กำลังโหลด…",
    "status.live": "● สด · อัปเดต {time}",
    "status.offlineSample": "ออฟไลน์ · ใช้ข้อมูลตัวอย่างโดยประมาณ",
    "status.offlineSaved": "ออฟไลน์ · ใช้ข้อมูลที่บันทึกไว้ ({time})",
    "theme.label": "ธีม",
    "theme.light": "สว่าง",
    "theme.dark": "มืด",
    "theme.auto": "ตามระบบ",
    "lang.label": "ภาษา",
    refresh: "รีเฟรช",
    "conv.amount": "จำนวนเงิน",
    "conv.from": "จากสกุล",
    "conv.to": "เป็นสกุล",
    "conv.swap": "สลับสกุล",
    "share.btn": "🔗 แชร์ลิงก์",
    "share.label": "ลิงก์ที่แชร์ (คัดลอกได้เลย)",
    "share.copied": "คัดลอกลิงก์แล้ว",
    "share.copyFail": "คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกจากช่องลิงก์",
    "shop.title": "🏦 เทียบกับเรทร้านแลกเงิน / ธนาคาร",
    "shop.rate": "เรทที่ร้านให้ (1 {from} = ? {to})",
    "shop.feePct": "ค่าธรรมเนียม (%)",
    "shop.feeFixed": "ค่าธรรมเนียมคงที่ ({from})",
    "shop.hint": "กรอกเรทที่ร้านให้ เพื่อเทียบกับเรทกลาง",
    "shop.market": "ตามเรทกลาง",
    "shop.result": "ที่ร้านให้ (หลังหักค่าธรรมเนียม)",
    "shop.diff": "ส่วนต่าง",
    "shop.worse": "ร้านให้น้อยกว่าเรทกลาง",
    "shop.better": "ร้านให้มากกว่าเรทกลาง",
    "shop.same": "เท่ากับเรทกลาง",
    "multi.title": "🌍 แปลงเป็นหลายสกุลพร้อมกัน",
    "multi.head": "จาก {amount} {from}",
    "multi.empty": "ติดตามสกุลเงิน (กดดาว ☆ ในรายการด้านล่าง) เพื่อดูการแปลงเป็นหลายสกุลพร้อมกัน",
    "watch.title": "⭐ รายการที่ติดตาม",
    "watch.base": "เทียบกับสกุล",
    "watch.sort": "เรียงลำดับ",
    "sort.manual": "กำหนดเอง (ตามที่เพิ่ม)",
    "sort.gain": "แข็งค่าขึ้นมากสุดก่อน",
    "sort.loss": "อ่อนค่าลงมากสุดก่อน",
    "sort.code": "รหัสสกุล A→Z",
    "watch.exportCsv": "⬇️ ส่งออก CSV",
    "watch.note":
      '"ล่าสุด" เทียบกับการอัปเดตก่อนหน้า ส่วน "ตั้งแต่ติดตาม" เทียบกับตอนที่กดดาว ระบบอัปเดตอัตโนมัติทุก 60 วินาที · การแจ้งเตือนราคาเป้าหมายทำงานเฉพาะตอนเปิดหน้านี้ไว้ และเช็กจากข้อมูลสดเท่านั้น',
    "watch.empty": "ยังไม่มีสกุลเงินที่ติดตาม — กดดาว ☆ ในรายการด้านล่างเพื่อเริ่มติดตาม",
    "watch.onlyBase": "เลือกสกุลอื่นที่ไม่ใช่สกุลฐานเพื่อเปรียบเทียบ",
    "watch.last": "ล่าสุด",
    "watch.since": "ตั้งแต่ติดตาม",
    "watch.unstar": "เลิกติดตาม",
    "watch.star": "ติดตาม",
    "watch.up": "เลื่อนขึ้น",
    "watch.down": "เลื่อนลง",
    "alert.condition": "เงื่อนไข",
    "alert.dirBelow": "ต่ำกว่าหรือเท่ากับ",
    "alert.dirAbove": "สูงกว่าหรือเท่ากับ",
    "alert.targetAria": "ราคาเป้าหมาย",
    "alert.placeholder": "1 {code} = ? {base}",
    "alert.set": "🔔 ตั้งแจ้งเตือน",
    "alert.clear": "ลบ",
    "alert.hit": " · ✅ ถึงเป้าหมายแล้ว",
    "alert.err": "กรุณากรอกราคาเป้าหมายที่มากกว่า 0",
    "alert.above": "สูงกว่า",
    "alert.below": "ต่ำกว่า",
    "toast.alert": "{pair} {dir}เป้าหมาย {target} แล้ว (ตอนนี้ {now})",
    "toast.close": "ปิด",
    "notify.title": "แจ้งเตือนอัตราแลกเปลี่ยน",
    "chart.title": "📈 กราฟย้อนหลัง",
    "chart.range": "ช่วงเวลา",
    "chart.d7": "7 วัน",
    "chart.d30": "30 วัน",
    "chart.d90": "90 วัน",
    "chart.latest": "ล่าสุด",
    "chart.min": "ต่ำสุด",
    "chart.max": "สูงสุด",
    "chart.chg": "เปลี่ยนแปลง",
    "chart.note": "แสดงตามสกุลต้นทางและปลายทางที่เลือกในตัวแปลงด้านบน",
    "chart.same": "เลือกสองสกุลที่ต่างกันเพื่อดูกราฟ",
    "chart.loading": "กำลังโหลดกราฟ…",
    "chart.none": "ไม่มีข้อมูลย้อนหลังของคู่เงินนี้ในขณะนี้",
    "chart.aria": "กราฟอัตราแลกเปลี่ยนย้อนหลัง",
    "chart.export": "⬇️ ส่งออก CSV",
    "all.title": "สกุลเงินทั้งหมด",
    "all.search": "ค้นหา เช่น JPY, ดอลลาร์, ยูโร",
    "all.empty": "ไม่พบสกุลเงิน",
  },
  en: {
    "app.title": "Currency Converter",
    "app.h1": "💱 Currency Converter",
    "status.loading": "Loading…",
    "status.live": "● Live · updated {time}",
    "status.offlineSample": "Offline · using approximate sample rates",
    "status.offlineSaved": "Offline · using saved rates ({time})",
    "theme.label": "Theme",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.auto": "System",
    "lang.label": "Language",
    refresh: "Refresh",
    "conv.amount": "Amount",
    "conv.from": "From",
    "conv.to": "To",
    "conv.swap": "Swap currencies",
    "share.btn": "🔗 Share link",
    "share.label": "Shareable link (copy it)",
    "share.copied": "Link copied",
    "share.copyFail": "Couldn't copy automatically — copy it from the link box",
    "shop.title": "🏦 Compare with a money changer / bank",
    "shop.rate": "Shop rate (1 {from} = ? {to})",
    "shop.feePct": "Fee (%)",
    "shop.feeFixed": "Fixed fee ({from})",
    "shop.hint": "Enter the shop's rate to compare it with the market rate",
    "shop.market": "At market rate",
    "shop.result": "From the shop (after fees)",
    "shop.diff": "Difference",
    "shop.worse": "The shop gives you less than the market rate",
    "shop.better": "The shop gives you more than the market rate",
    "shop.same": "Same as the market rate",
    "multi.title": "🌍 Convert to several currencies",
    "multi.head": "From {amount} {from}",
    "multi.empty": "Watch some currencies (tap ☆ in the list below) to see them converted here",
    "watch.title": "⭐ Watchlist",
    "watch.base": "Compare against",
    "watch.sort": "Sort",
    "sort.manual": "Manual (as added)",
    "sort.gain": "Biggest gain first",
    "sort.loss": "Biggest loss first",
    "sort.code": "Code A→Z",
    "watch.exportCsv": "⬇️ Export CSV",
    "watch.note":
      '"Last" compares with the previous update; "Since watching" compares with when you tapped the star. Rates refresh every 60 seconds · Price alerts only work while this page is open and only use live data.',
    "watch.empty": "No currencies are being watched yet — tap ☆ in the list below to start",
    "watch.onlyBase": "Pick a currency other than the base to compare",
    "watch.last": "Last",
    "watch.since": "Since watching",
    "watch.unstar": "Stop watching",
    "watch.star": "Watch",
    "watch.up": "Move up",
    "watch.down": "Move down",
    "alert.condition": "Condition",
    "alert.dirBelow": "At or below",
    "alert.dirAbove": "At or above",
    "alert.targetAria": "Target price",
    "alert.placeholder": "1 {code} = ? {base}",
    "alert.set": "🔔 Set alert",
    "alert.clear": "Remove",
    "alert.hit": " · ✅ Target reached",
    "alert.err": "Please enter a target price greater than 0",
    "alert.above": "above",
    "alert.below": "below",
    "toast.alert": "{pair} {dir} target {target} reached (now {now})",
    "toast.close": "Close",
    "notify.title": "Exchange rate alert",
    "chart.title": "📈 History chart",
    "chart.range": "Range",
    "chart.d7": "7 days",
    "chart.d30": "30 days",
    "chart.d90": "90 days",
    "chart.latest": "Latest",
    "chart.min": "Lowest",
    "chart.max": "Highest",
    "chart.chg": "Change",
    "chart.note": "Follows the from/to currencies selected in the converter above",
    "chart.same": "Pick two different currencies to see the chart",
    "chart.loading": "Loading chart…",
    "chart.none": "No history is available for this pair right now",
    "chart.aria": "Exchange rate history chart",
    "chart.export": "⬇️ Export CSV",
    "all.title": "All currencies",
    "all.search": "Search, e.g. JPY, dollar, euro",
    "all.empty": "No currencies found",
  },
};

function loadLang(): Lang {
  return load<string>("cw_lang", "th") === "en" ? "en" : "th";
}

let lang: Lang = loadLang();
document.documentElement.lang = lang;

export const getLang = (): Lang => lang;
export const locale = (): string => (lang === "th" ? "th-TH" : "en-US");

export function setLang(next: Lang): void {
  lang = next;
  save("cw_lang", next);
  document.documentElement.lang = next;
}

/** แปลข้อความ: ใส่ {ชื่อ} ในข้อความแล้วส่งค่าผ่าน vars */
export function t(key: string, vars: Record<string, string | number> = {}): string {
  const s = DICT[lang][key] ?? DICT.th[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** แปลข้อความคงที่ในหน้า: data-i18n (ข้อความ), -ph (placeholder), -title, -aria */
export function applyStaticText(): void {
  document.title = t("app.title");
  const each = (attr: string, fn: (node: HTMLElement, text: string) => void) =>
    document.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((n) => fn(n, t(n.getAttribute(attr) ?? "")));
  each("data-i18n", (n, s) => (n.textContent = s));
  each("data-i18n-ph", (n, s) => n.setAttribute("placeholder", s));
  each("data-i18n-title", (n, s) => n.setAttribute("title", s));
  each("data-i18n-aria", (n, s) => n.setAttribute("aria-label", s));
  document.querySelectorAll<HTMLElement>("[data-lang-set]").forEach((b) => {
    const on = b.dataset.langSet === lang;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
