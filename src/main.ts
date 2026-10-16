import "./style.css";
import { CODES, nameOf, fallbackRates } from "./currencies";
import { fetchHistory, fetchRates } from "./api";
import { load, save } from "./storage";
import { applyTheme, loadTheme } from "./theme";
import { alertKey, isTriggered, parseTarget } from "./alerts";
import { chartSvg, summarize } from "./chart";
import type { Alert, AlertDir, HistoryPoint, Prefs, Rates, Snapshot, ThemeMode, WatchMap } from "./types";

const REFRESH_MS = 60_000;
const MAX_HISTORY = 60;

/* ---------- state ---------- */
const state = {
  rates: fallbackRates() as Rates,
  live: false,
  t: 0,
  hist: load<Snapshot[]>("cw_hist", []),
  watch: load<WatchMap>("cw_watch", {}),
  alerts: load<Record<string, Alert>>("cw_alerts", {}),
  alertErrors: {} as Record<string, string>,
  theme: loadTheme() as ThemeMode,
  rangeDays: 30,
  prefs: { from: "USD", to: "THB", base: "THB", ...load<Partial<Prefs>>("cw_prefs", {}) } as Prefs,
};

/* ---------- dom ---------- */
function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
}
const amt = el<HTMLInputElement>("amt");
const selFrom = el<HTMLSelectElement>("from");
const selTo = el<HTMLSelectElement>("to");
const selBase = el<HTMLSelectElement>("base");
const search = el<HTMLInputElement>("q");
const btnRefresh = el<HTMLButtonElement>("refresh");

/* ---------- helpers ---------- */
/** 1 a = ? b */
const pair = (r: Rates, a: string, b: string): number => r[b] / r[a];
const pctChange = (now: number, old: number): number => (old ? ((now - old) / old) * 100 : 0);
const cls = (p: number) => (Math.abs(p) < 0.0005 ? "flat" : p > 0 ? "up" : "down");
const arrow = (p: number) => (Math.abs(p) < 0.0005 ? "•" : p > 0 ? "▲" : "▼");
const pctText = (p: number) => `${p > 0 ? "+" : ""}${p.toFixed(3)}%`;

function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  const a = Math.abs(n);
  const digits = a >= 1000 ? 2 : a >= 1 ? 4 : 6;
  return n.toLocaleString("th-TH", { maximumFractionDigits: digits });
}

function sparkline(values: number[]): string {
  if (values.length < 2) return '<svg class="spark"></svg>';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 32 - ((v - min) / range) * 28;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = values[values.length - 1] >= values[0] ? "var(--up)" : "var(--down)";
  return `<svg class="spark" viewBox="0 0 100 36" preserveAspectRatio="none">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
}

/* ---------- แจ้งเตือน (toast + Notification) ---------- */
function showToast(msg: string): void {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  const text = document.createElement("span");
  text.textContent = msg;
  const x = document.createElement("button");
  x.className = "toast-x";
  x.setAttribute("aria-label", "ปิด");
  x.textContent = "×";
  t.append(text, x);
  el("toasts").append(t);
}

function systemNotify(msg: string): void {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("แจ้งเตือนอัตราแลกเปลี่ยน", { body: msg });
    }
  } catch {
    /* ไม่รองรับ — ใช้ toast อย่างเดียว */
  }
}

function askNotifyPermission(): void {
  try {
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  } catch {
    /* ข้าม */
  }
}

/** เช็กการแจ้งเตือนทุกครั้งที่ได้ข้อมูลสด (ข้อมูลตัวอย่างตอนออฟไลน์ไม่นับ) */
function checkAlerts(): void {
  if (!state.live) return;
  let changed = false;
  for (const a of Object.values(state.alerts)) {
    if (a.triggered) continue;
    const rate = pair(state.rates, a.code, a.base);
    if (!isTriggered(a.dir, rate, a.target)) continue;
    a.triggered = true;
    changed = true;
    const word = a.dir === "above" ? "สูงกว่า" : "ต่ำกว่า";
    const msg = `${a.code}/${a.base} ${word}เป้าหมาย ${fmt(a.target)} แล้ว (ตอนนี้ ${fmt(rate)})`;
    showToast(msg);
    systemNotify(msg);
  }
  if (changed) save("cw_alerts", state.alerts);
}

function setAlert(code: string): void {
  const base = state.prefs.base;
  const input = document.querySelector<HTMLInputElement>(`#watch [data-al-target="${code}"]`);
  const sel = document.querySelector<HTMLSelectElement>(`#watch [data-al-dir="${code}"]`);
  const target = parseTarget(input?.value ?? "");
  if (target === null) {
    state.alertErrors[code] = "กรุณากรอกราคาเป้าหมายที่มากกว่า 0";
    renderWatch();
    return;
  }
  delete state.alertErrors[code];
  const dir: AlertDir = sel?.value === "above" ? "above" : "below";
  state.alerts[alertKey(code, base)] = { code, base, dir, target, triggered: false };
  save("cw_alerts", state.alerts);
  askNotifyPermission();
  checkAlerts();
  renderWatch();
}

