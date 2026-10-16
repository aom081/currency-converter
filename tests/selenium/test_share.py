import pytest


@pytest.mark.smoke
def test_tc_share_01_share_current(app):
    """TC-SHARE-01 กดแชร์แล้วแสดงลิงก์ของค่าปัจจุบัน"""
    app.load()
    assert not app.el("#share-row").is_displayed()
    app.click("#share")
    app.wait_true(lambda: app.el("#share-row").is_displayed(), "ช่องลิงก์ไม่แสดง")
    assert app.attr("#share-url", "value").endswith("?amt=1000&from=USD&to=THB&lang=th")


def test_tc_share_02_link_follows_changes(app):
    """TC-SHARE-02 ลิงก์และแถบที่อยู่อัปเดตตามค่าที่เปลี่ยน"""
    app.load()
    app.set_value("#amt", "250")
    app.select("#from", "EUR")
    app.select("#to", "JPY")
    app.wait_true(lambda: "?amt=250&from=EUR&to=JPY&lang=th" in app.d.current_url, "แถบที่อยู่ไม่อัปเดต")
    app.click("#share")
    app.wait_true(
        lambda: app.attr("#share-url", "value").endswith("?amt=250&from=EUR&to=JPY&lang=th"),
        "ลิงก์ที่แชร์ไม่ตรงกับค่าที่เลือก",
    )


@pytest.mark.smoke
def test_tc_share_03_open_shared_link(app):
    """TC-SHARE-03 เปิดลิงก์ที่แชร์แล้วได้ค่าตามลิงก์"""
    app.load(query="?amt=250&from=EUR&to=JPY")
    assert app.attr("#amt", "value") == "250"
    assert app.selected("#from") == "EUR"
    assert app.selected("#to") == "JPY"
    app.wait_text("#result", "41,666.67 JPY")


def test_tc_share_04_invalid_params_ignored(app):
    """TC-SHARE-04 พารามิเตอร์ที่ไม่ถูกต้องถูกข้าม ใช้ค่าเริ่มต้น"""
    app.load(query="?amt=abc&from=ZZ&to=12&lang=fr")
    assert app.attr("#amt", "value") == "1000"
    assert app.selected("#from") == "USD"
    assert app.selected("#to") == "THB"
    app.wait_text("#result", "35,000 THB")
    assert app.d.find_element("css selector", "html").get_attribute("lang") == "th"


def test_tc_share_05_lang_param(app):
    """TC-SHARE-05 ลิงก์ที่ระบุ lang=en เปิดเป็นภาษาอังกฤษ"""
    app.load(query="?lang=en")
    app.wait_text("h1", "💱 Currency Converter")
