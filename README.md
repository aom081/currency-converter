# เครื่องคำนวณค่าเงิน (Vite + TypeScript)

คำนวณค่าเงินแบบเรียลไทม์ และกดดาวเพื่อติดตามการเปลี่ยนแปลงของแต่ละสกุล

## ฟีเจอร์
- แปลงค่าเงินแบบสด รองรับ 33 สกุลหลัก **และสกุลอื่นทั้งหมดที่ API ส่งมา** (เกิน 150 สกุล) พร้อมสลับสกุล
- **แปลงเป็นหลายสกุลพร้อมกัน:** กรอกจำนวนเงินครั้งเดียว ได้ผลทุกสกุลที่ติดตาม
- ติดตามสกุลเงินด้วยดาว ดู ▲▼ เทียบกับการอัปเดตก่อนหน้าและตั้งแต่เริ่มติดตาม พร้อมกราฟเส้นเล็ก
- **แจ้งเตือนราคาเป้าหมาย:** ตั้งเงื่อนไข "สูงกว่า/ต่ำกว่า" ในการ์ดที่ติดตาม แจ้งด้วยข้อความในหน้า (และ Notification ถ้าอนุญาต) ทำงานเฉพาะตอนเปิดหน้าไว้ และเช็กจากข้อมูลสดเท่านั้น
- **กราฟย้อนหลัง 7/30/90 วัน:** ตามคู่เงินในตัวแปลง ดึงจาก Frankfurter (บางสกุลอาจไม่มีข้อมูล จะแสดงข้อความแทน)
- **ธีม:** สว่าง / มืด / ตามระบบ จำค่าที่เลือกไว้
- **เทียบเรทร้านแลกเงิน/ธนาคาร:** กรอกเรทที่ร้านให้ + ค่าธรรมเนียม (% และแบบคงที่) แล้วดูว่าได้น้อย/มากกว่าเรทกลางเท่าไร
- **แชร์ลิงก์ผลลัพธ์:** `?amt=1000&from=USD&to=THB&lang=th` ที่อยู่บนแถบเบราว์เซอร์อัปเดตตามค่าที่เลือก มีปุ่มคัดลอกลิงก์
- **จัดเรียงรายการที่ติดตาม:** กำหนดเอง (ปุ่ม ▲▼) / แข็งค่ามากสุด / อ่อนค่ามากสุด / รหัสสกุล A→Z
- **สลับภาษา ไทย/อังกฤษ** (ค่าเริ่มต้นคือไทย จำค่าที่เลือก หรือกำหนดด้วย `lang=en` ในลิงก์)
- **ส่งออก CSV:** ข้อมูลกราฟย้อนหลัง และประวัติอัตราของรายการที่ติดตาม (ไฟล์มี BOM เปิดใน Excel ได้)
- **PWA:** ติดตั้งเป็นแอปได้ และเปิดออฟไลน์ได้ (ใช้อัตราล่าสุดที่เคยดึงไว้) — service worker ทำงานเฉพาะตอน build จริง (`npm run build && npm run preview`)

## วิธีรัน
```bash
npm install
npm run dev      # เปิด http://127.0.0.1:5173
npm run build    # สร้างไฟล์สำหรับ deploy ในโฟลเดอร์ dist
npm run preview  # ทดลองเปิดไฟล์ที่ build แล้ว
```
ต้องใช้ Node.js 18 ขึ้นไป

### Docker Compose

ใช้ Docker Compose เพื่อ build และเปิดเว็บ production ผ่าน Nginx:

```bash
docker compose up --build
```

เปิดที่ <http://localhost:8080> และตรวจสอบสถานะได้ที่
<http://localhost:8080/health>

กำหนดพอร์ตหรือ URL ของ API ก่อนรันได้ เช่น:

```bash
APP_PORT=9000 \
VITE_RATES_URL=https://open.er-api.com/v6/latest/USD \
VITE_HISTORY_URL=https://api.frankfurter.dev/v1 \
docker compose up --build
```

บน Windows PowerShell ใช้รูปแบบนี้:

```powershell
$env:APP_PORT="9000"
$env:VITE_RATES_URL="https://open.er-api.com/v6/latest/USD"
$env:VITE_HISTORY_URL="https://api.frankfurter.dev/v1"
docker compose up --build
```

หยุดและลบ container:

```bash
docker compose down
```

## โครงสร้าง
- `src/main.ts` – ตรรกะและการแสดงผลหลัก
- `src/api.ts` – ดึงอัตราสดจาก open.er-api.com และอัตราย้อนหลังจาก Frankfurter
- `src/currencies.ts` – รายชื่อสกุลหลัก อัตราสำรอง และชื่อสกุลอื่นผ่าน `Intl.DisplayNames`
- `src/i18n.ts` – ข้อความภาษาไทย/อังกฤษ (`t()`, `data-i18n` ใน `index.html`)
- `src/storage.ts` – บันทึกรายการติดตาม ประวัติ อัตราล่าสุด ฯลฯ ลง localStorage
- `src/alerts.ts`, `shop.ts`, `share.ts`, `sort.ts`, `csv.ts`, `chart.ts`, `theme.ts` – ฟังก์ชันย่อยของแต่ละฟีเจอร์ (แยกให้ทดสอบง่าย)
- `src/types.ts` – type ต่างๆ
- `src/style.css` – สไตล์ (รองรับโหมดมืด)
- `public/` – `manifest.webmanifest`, `sw.js` (service worker) และไอคอนของ PWA

## ปรับแต่ง
- เพิ่มสกุลเงิน: เพิ่มใน `CURRENCIES` ที่ `src/currencies.ts`
- ปรับความถี่อัปเดต: แก้ `REFRESH_MS` ใน `src/main.ts`
- เพิ่มภาษา/ข้อความ: แก้ `DICT` ใน `src/i18n.ts`

## การทดสอบ
เอกสาร: `docs/TEST_PLAN.md` (แผนทดสอบ) และ `docs/TEST_CASES.md` (94 test case)

```bash
npm install
npx playwright install                 # ติดตั้งเบราว์เซอร์ของ Playwright
npm run test:e2e                       # Playwright (chromium, มือถือ)
npx playwright test --grep @smoke      # เฉพาะ smoke
npm run test:e2e:pwa                   # ทดสอบ PWA (build แล้วรันบนพอร์ต 4173 — แยกจากชุดหลัก)

python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
rfbrowser init                         # ติดตั้งเบราว์เซอร์ของ Robot Browser library
npm run test:robot                     # Robot Framework (เปิดแอปและ mock API ให้อัตโนมัติ)
```
ชุดทดสอบหลักใช้ mock API เพื่อให้ผลลัพธ์คงที่และทดสอบ error/offline ได้โดยไม่ต้องต่ออินเทอร์เน็ต

สำหรับ smoke test ที่ใช้ API จริง:

```bash
npm run test:e2e:live
npm run test:robot:live
npm run test:selenium:live
```

ชุด live ตรวจการเชื่อมต่อและการคำนวณแบบไม่ผูกกับค่าอัตราคงที่ จึงต้องใช้อินเทอร์เน็ตและอาจได้รับผลกระทบจาก API ภายนอก

- Playwright live: `tests/playwright/live.spec.ts`
- Robot live: `tests/robot/live.robot` (แอปรันที่พอร์ต 5174)
- Selenium live: `tests/selenium/test_live.py` (แอปรันที่พอร์ต 5174)

ตั้ง URL ของ API ได้ผ่าน `VITE_RATES_URL` และ `VITE_HISTORY_URL`
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
