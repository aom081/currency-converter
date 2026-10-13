# แผนการทดสอบ (Test Plan) — เครื่องคำนวณค่าเงิน

| รายการ | รายละเอียด |
|---|---|
| ระบบที่ทดสอบ | เว็บแอปเครื่องคำนวณค่าเงิน (Vite + TypeScript) |
| เวอร์ชัน | 1.0.0 |
| ประเภทการทดสอบ | Functional / UI end-to-end (อัตโนมัติ) |
| เครื่องมือ | Playwright Test (TypeScript), Robot Framework + Browser library และ Selenium (Python + pytest) |

## 1. วัตถุประสงค์
ยืนยันว่าแอปคำนวณค่าเงินได้ถูกต้อง ติดตามสกุลเงินและแสดงการเปลี่ยนแปลงได้ถูกต้อง จัดการกรณี API ล่มได้อย่างปลอดภัย และใช้งานได้บนเดสก์ท็อปและมือถือ

## 2. ขอบเขต
**อยู่ในขอบเขต**
- การแปลงค่าเงิน (จำนวนเงิน เลือกสกุล สลับสกุล แสดงอัตรา)
- สถานะข้อมูล (สด/ออฟไลน์), ปุ่มรีเฟรช, อัปเดตอัตโนมัติ 60 วินาที
- รายการที่ติดตาม (เพิ่ม/ลบ, ▲▼ การเปลี่ยนแปลง, สกุลฐาน, การคงอยู่หลังรีโหลด)
- รายการสกุลเงินทั้งหมดและการค้นหา, การจำค่าที่เลือก
- การแสดงผลบนจอมือถือ (ไม่มี overflow แนวนอน)

**นอกขอบเขต**
- ความถูกต้องของอัตราจากผู้ให้บริการ open.er-api.com (ใช้ mock แทน)
- ประสิทธิภาพ/โหลด, ความปลอดภัยเชิงลึก, การทดสอบ accessibility ด้วยเครื่องมือเฉพาะ
- Safari/WebKit และอุปกรณ์จริง (ดูหัวข้อความเสี่ยง)

## 3. กลยุทธ์การทดสอบ
1. **Mock API ทุกการทดสอบ** เพื่อให้ผลคำนวณเท่าเดิมทุกครั้ง และสร้างสถานการณ์อัตราขึ้น/ลง/ล่มได้
2. **Playwright** ครอบคลุมทุกกรณี (TC ทั้ง 28 ข้อ) รันขนานกันบน Chromium และมือถือ (Pixel 5)
3. **Robot Framework** ครอบคลุมกรณีหลัก 22 ข้อ (smoke + regression) เขียนแบบ keyword-driven ให้ทีม QA อ่านง่าย รันบน Chromium
4. **Selenium (Python + pytest)** ครอบคลุม 27 ข้อ (ยกเว้น TC-DATA-05 ที่ต้องใช้นาฬิกาจำลอง) ใช้ Page Object (`app_page.py`) และ mock server ตัวเดียวกับ Robot รันบน Chrome
5. ทุกชุดใช้ test case ID เดียวกัน เพื่อสอบย้อนกลับได้ (ดู `TEST_CASES.md`)
6. ทุกเทสต์เริ่มจากสภาพว่าง (context ใหม่ localStorage ว่าง) ไม่พึ่งลำดับการรัน

| ระดับ | ความหมาย | แท็ก |
|---|---|---|
| Smoke | ฟังก์ชันหลักต้องผ่านก่อนรันชุดเต็ม | `smoke` / `@smoke` |
| Regression | ทุกกรณี | ทั้งหมด |

## 4. สภาพแวดล้อม
| รายการ | ค่า |
|---|---|
| Node.js | 18+ |
| Python | 3.9+ (สำหรับ Robot Framework) |
| เบราว์เซอร์ | Chromium (Playwright และ Robot), จอมือถือ Pixel 5 (Playwright), Chrome (Selenium) |
| พอร์ต | Playwright: 5173, Robot และ Selenium: 5174 + Mock API: 8787 (**อย่ารัน Robot กับ Selenium พร้อมกัน** เพราะใช้พอร์ตเดียวกัน) |
| ระบบปฏิบัติการ | Windows / macOS / Linux |

## 5. ข้อมูลทดสอบ
อัตราจำลอง (ต่อ 1 USD): `USD=1, THB=35, JPY=150, EUR=0.9, GBP=0.8`

