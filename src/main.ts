import "./style.css";
import { allCodes, fallbackRates, nameOf } from "./currencies";
import { fetchHistory, fetchRates } from "./api";
import { load, save } from "./storage";
import { applyTheme, loadTheme } from "./theme";
import { alertKey, isTriggered, parseTarget } from "./alerts";
import { chartSvg, summarize } from "./chart";
import { applyStaticText, getLang, locale, setLang, t } from "./i18n";
import type { Lang } from "./i18n";
import { compareShop } from "./shop";
import { buildQuery, parseShareParams } from "./share";
import { manualOrder, SORT_MODES, sortCodes } from "./sort";
import type { SortMode } from "./sort";
import { downloadCsv, toCsv } from "./csv";
import type { Alert, AlertDir, HistoryPoint, Prefs, Rates, Snapshot, ThemeMode, WatchMap } from "./types";

const REFRESH_MS = 60_000;
const MAX_HISTORY = 60;

/* ---------- state ---------- */
const savedRates = load<{ t: number; rates: Rates } | null>("cw_rates", null);

const state = {
  /** เริ่มจากอัตราตัวอย่าง แล้วทับด้วยอัตราล่าสุดที่เคยบันทึกไว้ (ใช้ตอนออฟไลน์) */
  rates: { ...fallbackRates(), ...(savedRates?.rates ?? {}) } as Rates,
  savedAt: savedRates?.t ?? 0,
  live: false,
  loaded: false,
  t: 0,
  hist: load<Snapshot[]>("cw_hist", []),
  watch: load<WatchMap>("cw_watch", {}),
  order: load<string[]>("cw_order", []),
  sort: load<SortMode>("cw_sort", "manual"),
  alerts: load<Record<string, Alert>>("cw_alerts", {}),
  alertErrors: {} as Record<string, string>,
  theme: loadTheme() as ThemeMode,
  rangeDays: 30,
  chartPts: [] as HistoryPoint[],
  chartMeta: { from: "", to: "", days: 30 },
  prefs: { from: "USD", to: "THB", base: "THB", ...load<Partial<Prefs>>("cw_prefs", {}) } as Prefs,
};
if (!SORT_MODES.includes(state.sort)) state.sort = "manual";

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
const selSort = el<HTMLSelectElement>("watch-sort");
const search = el<HTMLInputElement>("q");
const btnRefresh = el<HTMLButtonElement>("refresh");
const shopRate = el<HTMLInputElement>("shop-rate");
const shopFeePct = el<HTMLInputElement>("shop-fee-pct");
const shopFeeFixed = el<HTMLInputElement>("shop-fee-fixed");

/* ---------- helpers ---------- */
/** 1 a = ? b */
const pair = (r: Rates, a: string, b: string): number => r[b] / r[a];
const pctChange = (now: number, old: number): number => (old ? ((now - old) / old) * 100 : 0);
const cls = (p: number) => (Math.abs(p) < 0.0005 ? "flat" : p > 0 ? "up" : "down");
const arrow = (p: number) => (Math.abs(p) < 0.0005 ? "•" : p > 0 ? "▲" : "▼");
const pctText = (p: number) => `${p > 0 ? "+" : ""}${p.toFixed(3)}%`;
const name = (code: string) => nameOf(code, getLang());
const codes = () => allCodes(state.rates, [state.prefs.from, state.prefs.to, state.prefs.base]);

function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  const a = Math.abs(n);
  const digits = a >= 1000 ? 2 : a >= 1 ? 4 : 6;
  return n.toLocaleString(locale(), { maximumFractionDigits: digits });
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

/** % เปลี่ยนแปลงตั้งแต่กดดาว (เทียบกับสกุลฐานปัจจุบัน) */
const sinceOf = (c: string): number =>
  pctChange(pair(state.rates, c, state.prefs.base), pair(state.watch[c].r, c, state.prefs.base));

/** สกุลที่แสดงเป็นการ์ด เรียงตามโหมดที่เลือก (ไม่รวมสกุลฐาน) */
function visibleOrdered(): string[] {
  const list = Object.keys(state.watch).filter((c) => c !== state.prefs.base);
  return sortCodes(list, state.sort, state.order, sinceOf);
}

/* ---------- แชร์ลิงก์ ---------- */
function currentQuery(): string {
  return buildQuery({
    amt: String(parseFloat(amt.value) || 0),
    from: state.prefs.from,
    to: state.prefs.to,
    lang: getLang(),
  });
}

