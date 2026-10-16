import pytest


@pytest.fixture(autouse=True)
def _open(app):
    app.load()  # 1,000 USD → THB เรทกลาง 35


@pytest.mark.smoke
def test_tc_shop_01_hint(app):
    """TC-SHOP-01 ยังไม่กรอกเรท แสดงข้อความแนะนำ"""
    assert app.el("#shop-hint").is_displayed()
    assert not app.el("#shop-out").is_displayed()


@pytest.mark.smoke
def test_tc_shop_02_rate_below_market(app):
    """TC-SHOP-02 เรทร้านต่ำกว่าเรทกลาง"""
    app.set_value("#shop-rate", "34")
    app.wait_text("#shop-market", "35,000 THB")
    app.wait_text("#shop-result", "34,000 THB")
    app.wait_text("#shop-diff", "-1,000 THB (-2.857%)")
    assert "down" in app.attr("#shop-diff", "class")
    app.wait_text("#shop-verdict", "ร้านให้น้อยกว่าเรทกลาง")


def test_tc_shop_03_percent_fee(app):
    """TC-SHOP-03 หักค่าธรรมเนียมเป็นเปอร์เซ็นต์"""
    app.set_value("#shop-rate", "34")
    app.set_value("#shop-fee-pct", "1")
    app.wait_text("#shop-result", "33,660 THB")
    app.wait_text("#shop-diff", "-1,340 THB (-3.829%)")


def test_tc_shop_04_fixed_fee(app):
    """TC-SHOP-04 หักค่าธรรมเนียมคงที่ (หน่วยสกุลต้นทาง)"""
    app.set_value("#shop-rate", "34")
    app.set_value("#shop-fee-fixed", "5")
    app.wait_text("#shop-result", "33,830 THB")
    app.wait_text("#shop-diff", "-1,170 THB (-3.343%)")


def test_tc_shop_05_rate_above_market(app):
    """TC-SHOP-05 เรทร้านสูงกว่าเรทกลาง"""
    app.set_value("#shop-rate", "36")
    app.wait_text("#shop-result", "36,000 THB")
    app.wait_text("#shop-diff", "+1,000 THB (+2.857%)")
    assert "up" in app.attr("#shop-diff", "class")
    app.wait_text("#shop-verdict", "ร้านให้มากกว่าเรทกลาง")


def test_tc_shop_06_amount_change(app):
    """TC-SHOP-06 เปลี่ยนจำนวนเงินแล้วผลเปลี่ยนตาม"""
    app.set_value("#shop-rate", "34")
    app.set_value("#amt", "2")
    app.wait_text("#shop-market", "70 THB")
    app.wait_text("#shop-result", "68 THB")
    app.wait_text("#shop-diff", "-2 THB (-2.857%)")


def test_tc_shop_07_labels_follow_pair(app):
    """TC-SHOP-07 ป้ายกำกับตามคู่เงินที่เลือก"""
    app.wait_text("#shop-rate-label", "1 USD = ? THB", exact=False)
    app.wait_text("#shop-fixed-label", "USD", exact=False)
    app.select("#from", "EUR")
    app.wait_text("#shop-rate-label", "1 EUR = ? THB", exact=False)
    app.wait_text("#shop-fixed-label", "EUR", exact=False)
