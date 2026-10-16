import pytest


@pytest.mark.smoke
def test_tc_offline_01_use_saved_rates(app):
    """TC-OFFLINE-01 ออฟไลน์แล้วใช้อัตราล่าสุดที่เคยบันทึกไว้"""
    app.load()  # THB = 35 ถูกบันทึกลงเครื่อง
    app.servers.set_mock_failure(True)
    app.reload(live=False)
    app.wait_text("#status", "บันทึกไว้", exact=False)
    app.wait_text("#result", "35,000 THB")  # ไม่ใช่อัตราตัวอย่าง 33.5


def test_tc_offline_02_use_sample_rates(app):
    """TC-OFFLINE-02 ไม่เคยมีข้อมูลสด ใช้อัตราตัวอย่าง"""
    app.servers.set_mock_failure(True)
    app.load(live=False)
    app.wait_text("#status", "ข้อมูลตัวอย่าง", exact=False)
    assert "บันทึกไว้" not in app.text("#status")
    app.wait_text("#result", "33,500 THB")


def test_tc_pwa_01_manifest(app):
    """TC-PWA-01 มี manifest ที่ติดตั้งเป็นแอปได้
    (service worker และการเปิดออฟไลน์ทดสอบใน Playwright: npm run test:e2e:pwa)"""
    app.load()
    assert "manifest.webmanifest" in app.attr('link[rel="manifest"]', "href")
    assert app.attr('meta[name="theme-color"]', "content").startswith("#")
