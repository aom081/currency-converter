"""Page object: รวมตัวเลือก (selector) และการกระทำกับหน้าเว็บไว้จุดเดียว"""
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait


class AppPage:
    def __init__(self, driver, servers):
        self.d = driver
        self.servers = servers  # ใช้ตั้งค่า mock API (อัตรา / ภาวะล่ม)
        self.url = servers.url

    # ---------- เปิดหน้า ----------
    def load(self, live=True):
        """เปิดหน้าเว็บ แล้วรอสถานะ '● สด' (หรือ 'ออฟไลน์' เมื่อ live=False)"""
        self.d.get(self.url)
        self._wait_status(live)

    def reload(self, live=True):
        self.d.refresh()
        self._wait_status(live)

    def _wait_status(self, live):
        self.wait_text("#status", "● สด" if live else "ออฟไลน์", exact=False)

    # ---------- ค้นหา / อ่านค่า ----------
    def el(self, css):
        return self.d.find_element(By.CSS_SELECTOR, css)

    def count(self, css):
        return len(self.d.find_elements(By.CSS_SELECTOR, css))

    def text(self, css):
        try:
            return self.el(css).text.strip()
        except NoSuchElementException:
            return ""

    def attr(self, css, name):
        return self.el(css).get_attribute(name) or ""

    def selected(self, css):
        return Select(self.el(css)).first_selected_option.get_attribute("value")

    # ---------- รอผล (retry จนกว่าจะตรงหรือหมดเวลา) ----------
    def wait_text(self, css, expected, exact=True, timeout=10):
        last = [""]

        def ok(_):
            last[0] = self.text(css)
            return last[0] == expected if exact else expected in last[0]

        try:
            WebDriverWait(self.d, timeout).until(ok)
        except TimeoutException:
            raise AssertionError(f"{css}: คาดว่า {expected!r} แต่ได้ {last[0]!r}") from None

    def wait_count(self, css, expected, timeout=10):
        last = [-1]

        def ok(_):
            last[0] = self.count(css)
            return last[0] == expected

        try:
            WebDriverWait(self.d, timeout).until(ok)
        except TimeoutException:
            raise AssertionError(f"{css}: คาดว่ามี {expected} รายการ แต่พบ {last[0]}") from None

    def wait_true(self, fn, message, timeout=10):
        try:
            WebDriverWait(self.d, timeout).until(lambda _: fn())
        except TimeoutException:
            raise AssertionError(message) from None

    # ---------- การกระทำ ----------
    def click(self, css):
        self.el(css).click()

    def set_value(self, css, value):
        """ตั้งค่าช่องกรอกแล้วยิงอีเวนต์ input (ใช้ได้ทุกระบบปฏิบัติการ ไม่พึ่ง Ctrl/Cmd+A)"""
        self.d.execute_script(
            "arguments[0].value = arguments[1];"
            "arguments[0].dispatchEvent(new Event('input', {bubbles: true}));",
            self.el(css),
            value,
        )

    def select(self, css, value):
        Select(self.el(css)).select_by_value(value)

    # ---------- ทางลัดของแอปนี้ ----------
    def result(self):
        return self.text("#result")

    def refresh(self):
        self.click("#refresh")

    def refresh_and_wait(self):
        """กดรีเฟรชและรอจนดึงข้อมูลรอบนั้นเสร็จ (ปุ่มกลับมาใช้ได้)"""
        before = self.servers.get_mock_hits()
        self.refresh()
        self.wait_true(lambda: self.servers.get_mock_hits() > before, "แอปไม่ได้เรียก API หลังกดรีเฟรช")
        self.wait_true(lambda: self.el("#refresh").is_enabled(), "ปุ่มรีเฟรชไม่กลับมาใช้ได้")

    def star_in_list(self, code):
        self.click(f'#all [data-star="{code}"]')

    def unstar_card(self, code):
        self.click(f'#watch [data-star="{code}"]')

    def delta_last(self):
        return self.text("#watch .chg span:nth-child(1)")

    def delta_since(self):
        return self.text("#watch .chg span:nth-child(2)")

    # ---------- ธีม / แจ้งเตือน / กราฟ ----------
    def body_bg(self):
        return self.d.execute_script("return getComputedStyle(document.body).backgroundColor")

    def html_theme(self):
        return self.d.execute_script("return document.documentElement.getAttribute('data-theme')")

    def wait_bg(self, expected):
        self.wait_true(lambda: self.body_bg() == expected, f"สีพื้นหลังไม่ใช่ {expected} (ตอนนี้ {self.body_bg()})")

    def choose_theme(self, mode):
        self.click(f'[data-theme-set="{mode}"]')

    def set_alert(self, code, direction, target):
        self.select(f'[data-al-dir="{code}"]', direction)
        self.set_value(f'[data-al-target="{code}"]', target)
        self.click(f'[data-al-set="{code}"]')

    def wait_attr(self, css, name, expected, timeout=10):
        last = [""]

        def ok(_):
            try:
                last[0] = self.attr(css, name)
            except NoSuchElementException:
                last[0] = "<ไม่พบ element>"
            return last[0] == expected

        try:
            WebDriverWait(self.d, timeout).until(ok)
        except TimeoutException:
            raise AssertionError(f"{css}[{name}]: คาดว่า {expected!r} แต่ได้ {last[0]!r}") from None
