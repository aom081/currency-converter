/** อัตราแลกเปลี่ยนต่อ 1 USD เช่น { THB: 33.5, JPY: 150 } */
export type Rates = Record<string, number>;

export interface Snapshot {
  t: number;
  r: Rates;
}

/** ข้อมูลตอนที่กดดาว ใช้เทียบ "ตั้งแต่ติดตาม" */
export type WatchMap = Record<string, Snapshot>;

export interface Prefs {
  from: string;
  to: string;
  base: string;
}

export type ThemeMode = "light" | "dark" | "auto";

export type AlertDir = "above" | "below";

/** แจ้งเตือนราคาเป้าหมาย: 1 code = target base */
export interface Alert {
  code: string;
  base: string;
  dir: AlertDir;
  target: number;
  triggered: boolean;
}

export interface HistoryPoint {
  date: string;
  value: number;
}
