/** แปลงตารางเป็น CSV (ครอบด้วย " เมื่อมี , " หรือขึ้นบรรทัดใหม่) */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number): string => {
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** ดาวน์โหลดเป็นไฟล์ (ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยถูก) */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