| กรณี | ค่าที่ใช้ | ผลที่คำนวณได้ |
|---|---|---|
| 1,000 USD → THB | 35 | 35,000 THB |
| 1,000 USD → JPY | 150 | 150,000 JPY |
| 1,000 THB → USD | 1/35 | 28.5714 USD |
| JPY เทียบ THB (ฐาน THB) | 35/150 | 0.233333 |
| JPY เปลี่ยน 150 → 140 | 35/140 = 0.25 | ▲ +7.143% |
| JPY เปลี่ยน 150 → 160 | 35/160 = 0.21875 | ▼ -6.250% |

กรณีออฟไลน์ใช้อัตราสำรองในโค้ด (THB = 33.5) จึงได้ 33,500 THB

## 6. เกณฑ์เริ่มและเสร็จสิ้นการทดสอบ
**เริ่ม:** โค้ด build ผ่าน (`npm run build`), ติดตั้งแพ็กเกจและเบราว์เซอร์ครบ
**ผ่าน (Exit):**
- Smoke ผ่าน 100%
- Regression ผ่าน ≥ 95% และไม่มีข้อบกพร่องระดับ Critical/High ที่ยังเปิดอยู่
- ทุกข้อบกพร่องที่เหลือมีแผนแก้ไขหรือยอมรับความเสี่ยงโดยเจ้าของผลิตภัณฑ์

## 7. ระดับความรุนแรงของข้อบกพร่อง
| ระดับ | ตัวอย่าง |
|---|---|
| Critical | คำนวณผิด / หน้าเว็บใช้งานไม่ได้ |
| High | ติดตามสกุลเงินไม่ได้ / ▲▼ แสดงผิด |
| Medium | ค้นหาไม่ตรง / ไม่จำค่าที่เลือก |
| Low | ข้อความหรือการจัดวางเล็กน้อย |

## 8. ความเสี่ยงและข้อควรระวัง
| ความเสี่ยง | แนวทางลดความเสี่ยง |
|---|---|
| ไม่ได้ทดสอบกับ API จริง | ทำ smoke ด้วยมือเป็นครั้งคราวกับ open.er-api.com |
| ข้อความภาษาไทยใน selector/assert เปลี่ยนแล้วเทสต์พัง | รวมข้อความไว้ใน helper/resource; แก้จุดเดียว |
| เทสต์อัตโนมัติ 60 วินาทีพึ่ง fake clock | ใช้ `page.clock` (Playwright ≥ 1.45) ไม่รอจริง |
| Selenium ดักเครือข่ายไม่ได้ จึงใช้ mock server แทน (ไม่มีโหมด 'JSON ไม่มี rates') และไม่ครอบคลุม TC-DATA-05 | ใช้ Playwright ครอบคลุมสองกรณีนี้ |
| ไม่มี WebKit/Safari | เพิ่มโปรเจ็กต์ `webkit` ใน `playwright.config.ts` ได้เมื่อต้องการ |
| อัตราสำรองในโค้ดเปลี่ยน → TC-DATA-02 ไม่ผ่าน | อัปเดตค่าคาดหวังให้ตรง `src/currencies.ts` |

## 9. ผลลัพธ์ที่ส่งมอบ
- แผนนี้, `TEST_CASES.md`, โค้ดทดสอบใน `tests/`
- รายงาน Playwright: `playwright-report/` (HTML), trace/screenshot ของเทสต์ที่ล้มเหลวใน `test-results/`
- รายงาน Robot: `results/robot/report.html`, `log.html`, `output.xml`
- รายงาน Selenium: `results/selenium/report.html`

## 10. วิธีรัน
```bash
# ติดตั้งครั้งแรก
npm install
npx playwright install
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
rfbrowser init

# Playwright
npm run test:e2e                          # ทั้งหมด
npx playwright test --grep @smoke         # เฉพาะ smoke
npx playwright test --project=chromium    # เฉพาะ Chromium
npm run test:e2e:report                   # เปิดรายงาน

# Robot Framework (เปิด mock + แอปให้เองอัตโนมัติ)
npm run test:robot
robot --include smoke --outputdir results/robot tests/robot
robot -v HEADLESS:False --outputdir results/robot tests/robot   # ดูเบราว์เซอร์ขณะรัน

# Selenium (ใช้ venv และ pip install -r requirements.txt เดียวกับ Robot ไม่ต้อง rfbrowser init)
pytest                                           # ทั้งหมด (Chrome headless)
pytest -m smoke                                  # เฉพาะ smoke
set HEADLESS=0 && pytest                         # ดูเบราว์เซอร์ (cmd) | macOS/Linux: HEADLESS=0 pytest
npm run test:selenium                            # สร้างรายงาน HTML ใน results/selenium/
```
