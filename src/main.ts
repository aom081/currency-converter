import "./style.css";
import { CODES, nameOf, fallbackRates } from "./currencies";
import { fetchRates } from "./api";
import { load, save } from "./storage";
import type { Prefs, Rates, Snapshot, WatchMap } from "./types";

const REFRESH_MS = 60_000;
const MAX_HISTORY = 60;

/* ---------- state ---------- */
const state = {
  rates: fallbackRates() as Rates,
  live: false,
  t: 0,
  hist: load<Snapshot[]>("cw_hist", []),
  watch: load<WatchMap>("cw_watch", {}),
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
}

function renderWatch(): void {
  const box = el("watch");
  const codes = Object.keys(state.watch);
  if (!codes.length) {
    box.innerHTML =
      '<div class="empty">ยังไม่มีสกุลเงินที่ติดตาม — กดดาว ☆ ในรายการด้านล่างเพื่อเริ่มติดตาม</div>';
    return;
  }
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
      </div>`;
    });
  box.innerHTML =
    cards.join("") || '<div class="empty">เลือกสกุลอื่นที่ไม่ใช่สกุลฐานเพื่อเปรียบเทียบ</div>';
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
  } catch {
    state.live = false;
    if (!state.hist.length) state.hist = [{ t: Date.now(), r: { ...state.rates } }];
  } finally {
    btnRefresh.disabled = false;
    renderEverything();
  }
}

/* ---------- events ---------- */
document.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-star]");
  if (!btn) return;
  const code = btn.dataset.star!;
  if (state.watch[code]) delete state.watch[code];
  else state.watch[code] = { t: Date.now(), r: { ...state.rates } };
  save("cw_watch", state.watch);
  renderWatch();
  renderAll();
});

const savePrefs = () => save("cw_prefs", state.prefs);

amt.addEventListener("input", renderConvert);
selFrom.addEventListener("change", () => {
  state.prefs.from = selFrom.value;
  savePrefs();
  renderConvert();
});
selTo.addEventListener("change", () => {
  state.prefs.to = selTo.value;
  savePrefs();
  renderConvert();
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
});
search.addEventListener("input", renderAll);
btnRefresh.addEventListener("click", () => void update());

/* ---------- start ---------- */
fillSelects();
renderEverything();
void update();
setInterval(() => void update(), REFRESH_MS);
