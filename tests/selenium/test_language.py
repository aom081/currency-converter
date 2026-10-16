import pytest


@pytest.fixture(autouse=True)
def _open(app):
    app.load()


@pytest.mark.smoke
def test_tc_lang_01_default_thai(app):
    """TC-LANG-01 ค่าเริ่มต้นเป็นภาษาไทย"""
    assert app.d.find_element("css selector", "html").get_attribute("lang") == "th"
    assert "เครื่องคำนวณค่าเงิน" in app.text("h1")
    assert app.attr('[data-lang-set="th"]', "aria-pressed") == "true"


@pytest.mark.smoke
def test_tc_lang_02_switch_to_english(app):
    """TC-LANG-02 สลับเป็นภาษาอังกฤษ"""
    app.choose_lang("en")
    app.wait_text("h1", "💱 Currency Converter")
    assert app.d.find_element("css selector", "html").get_attribute("lang") == "en"
    assert app.text('label[for="amt"]') == "Amount"
    assert app.text("#refresh") == "Refresh"
    app.wait_text("#status", "● Live", exact=False)
    assert app.attr('[data-lang-set="en"]', "aria-pressed") == "true"


def test_tc_lang_03_persist(app):
    """TC-LANG-03 จำภาษาที่เลือกหลังรีโหลด"""
    app.choose_lang("en")
    app.reload()
    app.wait_text("h1", "💱 Currency Converter")
    app.choose_lang("th")
    app.wait_text("h1", "เครื่องคำนวณค่าเงิน", exact=False)


def test_tc_lang_04_dynamic_text(app):
    """TC-LANG-04 ข้อความที่สร้างจากโปรแกรมเปลี่ยนเป็นอังกฤษด้วย"""
    app.choose_lang("en")
    app.wait_text("#watch .empty", "No currencies are being watched yet", exact=False)
    app.star_in_list("JPY")
    app.servers.set_mock_rates(JPY=140)
    app.refresh_and_wait()
    app.wait_text("#watch .chg span:nth-child(1)", "▲ Last +7.143%")
    app.wait_text("#watch .chg span:nth-child(2)", "▲ Since watching +7.143%")
    app.wait_text("#multi-head", "From 1,000 USD")


def test_tc_lang_05_alert_text(app):
    """TC-LANG-05 ข้อความแจ้งเตือนราคาเป็นอังกฤษ"""
    app.choose_lang("en")
    app.star_in_list("JPY")
    app.set_alert("JPY", "above", "0.24")
    app.servers.set_mock_rates(JPY=140)
    app.refresh_and_wait()
    app.wait_text("#toasts .toast", "JPY/THB above target 0.24 reached", exact=False)
    app.wait_text("#watch .al-state", "Target reached", exact=False)


def test_tc_lang_06_currency_names(app):
    """TC-LANG-06 ชื่อสกุลเงินเปลี่ยนตามภาษา"""
    app.set_value("#q", "jpy")
    app.wait_text("#all .item", "เยน", exact=False)
    app.choose_lang("en")
    app.wait_text("#all .item", "Yen", exact=False)
    app.choose_lang("th")
    app.wait_text("#all .item", "เยน", exact=False)
