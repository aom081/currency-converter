import { load, save } from "./storage";
import type { ThemeMode } from "./types";

export function loadTheme(): ThemeMode {
  const t = load<string>("cw_theme", "auto");
  return t === "light" || t === "dark" ? t : "auto";
}

/** light/dark = บังคับธีม, auto = ตามระบบ (ลบ data-theme ออก ให้ CSS media query ทำงาน) */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  save("cw_theme", mode);
  document.querySelectorAll<HTMLElement>("[data-theme-set]").forEach((b) => {
    const on = b.dataset.themeSet === mode;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