function clearAlert(code: string): void {
  delete state.alerts[alertKey(code, state.prefs.base)];
  save("cw_alerts", state.alerts);
  renderWatch();
}

/* ---------- render ---------- */
function fillSelects(): void {
  const options = CODES.map((c) => `<option value="${c}">${c} — ${nameOf(c)}</option>`).join("");
  for (const [sel, key] of [
    [selFrom, "from"],
    [selTo, "to"],
    [selBase, "base"],
  ] as const) {
    sel.innerHTML = options;
    sel.value = state.prefs[key];
  }
}

function renderConvert(): void {
  const { from, to } = state.prefs;
  const rate = pair(state.rates, from, to);
  const value = parseFloat(amt.value) || 0;
  el("result").textContent = `${fmt(value * rate)} ${to}`;
  el("rateline").textContent = `1 ${from} = ${fmt(rate)} ${to}  ·  1 ${to} = ${fmt(1 / rate)} ${from}`;
  renderMulti();
}

function renderMulti(): void {
  const { from } = state.prefs;
  const value = parseFloat(amt.value) || 0;
  el("multi-head").textContent = `จาก ${fmt(value)} ${from}`;
  const codes = Object.keys(state.watch).filter((c) => c !== from);
  el("multi").innerHTML = codes.length
    ? codes
        .map((c) => {
          const r = pair(state.rates, from, c);
          return `<div class="mrow" data-multi="${c}">
            <div><b>${c}</b> <small class="sub">${nameOf(c)}</small></div>
            <div class="mright"><div class="mval">${fmt(value * r)} ${c}</div>
            <small class="sub">1 ${from} = ${fmt(r)} ${c}</small></div></div>`;
        })
        .join("")
    : '<div class="empty">ติดตามสกุลเงิน (กดดาว ☆ ในรายการด้านล่าง) เพื่อดูการแปลงเป็นหลายสกุลพร้อมกัน</div>';
}

function alertBox(code: string, base: string): string {
  const a = state.alerts[alertKey(code, base)];
  if (a) {
    const sym = a.dir === "above" ? "≥" : "≤";
    return `<div class="alert-box" data-alert-for="${code}">
      <span class="al-state ${a.triggered ? "hit" : ""}">🔔 ${sym} ${fmt(a.target)} ${base}${a.triggered ? " · ✅ ถึงเป้าหมายแล้ว" : ""}</span>
      <button class="al-clear" data-al-clear="${code}">ลบ</button></div>`;
  }
  return `<div class="alert-box" data-alert-for="${code}">
    <select class="al-dir" data-al-dir="${code}" aria-label="เงื่อนไข">
      <option value="below">ต่ำกว่าหรือเท่ากับ</option><option value="above">สูงกว่าหรือเท่ากับ</option></select>
    <input class="al-target" data-al-target="${code}" type="number" step="any" min="0" inputmode="decimal"
      placeholder="1 ${code} = ? ${base}" aria-label="ราคาเป้าหมาย">
    <button class="al-set" data-al-set="${code}">🔔 ตั้งแจ้งเตือน</button>
    <div class="al-err" data-al-err="${code}">${state.alertErrors[code] ?? ""}</div></div>`;
}

interface Draft {
  dir: string;
  val: string;
  focus: boolean;
}

/** เก็บค่าที่กำลังพิมพ์ไว้ก่อนวาดการ์ดใหม่ (ไม่งั้นรีเฟรชอัตโนมัติจะล้างช่องกรอก) */
function captureDrafts(): Record<string, Draft> {
  const out: Record<string, Draft> = {};
  document.querySelectorAll<HTMLInputElement>("#watch [data-al-target]").forEach((inp) => {
    const code = inp.dataset.alTarget ?? "";
    const sel = document.querySelector<HTMLSelectElement>(`#watch [data-al-dir="${code}"]`);
    out[code] = { dir: sel?.value ?? "below", val: inp.value, focus: document.activeElement === inp };
  });
  return out;
}

