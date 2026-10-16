"""fixtures ของ pytest: เปิด mock API + แอป (ใช้ AppServers ตัวเดียวกับ Robot) และเบราว์เซอร์"""
import os
import sys
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "robot" / "libs"))
from AppServers import AppServers  # noqa: E402

from app_page import AppPage  # noqa: E402


@pytest.fixture(scope="session")
def servers():
    s = AppServers()
    s.url = s.start_servers()  # http://localhost:5174/ (ชี้ VITE_RATES_URL ไป mock API)
    yield s
    s.stop_servers()


@pytest.fixture(scope="session")
def driver():
    """เปิด Chrome (ปิด headless ด้วย HEADLESS=0)"""
    headless = os.getenv("HEADLESS", "1") != "0"
    opts = ChromeOptions()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1280,800")
    opts.add_argument("--disable-notifications")
    d = webdriver.Chrome(options=opts)
    yield d
    d.quit()


@pytest.fixture
def app(driver, servers):
    """หน้าเว็บสภาพว่าง: mock รีเซ็ต, localStorage ว่าง, หน้าต่าง 1280x800 (ยังไม่เปิดหน้า — เรียก app.load())"""
    servers.reset_mock()
    driver.set_window_size(1280, 800)
    driver.get(servers.url)
    driver.execute_script("localStorage.clear()")
    return AppPage(driver, servers)
