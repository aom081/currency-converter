import json
from urllib.request import urlopen

import pytest


def _number(result):
    return float(result.split()[0].replace(",", ""))


def _install_fetch_counter(app):
    app.d.execute_script(
        """
        window.__liveFetchCount = 0;
        const originalFetch = window.fetch.bind(window);
        window.fetch = (...args) => {
            window.__liveFetchCount += 1;
            return originalFetch(...args);
        };
        """
    )


def _live_fetches(app):
    return app.d.execute_script("return window.__liveFetchCount || 0;")


def _refresh_live(app):
    _install_fetch_counter(app)
    app.refresh()
    app.wait_true(
        lambda: _live_fetches(app) > 0,
        "แอปไม่ได้เรียก API หลังกด Refresh",
    )
    app.wait_true(
        lambda: app.el("#refresh").is_enabled(),
        "ปุ่ม Refresh ไม่กลับมาใช้งานได้",
    )


@pytest.mark.live
def test_live_api_01_open_and_live_status(app):
    """LIVE-API-01 เปิดแอปและรับสถานะ Live"""
    app.load()
    assert "live" in app.attr("#status", "class")
    assert "USD" in app.text("#rateline")
    assert "THB" in app.text("#rateline")
    assert app.result() != "—"


@pytest.mark.live
def test_live_api_02_rates_response_structure():
    """LIVE-API-02 API ตอบกลับด้วยข้อมูลอัตราที่มีโครงสร้างถูกต้อง"""
    with urlopen("https://open.er-api.com/v6/latest/USD", timeout=15) as response:
        assert 200 <= response.status < 300
        body = json.load(response)
    assert isinstance(body["rates"], dict)
    assert isinstance(body["rates"]["USD"], (int, float))
    assert isinstance(body["rates"]["THB"], (int, float))
    assert body["rates"]["USD"] > 0
    assert body["rates"]["THB"] > 0


@pytest.mark.live
def test_live_conv_01_usd_to_thb(app):
    """LIVE-CONV-01 แปลง USD เป็น THB ด้วยเรตจริง"""
    app.load(query="?from=USD&to=THB&amt=1000")
    assert app.result().endswith(" THB")
    assert _number(app.result()) > 0
    assert "USD" in app.text("#rateline")
    assert "THB" in app.text("#rateline")


@pytest.mark.live
def test_live_conv_02_amount_ratio(app):
    """LIVE-CONV-02 ผลลัพธ์เปลี่ยนตามจำนวนเงินและรักษาสัดส่วน"""
    app.load(query="?from=USD&to=THB&amt=1")
    one = _number(app.result())
    app.set_value("#amt", "2")
    app.wait_true(lambda: _number(app.result()) > 0, "ผลลัพธ์จำนวน 2 ไม่เป็นบวก")
    two = _number(app.result())
    assert two == pytest.approx(one * 2, rel=0.01)


@pytest.mark.live
def test_live_conv_03_target_jpy(app):
    """LIVE-CONV-03 เปลี่ยนสกุลเงินปลายทางเป็น JPY"""
    app.load(query="?from=USD&to=THB&amt=2")
    app.select("#to", "JPY")
    app.wait_true(lambda: app.result().endswith(" JPY"), "ผลลัพธ์ไม่ใช่ JPY")
    assert "USD" in app.text("#rateline")
    assert "JPY" in app.text("#rateline")


@pytest.mark.live
def test_live_conv_04_swap(app):
    """LIVE-CONV-04 สลับสกุลเงินต้นทางและปลายทาง"""
    app.load(query="?from=USD&to=JPY&amt=2")
    app.click("#swap")
    assert app.selected("#from") == "JPY"
    assert app.selected("#to") == "USD"
    assert app.result().endswith(" USD")


@pytest.mark.live
def test_live_conv_05_same_currency(app):
    """LIVE-CONV-05 สกุลเงินต้นทางและปลายทางเป็นสกุลเดียวกัน"""
    app.load(query="?from=USD&to=THB&amt=2")
    app.select("#from", "EUR")
    app.select("#to", "EUR")
    assert app.result() == "2 EUR"


@pytest.mark.live
def test_live_data_01_refresh_fetches_again(app):
    """LIVE-DATA-01 กด Refresh แล้วเรียก API ใหม่"""
    app.load()
    _refresh_live(app)
    assert app.result() != "—"


@pytest.mark.live
def test_live_data_02_reload_fetches_again(app):
    """LIVE-DATA-02 รีโหลดหน้าแล้วดึงข้อมูลได้อีกครั้ง"""
    app.load()
    app.reload()
    assert "live" in app.attr("#status", "class")
    assert app.result() != "—"
    assert "USD" in app.text("#rateline")


@pytest.mark.live
def test_live_history_01_chart_is_available(app):
    """LIVE-HISTORY-01 โหลดข้อมูลกราฟย้อนหลังจาก API จริง"""
    app.load()
    app.click('#chart-range [data-range="7"]')
    app.wait_true(lambda: app.count("#chart-svg svg.chart") == 1, "ไม่พบกราฟย้อนหลัง")
    assert "NaN" not in app.text("#chart")


@pytest.mark.live
def test_live_robust_01_refresh_recovers(app):
    """LIVE-ROBUST-01 API ตอบสนองช้าแต่หน้าไม่ค้างถาวร"""
    app.load()
    _refresh_live(app)
    assert app.el("#refresh").is_enabled()
    assert app.result() != "—"