function restoreDrafts(drafts: Record<string, Draft>): void {
  for (const [code, d] of Object.entries(drafts)) {
    const inp = document.querySelector<HTMLInputElement>(`#watch [data-al-target="${code}"]`);
    const sel = document.querySelector<HTMLSelectElement>(`#watch [data-al-dir="${code}"]`);
    if (!inp || !sel) continue;
    inp.value = d.val;
    sel.value = d.dir;
    if (d.focus) inp.focus();
  }
}

function renderWatch(): void {
  const box = el("watch");
  const codes = Object.keys(state.watch);
  if (!codes.length) {
    box.innerHTML =
      '<div class="empty">ยังไม่มีสกุลเงินที่ติดตาม — กดดาว ☆ ในรายการด้านล่างเพื่อเริ่มติดตาม</div>';
    return;
  }
  const drafts = captureDrafts();
  const { base } = state.prefs;
  const h = state.hist;
  const last = h[h.length - 1]?.r ?? state.rates;
  const prev = h.length > 1 ? h[h.length - 2].r : last;

  const cards = codes
    .filter((c) => c !== base)
    .map((c) => {
      const now = pair(state.rates, c, base);
      const dLast = pctChange(pair(last, c, base), pair(prev, c, base));
      const dSince = pctChange(now, pair(state.watch[c].r, c, base));
      const series = h.map((x) => pair(x.r, c, base));
      return `<div class="w">
        <div class="top">
          <span><span class="code">${c}</span> <span class="sub">${nameOf(c)}</span></span>
          <button class="star on" data-star="${c}" title="เลิกติดตาม">★</button>
        </div>
        <div class="rate">${fmt(now)} <span class="sub">${base}</span></div>
        <div class="chg">
          <span class="${cls(dLast)}">${arrow(dLast)} ล่าสุด ${pctText(dLast)}</span>
          <span class="${cls(dSince)}">${arrow(dSince)} ตั้งแต่ติดตาม ${pctText(dSince)}</span>
        </div>
        ${sparkline(series)}
        ${alertBox(c, base)}
      </div>`;
    });
  box.innerHTML =
    cards.join("") || '<div class="empty">เลือกสกุลอื่นที่ไม่ใช่สกุลฐานเพื่อเปรียบเทียบ</div>';
  restoreDrafts(drafts);
}

function renderAll(): void {
  const q = search.value.trim().toLowerCase();
  const list = CODES.filter((c) => !q || c.toLowerCase().includes(q) || nameOf(c).includes(q));
  el("all").innerHTML =
    list
      .map((c) => {
        const on = Boolean(state.watch[c]);
        return `<div class="item">
          <button class="star ${on ? "on" : ""}" data-star="${c}" title="ติดตาม">${on ? "★" : "☆"}</button>
          <div class="n"><b>${c}</b><small>${nameOf(c)}</small></div>
          <div>${fmt(pair(state.rates, "USD", c))}<small class="sub"> /USD</small></div>
        </div>`;
      })
      .join("") || '<div class="empty">ไม่พบสกุลเงิน</div>';
}

function renderStatus(): void {
  const badge = el("status");
  badge.className = `badge ${state.live ? "live" : "off"}`;
  badge.textContent = state.live
    ? `● สด · อัปเดต ${new Date(state.t).toLocaleTimeString("th-TH")}`
    : "ออฟไลน์ · ใช้ข้อมูลตัวอย่างโดยประมาณ";
}

function renderEverything(): void {
  renderConvert();
  renderWatch();
  renderAll();
  renderStatus();
}

/* ---------- กราฟย้อนหลัง ---------- */
const chartCache = new Map<string, HistoryPoint[]>();
let chartToken = 0;

function showChartMsg(msg: string): void {
  el("chart-msg").textContent = msg;
  el("chart-msg").hidden = false;
  el("chart-body").hidden = true;
}

