import pytest


@pytest.mark.smoke
def test_tc_chart_01_default(app):
    """TC-CHART-01 แสดงกราฟเริ่มต้น 30 วันของ USD → THB"""
    app.load()
    app.wait_text("#chart-title", "USD → THB")
    assert app.attr('#chart-range [data-range="30"]', "aria-pressed") == "true"
    app.wait_attr("#chart-svg svg.chart", "data-points", "31")
    # mock: ต้นช่วง 0.9×35 = 31.5, ปลายช่วง 35
    app.wait_text("#st-latest", "35")
    app.wait_text("#st-min", "31.5")
    app.wait_text("#st-max", "35")
    app.wait_text("#st-chg", "+11.111%")
    assert "up" in app.attr("#st-chg", "class")


def test_tc_chart_02_ranges(app):
    """TC-CHART-02 สลับช่วง 7 / 90 วัน"""
    app.load()
    app.click('#chart-range [data-range="7"]')
    app.wait_attr("#chart-svg svg.chart", "data-points", "8")
    assert app.attr('#chart-range [data-range="7"]', "aria-pressed") == "true"
    app.click('#chart-range [data-range="90"]')
    app.wait_attr("#chart-svg svg.chart", "data-points", "91")
    assert app.attr('#chart-range [data-range="7"]', "aria-pressed") == "false"


def test_tc_chart_03_follow_converter_pair(app):
    """TC-CHART-03 เปลี่ยนคู่เงินในตัวแปลง กราฟเปลี่ยนตาม"""
    app.load()
    app.select("#to", "JPY")
    app.wait_text("#chart-title", "USD → JPY")
    app.wait_text("#st-latest", "150")
    app.wait_text("#st-min", "135")
    app.wait_text("#st-max", "150")


def test_tc_chart_04_same_currency(app):
    """TC-CHART-04 สกุลต้นทางและปลายทางเหมือนกัน"""
    app.load()
    app.select("#to", "USD")
    app.wait_text("#chart-msg", "เลือกสองสกุลที่ต่างกัน", exact=False)
    assert app.count("#chart-svg svg.chart") == 0


def test_tc_chart_05_no_history_for_currency(app):
    """TC-CHART-05 ผู้ให้บริการไม่มีข้อมูลย้อนหลังของสกุลนั้น"""
    app.load()
    app.select("#to", "VND")  # mock ไม่มี VND → 404
    app.wait_text("#chart-msg", "ไม่มีข้อมูลย้อนหลัง", exact=False)
    assert app.count("#chart-svg svg.chart") == 0
    app.select("#to", "EUR")
    app.wait_attr("#chart-svg svg.chart", "data-points", "31")


def test_tc_chart_06_history_failure_keeps_converter(app):
    """TC-CHART-06 โหลดข้อมูลย้อนหลังไม่ได้ ไม่กระทบตัวแปลงหลัก
    (mock ล่มทั้งสอง endpoint พร้อมกัน จึงเช็กว่าตัวแปลงยังใช้ข้อมูลสำรองได้)"""
    app.servers.set_mock_failure(True)
    app.load(live=False)
    app.wait_text("#chart-msg", "ไม่มีข้อมูลย้อนหลัง", exact=False)
    app.wait_text("#result", "33,500 THB")
