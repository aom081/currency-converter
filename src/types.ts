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
