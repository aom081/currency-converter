import pytest


@pytest.fixture(autouse=True)
def _open(app):
    app.load()


@pytest.mark.smoke
def test_tc_conv_01_default_view(app):
    """TC-CONV-01 แสดงผลเริ่มต้น 1,000 USD → THB"""
    assert app.attr("#amt", "value") == "1000"
    assert app.selected("#from") == "USD"
    assert app.selected("#to") == "THB"
    app.wait_text("#result", "35,000 THB")


@pytest.mark.smoke
def test_tc_conv_02_change_amount(app):
    """TC-CONV-02 เปลี่ยนจำนวนเงินแล้วผลลัพธ์เปลี่ยนทันที"""
    app.set_value("#amt", "2")
    app.wait_text("#result", "70 THB")


def test_tc_conv_03_change_target_currency(app):
    """TC-CONV-03 เปลี่ยนสกุลปลายทางเป็น JPY"""
    app.select("#to", "JPY")
    app.wait_text("#result", "150,000 JPY")


def test_tc_conv_04_swap(app):
    """TC-CONV-04 ปุ่มสลับสกุล"""
    app.click("#swap")
    assert app.selected("#from") == "THB"
    assert app.selected("#to") == "USD"
    app.wait_text("#result", "28.5714 USD")


def test_tc_conv_05_rate_line(app):
    """TC-CONV-05 แสดงอัตราแลกเปลี่ยนทั้งสองทิศทาง"""
    app.wait_text("#rateline", "1 USD = 35 THB", exact=False)
    app.wait_text("#rateline", "1 THB = 0.028571 USD", exact=False)


def test_tc_conv_06_empty_or_zero(app):
    """TC-CONV-06 จำนวนเงินว่างหรือ 0 แสดงผลเป็น 0"""
    app.set_value("#amt", "")
    app.wait_text("#result", "0 THB")
    app.set_value("#amt", "0")
    app.wait_text("#result", "0 THB")


def test_tc_conv_07_same_currency(app):
    """TC-CONV-07 สกุลต้นทางและปลายทางเหมือนกัน"""
    app.select("#from", "EUR")
    app.select("#to", "EUR")
    app.wait_text("#result", "1,000 EUR")
