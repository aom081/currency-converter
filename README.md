# เครื่องคำนวณค่าเงิน (Vite + TypeScript)

คำนวณค่าเงินแบบเรียลไทม์ และกดดาวเพื่อติดตามการเปลี่ยนแปลงของแต่ละสกุล

## วิธีรัน
```bash
npm install
npm run dev      # เปิด http://localhost:5173
npm run build    # สร้างไฟล์สำหรับ deploy ในโฟลเดอร์ dist
npm run preview  # ทดลองเปิดไฟล์ที่ build แล้ว
```
ต้องใช้ Node.js 18 ขึ้นไป

## โครงสร้าง
- `src/main.ts` – ตรรกะและการแสดงผลหลัก
- `src/api.ts` – ดึงอัตราสดจาก open.er-api.com
- `src/currencies.ts` – รายชื่อสกุลเงินและอัตราสำรอง (ใช้เมื่อออฟไลน์)
- `src/storage.ts` – บันทึกรายการติดตามและประวัติลง localStorage
- `src/types.ts` – type ต่างๆ
- `src/style.css` – สไตล์ (รองรับโหมดมืด)

## ปรับแต่ง
- เพิ่มสกุลเงิน: เพิ่มใน `CURRENCIES` ที่ `src/currencies.ts`
- ปรับความถี่อัปเดต: แก้ `REFRESH_MS` ใน `src/main.ts`

## การทดสอบ
เอกสาร: `docs/TEST_PLAN.md` (แผนทดสอบ) และ `docs/TEST_CASES.md` (28 test case)

```bash
npm install
npx playwright install                 # ติดตั้งเบราว์เซอร์ของ Playwright
npm run test:e2e                       # Playwright (chromium, firefox, มือถือ)
npx playwright test --grep @smoke      # เฉพาะ smoke

python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
rfbrowser init                         # ติดตั้งเบราว์เซอร์ของ Robot Browser library
npm run test:robot                     # Robot Framework (เปิดแอปและ mock API ให้อัตโนมัติ)
```
ทุกเทสต์ใช้ mock API จึงไม่ต้องต่ออินเทอร์เน็ตและผลลัพธ์คงที่
- Playwright: `tests/playwright/` (ดักการเรียก API ด้วย `page.route`)
- Robot: `tests/robot/` (mock server ใน `libs/AppServers.py`, แอปรันที่พอร์ต 5174 พร้อม `VITE_RATES_URL`)
