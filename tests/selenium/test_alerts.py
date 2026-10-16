import pytest


@pytest.fixture
def jpy(app):
    """เปิดแอปและติดตาม JPY (JPY/THB เริ่มต้น = 35/150 = 0.233333)"""
    app.load()
    app.star_in_list("JPY")
    return app


@pytest.mark.smoke
def test_tc_alert_01_form_visible(jpy):
    """TC-ALERT-01 การ์ดที่ติดตามมีฟอร์มตั้งแจ้งเตือน"""
    for css in ('[data-al-dir="JPY"]', '[data-al-target="JPY"]', '[data-al-set="JPY"]'):
        assert jpy.el(css).is_displayed()


def test_tc_alert_02_invalid_target(jpy):
    """TC-ALERT-02 เป้าหมายว่างหรือ 0 แสดงข้อผิดพลาด ไม่สร้างแจ้งเตือน"""
    jpy.click('[data-al-set="JPY"]')
    jpy.wait_text('[data-al-err="JPY"]', "กรุณากรอกราคาเป้าหมาย", exact=False)
    jpy.set_value('[data-al-target="JPY"]', "0")
    jpy.click('[data-al-set="JPY"]')
    jpy.wait_text('[data-al-err="JPY"]', "กรุณากรอกราคาเป้าหมาย", exact=False)
    assert jpy.count("#watch .al-state") == 0


@pytest.mark.smoke
def test_tc_alert_03_set_alert(jpy):
    """TC-ALERT-03 ตั้งแจ้งเตือนแล้วแสดงเงื่อนไข"""
    jpy.set_alert("JPY", "above", "0.24")
    jpy.wait_text("#watch .al-state", "≥ 0.24 THB", exact=False)
    assert jpy.count('[data-al-set="JPY"]') == 0


def test_tc_alert_04_not_reached(jpy):
    """TC-ALERT-04 ยังไม่ถึงเป้าหมาย รีเฟรชแล้วไม่แจ้ง"""
    jpy.set_alert("JPY", "above", "0.24")
    jpy.refresh_and_wait()
    assert jpy.count("#toasts .toast") == 0
    assert "hit" not in jpy.attr("#watch .al-state", "class")


@pytest.mark.smoke
def test_tc_alert_05_reached_above(jpy):
    """TC-ALERT-05 เรทสูงถึงเป้าหมาย แจ้งเตือนและทำเครื่องหมาย"""
    jpy.set_alert("JPY", "above", "0.24")
    jpy.servers.set_mock_rates(JPY=140)  # 35/140 = 0.25 ≥ 0.24
    jpy.refresh_and_wait()
    jpy.wait_count("#toasts .toast", 1)
    jpy.wait_text("#toasts .toast", "JPY/THB", exact=False)
    jpy.wait_text("#toasts .toast", "สูงกว่า", exact=False)
    jpy.wait_text("#watch .al-state", "ถึงเป้าหมายแล้ว", exact=False)
    assert "hit" in jpy.attr("#watch .al-state", "class")


def test_tc_alert_06_reached_below(jpy):
    """TC-ALERT-06 เรทต่ำถึงเป้าหมาย แจ้งเตือน"""
    jpy.set_alert("JPY", "below", "0.23")
    jpy.wait_text("#watch .al-state", "≤ 0.23 THB", exact=False)
    jpy.servers.set_mock_rates(JPY=160)  # 35/160 = 0.21875
    jpy.refresh_and_wait()
    jpy.wait_text("#toasts .toast", "ต่ำกว่า", exact=False)
    jpy.wait_text("#watch .al-state", "ถึงเป้าหมายแล้ว", exact=False)


def test_tc_alert_07_notify_once(jpy):
    """TC-ALERT-07 แจ้งเพียงครั้งเดียวต่อการตั้ง"""
    jpy.set_alert("JPY", "above", "0.24")
    jpy.servers.set_mock_rates(JPY=140)
    jpy.refresh_and_wait()
    jpy.wait_count("#toasts .toast", 1)
    jpy.servers.set_mock_rates(JPY=130)  # ยังสูงกว่าเป้าหมาย แต่ต้องไม่แจ้งซ้ำ
    jpy.refresh_and_wait()
    assert jpy.count("#toasts .toast") == 1


def test_tc_alert_08_clear(jpy):
    """TC-ALERT-08 ลบแจ้งเตือนแล้วกลับเป็นฟอร์ม"""
    jpy.set_alert("JPY", "above", "0.24")
    jpy.click('[data-al-clear="JPY"]')
    jpy.wait_count("#watch .al-state", 0)
    assert jpy.el('[data-al-set="JPY"]').is_displayed()


def test_tc_alert_09_persist(jpy):
    """TC-ALERT-09 แจ้งเตือนคงอยู่หลังรีโหลด"""
    jpy.set_alert("JPY", "above", "0.24")
    jpy.reload()
    jpy.wait_text("#watch .al-state", "≥ 0.24 THB", exact=False)


def test_tc_alert_10_close_toast(jpy):
    """TC-ALERT-10 ปิดการแจ้งเตือนด้วยปุ่ม ×"""
    jpy.set_alert("JPY", "above", "0.24")
    jpy.servers.set_mock_rates(JPY=140)
    jpy.refresh_and_wait()
    jpy.wait_count("#toasts .toast", 1)
    jpy.click("#toasts .toast-x")
    jpy.wait_count("#toasts .toast", 0)


def test_tc_alert_11_offline_does_not_trigger(app):
    """TC-ALERT-11 ข้อมูลตัวอย่างตอนออฟไลน์ไม่ทริกเกอร์ และทริกเกอร์เมื่อได้ข้อมูลสด"""
    app.servers.set_mock_failure(True)
    app.load(live=False)
    app.star_in_list("JPY")
    app.set_alert("JPY", "below", "0.23")  # ข้อมูลสำรอง 33.5/150 = 0.2233 ≤ 0.23 แต่ยังไม่ใช่ข้อมูลสด
    app.wait_text("#watch .al-state", "≤ 0.23 THB", exact=False)
    assert app.count("#toasts .toast") == 0
    app.servers.set_mock_failure(False)
    app.servers.set_mock_rates(THB=34)  # 34/150 = 0.2267 ≤ 0.23
    app.refresh()
    app.wait_text("#status", "● สด", exact=False)
    app.wait_count("#toasts .toast", 1)
    app.wait_text("#watch .al-state", "ถึงเป้าหมายแล้ว", exact=False)


def test_tc_alert_12_unstar_removes_alert(jpy):
    """TC-ALERT-12 เลิกติดตามสกุลแล้วแจ้งเตือนของสกุลนั้นถูกลบ"""
    jpy.set_alert("JPY", "above", "0.24")
    jpy.unstar_card("JPY")
    jpy.star_in_list("JPY")
    jpy.wait_count("#watch .al-state", 0)
    assert jpy.el('[data-al-set="JPY"]').is_displayed()
