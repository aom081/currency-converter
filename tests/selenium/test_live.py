import pytest


@pytest.mark.live
def test_live_api_conversion(app):
    """ตรวจการเชื่อมต่อ API จริงและคำนวณค่าเงินได้"""
    assert app.text("#result") != "—"
    assert "USD" in app.text("#rateline")
    assert "THB" in app.text("#rateline")


@pytest.mark.live
def test_live_amount_conversion(app):
    app.load(query="?from=USD&to=THB&amt=2")
    app.set_value("#amt", "2")
    assert app.text("#result").endswith(" THB")
    assert app.text("#result") != "—"


@pytest.mark.live
def test_live_target_currency_conversion(app):
    app.load(query="?from=USD&to=THB")
    app.select("#to", "JPY")
    assert app.text("#result").endswith(" JPY")
    assert "USD" in app.text("#rateline")
    assert "JPY" in app.text("#rateline")


@pytest.mark.live
def test_live_swap_conversion(app):
    app.load(query="?from=USD&to=THB")
    app.click("#swap")
    assert app.selected("#from") == "THB"
    assert app.selected("#to") == "USD"
    assert app.text("#result").endswith(" USD")


@pytest.mark.live
def test_live_same_currency_conversion(app):
    app.load(query="?from=USD&to=THB")
    app.select("#from", "EUR")
    app.select("#to", "EUR")
    assert app.text("#result") == "1,000 EUR"