/** ให้ที่อยู่บนแถบเบราว์เซอร์ตรงกับค่าที่เลือก (คัดลอกแชร์ได้ทันที) */
function syncUrl(): void {
  try {
    history.replaceState(null, "", `${location.pathname}?${currentQuery()}`);
  } catch {
    /* ข้าม */
  }
}

async function shareLink(): Promise<void> {
  const url = `${location.origin}${location.pathname}?${currentQuery()}`;
  const row = el("share-row");
  const input = el<HTMLInputElement>("share-url");
  row.hidden = false;
  input.value = url;
  input.select();
  try {
    await navigator.clipboard.writeText(url);
    showToast(t("share.copied"));
  } catch {
    showToast(t("share.copyFail"));
  }
}

/* ---------- แจ้งเตือน (toast + Notification) ---------- */
function showToast(msg: string): void {
  const box = document.createElement("div");
  box.className = "toast";
  box.setAttribute("role", "status");
  const text = document.createElement("span");
  text.textContent = msg;
  const x = document.createElement("button");
  x.className = "toast-x";
  x.setAttribute("aria-label", t("toast.close"));
  x.textContent = "×";
  box.append(text, x);
  el("toasts").append(box);
}

function systemNotify(msg: string): void {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t("notify.title"), { body: msg });
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

