import type { HistoryPoint } from "./types";

export interface Summary {
  latest: number;
  min: number;
  max: number;
  changePct: number;
}

export function summarize(pts: HistoryPoint[]): Summary {
  const vals = pts.map((p) => p.value);
  const first = vals[0];
  const latest = vals[vals.length - 1];
  return {
    latest,
    min: Math.min(...vals),
    max: Math.max(...vals),
    changePct: first ? ((latest - first) / first) * 100 : 0,
  };
}

/** กราฟเส้น SVG (สีเขียวถ้าจบสูงกว่าเริ่ม, แดงถ้าต่ำกว่า) + วันที่เริ่ม/สิ้นสุด */
export function chartSvg(pts: HistoryPoint[], ariaLabel: string): string {
  const W = 600, H = 200, padX = 8, padT = 14, padB = 16;
  const vals = pts.map((p) => p.value);
  const min = Math.min(...vals);
  const range = Math.max(...vals) - min || 1;
  const x = (i: number) => padX + (i / (pts.length - 1)) * (W - padX * 2);
  const y = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB);
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${x(0).toFixed(1)},${H - padB} ${line} ${x(pts.length - 1).toFixed(1)},${H - padB}`;
  const color = vals[vals.length - 1] >= vals[0] ? "var(--up)" : "var(--down)";
  return `<svg class="chart" data-points="${pts.length}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${ariaLabel}">
    <polygon points="${area}" fill="${color}" opacity="0.12"/>
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
    <div class="chart-dates"><span>${pts[0].date}</span><span>${pts[pts.length - 1].date}</span></div>`;
}
