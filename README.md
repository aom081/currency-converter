# เครื่องคำนวณค่าเงิน (Vite + TypeScript)

คำนวณค่าเงินแบบเรียลไทม์ และกดดาวเพื่อติดตามการเปลี่ยนแปลงของแต่ละสกุล

## ฟีเจอร์
- แปลงค่าเงินแบบสด 33 สกุล พร้อมสลับสกุล และข้อมูลสำรองเมื่อออฟไลน์
- **แปลงเป็นหลายสกุลพร้อมกัน:** กรอกจำนวนเงินครั้งเดียว ได้ผลทุกสกุลที่ติดตาม
- ติดตามสกุลเงินด้วยดาว ดู ▲▼ เทียบกับการอัปเดตก่อนหน้าและตั้งแต่เริ่มติดตาม พร้อมกราฟเส้นเล็ก
- **แจ้งเตือนราคาเป้าหมาย:** ตั้งเงื่อนไข "สูงกว่า/ต่ำกว่า" ในการ์ดที่ติดตาม แจ้งด้วยข้อความในหน้า (และ Notification ถ้าอนุญาต) ทำงานเฉพาะตอนเปิดหน้าไว้ และเช็กจากข้อมูลสดเท่านั้น
- **กราฟย้อนหลัง 7/30/90 วัน:** ตามคู่เงินในตัวแปลง ดึงจาก Frankfurter (บางสกุลอาจไม่มีข้อมูล จะแสดงข้อความแทน)
- **ธีม:** สว่าง / มืด / ตามระบบ จำค่าที่เลือกไว้

## วิธีรัน
```bash
npm install
npm run dev      # เปิด http://127.0.0.1:5173
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
เอกสาร: `docs/TEST_PLAN.md` (แผนทดสอบ) และ `docs/TEST_CASES.md` (57 test case)

```bash
npm install
npx playwright install                 # ติดตั้งเบราว์เซอร์ของ Playwright
npm run test:e2e                       # Playwright (chromium, มือถือ)
npx playwright test --grep @smoke      # เฉพาะ smoke

python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
rfbrowser init                         # ติดตั้งเบราว์เซอร์ของ Robot Browser library
npm run test:robot                     # Robot Framework (เปิดแอปและ mock API ให้อัตโนมัติ)
```
ทุกเทสต์ใช้ mock API (อัตราล่าสุดและย้อนหลัง) จึงไม่ต้องต่ออินเทอร์เน็ตและผลลัพธ์คงที่ ตั้ง URL ของ API ได้ผ่าน `VITE_RATES_URL` และ `VITE_HISTORY_URL`
- Playwright: `tests/playwright/` (ดักการเรียก API ด้วย `page.route`)
- Robot: `tests/robot/` (mock server ใน `libs/AppServers.py`, แอปรันที่พอร์ต 5174 พร้อม `VITE_RATES_URL`)

### Selenium (Python + pytest)
```bash
pip install -r requirements.txt        # ใช้ venv เดียวกับ Robot
pytest                                 # Chrome headless
pytest -m smoke                        # เฉพาะ smoke
```
ตั้ง `HEADLESS=0` เพื่อดูเบราว์เซอร์ขณะรัน (cmd: `set HEADLESS=0 && pytest`) รายงานอยู่ที่ `results/selenium/report.html` (ใช้ `npm run test:selenium`)
โค้ดอยู่ใน `tests/selenium/` ใช้ mock server และพอร์ต 5174 ร่วมกับ Robot จึงอย่ารันสองชุดพร้อมกัน