/** เช็กการแจ้งเตือนทุกครั้งที่ได้ข้อมูลสด (ข้อมูลตัวอย่าง/ที่บันทึกไว้ตอนออฟไลน์ไม่นับ) */
function checkAlerts(): void {
  if (!state.live) return;
  let changed = false;
  for (const a of Object.values(state.alerts)) {
    if (a.triggered) continue;
    const rate = pair(state.rates, a.code, a.base);
    if (!isTriggered(a.dir, rate, a.target)) continue;
    a.triggered = true;
    changed = true;
    const msg = t("toast.alert", {
      pair: `${a.code}/${a.base}`,
      dir: t(a.dir === "above" ? "alert.above" : "alert.below"),
      target: fmt(a.target),
      now: fmt(rate),
    });
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
    state.alertErrors[code] = t("alert.err");
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
let codesSig = "";

/** สร้างตัวเลือกสกุลเงิน (ทำใหม่เมื่อรายการสกุลหรือภาษาเปลี่ยน) */
function fillSelects(force = false): void {
  const list = codes();
  const sig = `${getLang()}|${list.join(",")}`;
  if (!force && sig === codesSig) return;
  codesSig = sig;
  const options = list.map((c) => `<option value="${c}">${c} — ${name(c)}</option>`).join("");
  for (const [sel, key] of [
    [selFrom, "from"],
    [selTo, "to"],
    [selBase, "base"],
  ] as const) {
    sel.innerHTML = options;
    sel.value = state.prefs[key];
  }
}

function fillSortOptions(): void {
  selSort.innerHTML = SORT_MODES.map((m) => `<option value="${m}">${t(`sort.${m}`)}</option>`).join("");
  selSort.value = state.sort;
}

function renderConvert(): void {
  const { from, to } = state.prefs;
  const rate = pair(state.rates, from, to);
  const value = parseFloat(amt.value) || 0;
  el("result").textContent = `${fmt(value * rate)} ${to}`;
  el("rateline").textContent = `1 ${from} = ${fmt(rate)} ${to}  ·  1 ${to} = ${fmt(1 / rate)} ${from}`;
  renderMulti();
  renderShop();
}

function renderShop(): void {
  const { from, to } = state.prefs;
  el("shop-rate-label").textContent = t("shop.rate", { from, to });
  el("shop-fixed-label").textContent = t("shop.feeFixed", { from });
  const rate = parseFloat(shopRate.value);
  const out = el("shop-out");
  const hint = el("shop-hint");
  if (!(rate > 0)) {
    out.hidden = true;
    hint.hidden = false;
    return;
  }
  const feePct = Math.min(100, Math.max(0, parseFloat(shopFeePct.value) || 0));
  const feeFixed = Math.max(0, parseFloat(shopFeeFixed.value) || 0);
  const r = compareShop(parseFloat(amt.value) || 0, pair(state.rates, from, to), rate, feePct, feeFixed);
  out.hidden = false;
  hint.hidden = true;
  el("shop-market").textContent = `${fmt(r.market)} ${to}`;
  el("shop-result").textContent = `${fmt(r.shop)} ${to}`;
  const sign = r.diff > 0 ? "+" : r.diff < 0 ? "-" : "";
  const diff = el("shop-diff");
  diff.textContent = `${sign}${fmt(Math.abs(r.diff))} ${to} (${pctText(r.diffPct)})`;
  diff.className = cls(r.diffPct);
  el("shop-verdict").textContent = t(r.diff < 0 ? "shop.worse" : r.diff > 0 ? "shop.better" : "shop.same");
}

function renderMulti(): void {
  const { from } = state.prefs;
  const value = parseFloat(amt.value) || 0;
  el("multi-head").textContent = t("multi.head", { amount: fmt(value), from });
  const list = Object.keys(state.watch).filter((c) => c !== from);
  el("multi").innerHTML = list.length
    ? list
        .map((c) => {
          const r = pair(state.rates, from, c);
          return `<div class="mrow" data-multi="${c}">
            <div><b>${c}</b> <small class="sub">${name(c)}</small></div>
            <div class="mright"><div class="mval">${fmt(value * r)} ${c}</div>
            <small class="sub">1 ${from} = ${fmt(r)} ${c}</small></div></div>`;
        })
        .join("")
    : `<div class="empty">${t("multi.empty")}</div>`;
}

function alertBox(code: string, base: string): string {
  const a = state.alerts[alertKey(code, base)];
  if (a) {
    const sym = a.dir === "above" ? "≥" : "≤";
    return `<div class="alert-box" data-alert-for="${code}">
      <span class="al-state ${a.triggered ? "hit" : ""}">🔔 ${sym} ${fmt(a.target)} ${base}${a.triggered ? t("alert.hit") : ""}</span>
      <button class="al-clear" data-al-clear="${code}">${t("alert.clear")}</button></div>`;
  }
  return `<div class="alert-box" data-alert-for="${code}">
    <select class="al-dir" data-al-dir="${code}" aria-label="${t("alert.condition")}">
      <option value="below">${t("alert.dirBelow")}</option><option value="above">${t("alert.dirAbove")}</option></select>
    <input class="al-target" data-al-target="${code}" type="number" step="any" min="0" inputmode="decimal"
      placeholder="${t("alert.placeholder", { code, base })}" aria-label="${t("alert.targetAria")}">
    <button class="al-set" data-al-set="${code}">${t("alert.set")}</button>
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
  const exportBtn = el<HTMLButtonElement>("export-watch");
  if (!Object.keys(state.watch).length) {
    box.innerHTML = `<div class="empty">${t("watch.empty")}</div>`;
    exportBtn.disabled = true;
    return;
  }
  const drafts = captureDrafts();
  const { base } = state.prefs;
  const h = state.hist;
  const last = h[h.length - 1]?.r ?? state.rates;
  const prev = h.length > 1 ? h[h.length - 2].r : last;
  const list = visibleOrdered();
  const manual = state.sort === "manual" && list.length > 1;

  const cards = list.map((c, i) => {
    const now = pair(state.rates, c, base);
    const dLast = pctChange(pair(last, c, base), pair(prev, c, base));
    const dSince = sinceOf(c);
    const series = h.map((x) => pair(x.r, c, base));
    const moves = manual
      ? `<button class="mv" data-move-up="${c}" title="${t("watch.up")}" ${i === 0 ? "disabled" : ""}>▲</button>
         <button class="mv" data-move-down="${c}" title="${t("watch.down")}" ${i === list.length - 1 ? "disabled" : ""}>▼</button>`
      : "";
    return `<div class="w">
      <div class="top">
        <span><span class="code">${c}</span> <span class="sub">${name(c)}</span></span>
        <span class="top-actions">${moves}
          <button class="star on" data-star="${c}" title="${t("watch.unstar")}">★</button></span>
      </div>
      <div class="rate">${fmt(now)} <span class="sub">${base}</span></div>
      <div class="chg">
        <span class="${cls(dLast)}">${arrow(dLast)} ${t("watch.last")} ${pctText(dLast)}</span>
        <span class="${cls(dSince)}">${arrow(dSince)} ${t("watch.since")} ${pctText(dSince)}</span>
      </div>
      ${sparkline(series)}
      ${alertBox(c, base)}
    </div>`;
  });
  box.innerHTML = cards.join("") || `<div class="empty">${t("watch.onlyBase")}</div>`;
  exportBtn.disabled = list.length === 0;
  restoreDrafts(drafts);
}

function renderAll(): void {
  const q = search.value.trim().toLowerCase();
  const list = codes().filter(
    (c) => !q || c.toLowerCase().includes(q) || nameOf(c, "th").includes(q) || nameOf(c, "en").toLowerCase().includes(q),
  );
  el("all").innerHTML =
    list
      .map((c) => {
        const on = Boolean(state.watch[c]);
        return `<div class="item">
          <button class="star ${on ? "on" : ""}" data-star="${c}" title="${t("watch.star")}">${on ? "★" : "☆"}</button>
          <div class="n"><b>${c}</b><small>${name(c)}</small></div>
          <div>${fmt(pair(state.rates, "USD", c))}<small class="sub"> /USD</small></div>
        </div>`;
      })
      .join("") || `<div class="empty">${t("all.empty")}</div>`;
}

function renderStatus(): void {
  const badge = el("status");
  badge.className = `badge ${state.live ? "live" : state.loaded ? "off" : ""}`;
  const time = (ms: number) => new Date(ms).toLocaleTimeString(locale());
  badge.textContent = state.live
    ? t("status.live", { time: time(state.t) })
    : !state.loaded
      ? t("status.loading")
      : state.savedAt
        ? t("status.offlineSaved", { time: time(state.savedAt) })
        : t("status.offlineSample");
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
  el("chart-svg").replaceChildren();
  el<HTMLButtonElement>("export-chart").disabled = true;
  state.chartPts = [];
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
  el("chart-svg").innerHTML = chartSvg(pts, t("chart.aria"));
  el("st-latest").textContent = fmt(s.latest);
  el("st-min").textContent = fmt(s.min);
  el("st-max").textContent = fmt(s.max);
  const chg = el("st-chg");
  chg.textContent = pctText(s.changePct);
  chg.className = cls(s.changePct);
  state.chartPts = pts;
  state.chartMeta = { from: state.prefs.from, to: state.prefs.to, days: state.rangeDays };
  el<HTMLButtonElement>("export-chart").disabled = false;
}

async function loadChart(): Promise<void> {
  const { from, to } = state.prefs;
  const days = state.rangeDays;
  const token = ++chartToken;
  el("chart-title").textContent = `${from} → ${to}`;
  markRange();
  if (from === to) {
    showChartMsg(t("chart.same"));
    return;
  }
  const key = `${from}_${to}_${days}`;
  let pts = chartCache.get(key);
  if (!pts) {
    showChartMsg(t("chart.loading"));
    try {
      pts = await fetchHistory(from, to, days);
      chartCache.set(key, pts);
    } catch {
      if (token === chartToken) showChartMsg(t("chart.none"));
      return;
    }
  }
  if (token === chartToken) drawChart(pts);
}

/* ---------- ส่งออก CSV ---------- */
function exportChartCsv(): void {
  const { from, to, days } = state.chartMeta;
  if (!state.chartPts.length) return;
  const rows: (string | number)[][] = [["date", "rate"], ...state.chartPts.map((p) => [p.date, p.value])];
  downloadCsv(`${from}-${to}-${days}d.csv`, toCsv(rows));
}

function exportWatchCsv(): void {
  const { base } = state.prefs;
  const list = visibleOrdered();
  if (!list.length || !state.hist.length) return;
  const rows: (string | number)[][] = [["time", ...list.map((c) => `${c}/${base}`)]];
  for (const h of state.hist) {
    rows.push([
      new Date(h.t).toISOString(),
      ...list.map((c) => {
        const v = pair(h.r, c, base);
        return isFinite(v) ? +v.toFixed(6) : "";
      }),
    ]);
  }
  downloadCsv(`watchlist-${base}.csv`, toCsv(rows));
}

/* ---------- data ---------- */
async function update(): Promise<void> {
  btnRefresh.disabled = true;
  try {
    const live = await fetchRates();
    for (const [c, v] of Object.entries(live)) if (typeof v === "number" && v > 0) state.rates[c] = v;
    state.live = true;
    state.t = Date.now();
    state.savedAt = state.t;
    save("cw_rates", { t: state.t, rates: live });
    state.hist.push({ t: state.t, r: { ...state.rates } });
    state.hist = state.hist.slice(-MAX_HISTORY);
    save("cw_hist", state.hist);
    checkAlerts();
  } catch {
    state.live = false;
    if (!state.hist.length) state.hist = [{ t: Date.now(), r: { ...state.rates } }];
  } finally {
    state.loaded = true;
    btnRefresh.disabled = false;
    fillSelects();
    renderEverything();
  }
}

/* ---------- events ---------- */
function toggleWatch(code: string): void {
  if (state.watch[code]) {
    delete state.watch[code];
    state.order = state.order.filter((c) => c !== code);
    for (const k of Object.keys(state.alerts)) if (state.alerts[k].code === code) delete state.alerts[k];
    save("cw_alerts", state.alerts);
  } else {
    state.watch[code] = { t: Date.now(), r: { ...state.rates } };
    state.order = [...state.order.filter((c) => c !== code), code];
  }
  save("cw_watch", state.watch);
  save("cw_order", state.order);
  renderWatch();
  renderMulti();
  renderAll();
}

function moveCode(code: string, dir: -1 | 1): void {
  const all = manualOrder(Object.keys(state.watch), state.order);
  const visible = all.filter((c) => c !== state.prefs.base);
  const i = visible.indexOf(code);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= visible.length) return;
  const a = all.indexOf(visible[i]);
  const b = all.indexOf(visible[j]);
  [all[a], all[b]] = [all[b], all[a]];
  state.order = all;
  save("cw_order", all);
  renderWatch();
}

function changeLang(next: Lang): void {
  setLang(next);
  applyStaticText();
  fillSelects(true);
  fillSortOptions();
  renderEverything();
  void loadChart();
  syncUrl();
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const star = target.closest<HTMLElement>("[data-star]");
  if (star) return toggleWatch(star.dataset.star ?? "");
  const up = target.closest<HTMLElement>("[data-move-up]");
  if (up) return moveCode(up.dataset.moveUp ?? "", -1);
  const down = target.closest<HTMLElement>("[data-move-down]");
  if (down) return moveCode(down.dataset.moveDown ?? "", 1);
  const set = target.closest<HTMLElement>("[data-al-set]");
  if (set) return setAlert(set.dataset.alSet ?? "");
  const clear = target.closest<HTMLElement>("[data-al-clear]");
  if (clear) return clearAlert(clear.dataset.alClear ?? "");
  const x = target.closest<HTMLElement>(".toast-x");
  if (x) return x.closest(".toast")?.remove();
  const range = target.closest<HTMLElement>("[data-range]");
  if (range) {
    state.rangeDays = Number(range.dataset.range);
    return void loadChart();
  }
  const theme = target.closest<HTMLElement>("[data-theme-set]");
  if (theme) {
    state.theme = (theme.dataset.themeSet ?? "auto") as ThemeMode;
    return applyTheme(state.theme);
  }
  const lang = target.closest<HTMLElement>("[data-lang-set]");
  if (lang) changeLang(lang.dataset.langSet === "en" ? "en" : "th");
});

const savePrefs = () => save("cw_prefs", state.prefs);

amt.addEventListener("input", () => {
  renderConvert();
  syncUrl();
});
selFrom.addEventListener("change", () => {
  state.prefs.from = selFrom.value;
  savePrefs();
  renderConvert();
  void loadChart();
  syncUrl();
});
selTo.addEventListener("change", () => {
  state.prefs.to = selTo.value;
  savePrefs();
  renderConvert();
  void loadChart();
  syncUrl();
});
selBase.addEventListener("change", () => {
  state.prefs.base = selBase.value;
  savePrefs();
  renderWatch();
});
selSort.addEventListener("change", () => {
  state.sort = SORT_MODES.includes(selSort.value as SortMode) ? (selSort.value as SortMode) : "manual";
  save("cw_sort", state.sort);
  renderWatch();
});
el("swap").addEventListener("click", () => {
  [state.prefs.from, state.prefs.to] = [state.prefs.to, state.prefs.from];
  selFrom.value = state.prefs.from;
  selTo.value = state.prefs.to;
  savePrefs();
  renderConvert();
  void loadChart();
  syncUrl();
});
for (const input of [shopRate, shopFeePct, shopFeeFixed]) input.addEventListener("input", renderShop);
el("share").addEventListener("click", () => void shareLink());
el("export-chart").addEventListener("click", exportChartCsv);
el("export-watch").addEventListener("click", exportWatchCsv);
search.addEventListener("input", renderAll);
btnRefresh.addEventListener("click", () => void update());

/* ---------- PWA: service worker (เฉพาะตอน build จริง) ---------- */
async function registerServiceWorker(): Promise<void> {
  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
    const reg = await navigator.serviceWorker.ready;
    const urls = [
      location.pathname,
      ...performance
        .getEntriesByType("resource")
        .map((r) => r.name)
        .filter((u) => u.startsWith(location.origin)),
    ];
    reg.active?.postMessage({ type: "precache", urls });
  } catch {
    /* ไม่รองรับหรือถูกบล็อก — แอปยังใช้งานได้ปกติ */
  }
}
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => void registerServiceWorker());
}

/* ---------- start ---------- */
const params = parseShareParams(location.search);
if (params.lang) setLang(params.lang);
if (params.from) state.prefs.from = params.from;
if (params.to) state.prefs.to = params.to;
if (params.amt !== undefined) amt.value = params.amt;
applyStaticText();
applyTheme(state.theme);
fillSelects(true);
fillSortOptions();
renderEverything();
void loadChart();
void update();
setInterval(() => void update(), REFRESH_MS);