function markRange(): void {
  document.querySelectorAll<HTMLElement>("#chart-range [data-range]").forEach((b) => {
    const on = Number(b.dataset.range) === state.rangeDays;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

function drawChart(pts: HistoryPoint[]): void {
  const s = summarize(pts);
  el("chart-msg").hidden = true;
  el("chart-body").hidden = false;
  el("chart-svg").innerHTML = chartSvg(pts);
  el("st-latest").textContent = fmt(s.latest);
  el("st-min").textContent = fmt(s.min);
  el("st-max").textContent = fmt(s.max);
  const chg = el("st-chg");
  chg.textContent = pctText(s.changePct);
  chg.className = cls(s.changePct);
}

async function loadChart(): Promise<void> {
  const { from, to } = state.prefs;
  const days = state.rangeDays;
  const token = ++chartToken;
  el("chart-title").textContent = `${from} → ${to}`;
  markRange();
  if (from === to) {
    showChartMsg("เลือกสองสกุลที่ต่างกันเพื่อดูกราฟ");
    return;
  }
  const key = `${from}_${to}_${days}`;
  let pts = chartCache.get(key);
  if (!pts) {
    showChartMsg("กำลังโหลดกราฟ…");
    try {
      pts = await fetchHistory(from, to, days);
      chartCache.set(key, pts);
    } catch {
      if (token === chartToken) showChartMsg("ไม่มีข้อมูลย้อนหลังของคู่เงินนี้ในขณะนี้");
      return;
    }
  }
  if (token === chartToken) drawChart(pts);
}

/* ---------- data ---------- */
async function update(): Promise<void> {
  btnRefresh.disabled = true;
  try {
    const live = await fetchRates();
    for (const c of CODES) if (live[c]) state.rates[c] = live[c];
    state.live = true;
    state.t = Date.now();
    state.hist.push({ t: state.t, r: { ...state.rates } });
    state.hist = state.hist.slice(-MAX_HISTORY);
    save("cw_hist", state.hist);
    checkAlerts();
  } catch {
    state.live = false;
    if (!state.hist.length) state.hist = [{ t: Date.now(), r: { ...state.rates } }];
  } finally {
    btnRefresh.disabled = false;
    renderEverything();
  }
}

/* ---------- events ---------- */
function toggleWatch(code: string): void {
  if (state.watch[code]) {
    delete state.watch[code];
    for (const k of Object.keys(state.alerts)) if (state.alerts[k].code === code) delete state.alerts[k];
    save("cw_alerts", state.alerts);
  } else {
    state.watch[code] = { t: Date.now(), r: { ...state.rates } };
  }
  save("cw_watch", state.watch);
  renderWatch();
  renderMulti();
  renderAll();
}

document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  const star = t.closest<HTMLElement>("[data-star]");
  if (star) return toggleWatch(star.dataset.star ?? "");
  const set = t.closest<HTMLElement>("[data-al-set]");
  if (set) return setAlert(set.dataset.alSet ?? "");
  const clear = t.closest<HTMLElement>("[data-al-clear]");
  if (clear) return clearAlert(clear.dataset.alClear ?? "");
  const x = t.closest<HTMLElement>(".toast-x");
  if (x) return x.closest(".toast")?.remove();
  const range = t.closest<HTMLElement>("[data-range]");
  if (range) {
    state.rangeDays = Number(range.dataset.range);
    return void loadChart();
  }
  const theme = t.closest<HTMLElement>("[data-theme-set]");
  if (theme) {
    state.theme = (theme.dataset.themeSet ?? "auto") as ThemeMode;
    applyTheme(state.theme);
  }
});

const savePrefs = () => save("cw_prefs", state.prefs);

amt.addEventListener("input", renderConvert);
selFrom.addEventListener("change", () => {
  state.prefs.from = selFrom.value;
  savePrefs();
  renderConvert();
  void loadChart();
});
selTo.addEventListener("change", () => {
  state.prefs.to = selTo.value;
  savePrefs();
  renderConvert();
  void loadChart();
});
selBase.addEventListener("change", () => {
  state.prefs.base = selBase.value;
  savePrefs();
  renderWatch();
});
el("swap").addEventListener("click", () => {
  [state.prefs.from, state.prefs.to] = [state.prefs.to, state.prefs.from];
  selFrom.value = state.prefs.from;
  selTo.value = state.prefs.to;
  savePrefs();
  renderConvert();
  void loadChart();
});
search.addEventListener("input", renderAll);
btnRefresh.addEventListener("click", () => void update());

/* ---------- start ---------- */
applyTheme(state.theme);
fillSelects();
renderEverything();
void loadChart();
void update();
setInterval(() => void update(), REFRESH_MS);
