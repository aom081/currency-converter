import pytest


@pytest.mark.smoke
def test_tc_data_01_live_status(app):
    """TC-DATA-01 แสดงสถานะ 'สด' เมื่อดึงข้อมูลสำเร็จ"""
    app.load()
    assert "live" in app.attr("#status", "class")
    assert "อัปเดต" in app.text("#status")


@pytest.mark.smoke
def test_tc_data_02_offline_fallback(app):
    """TC-DATA-02 ใช้ข้อมูลสำรองเมื่อ API ล้มเหลว"""
    app.servers.set_mock_failure(True)
    app.load(live=False)
    assert "off" in app.attr("#status", "class")
    # อัตราสำรองของ THB = 33.5 (ดู src/currencies.ts)
    app.wait_text("#result", "33,500 THB")


def test_tc_data_03_http_500_stays_offline(app):
    """TC-DATA-03 API ตอบ HTTP 500 → ออฟไลน์ และปุ่มรีเฟรชกลับมาใช้ได้
    (กรณี 'JSON ไม่มี rates' ทดสอบเฉพาะใน Playwright เพราะ mock ของ Robot/Selenium ไม่มีโหมดนี้)"""
    app.servers.set_mock_failure(True)
    app.load(live=False)
    app.refresh_and_wait()
    assert "ออฟไลน์" in app.text("#status")
    assert app.el("#refresh").is_enabled()


@pytest.mark.smoke
def test_tc_data_04_refresh_button(app):
    """TC-DATA-04 ปุ่มรีเฟรชดึงอัตราใหม่"""
    app.load()
    app.servers.set_mock_rates(THB=36)
    app.refresh_and_wait()
    app.wait_text("#result", "36,000 THB")
    assert app.servers.get_mock_hits() >= 2
