import pytest


@pytest.fixture(autouse=True)
def _open(app):
    app.load()


@pytest.mark.smoke
def test_tc_watch_01_empty_state(app):
    """TC-WATCH-01 เริ่มต้นแสดงข้อความว่าง"""
    app.wait_text("#watch .empty", "ยังไม่มีสกุลเงินที่ติดตาม", exact=False)


@pytest.mark.smoke
def test_tc_watch_02_star_adds_card(app):
    """TC-WATCH-02 กดดาวเพื่อติดตามแล้วขึ้นการ์ด"""
    app.star_in_list("JPY")
    app.wait_text('#all [data-star="JPY"]', "★")
    app.wait_count("#watch .w", 1)
    assert "JPY" in app.text("#watch .w")
    app.wait_text("#watch .w .rate", "0.233333", exact=False)  # 35 / 150


def test_tc_watch_03_unstar_from_card(app):
    """TC-WATCH-03 เลิกติดตามจากการ์ด"""
    app.star_in_list("JPY")
    app.unstar_card("JPY")
    app.wait_count("#watch .w", 0)
    app.wait_text('#all [data-star="JPY"]', "☆")
    app.wait_text("#watch .empty", "ยังไม่มีสกุลเงินที่ติดตาม", exact=False)


def test_tc_watch_04_persist_after_reload(app):
    """TC-WATCH-04 รายการติดตามคงอยู่หลังรีโหลดหน้า"""
    app.star_in_list("EUR")
    app.reload()
    app.wait_count("#watch .w", 1)
    assert "EUR" in app.text("#watch .w")


@pytest.mark.smoke
def test_tc_watch_05_rate_up(app):
    """TC-WATCH-05 สกุลเงินแข็งค่าขึ้น แสดง ▲ สีเขียว"""
    app.star_in_list("JPY")
    app.servers.set_mock_rates(JPY=140)  # 35/140 = 0.25
    app.refresh_and_wait()
    app.wait_text("#watch .chg span:nth-child(1)", "▲ ล่าสุด +7.143%")
    app.wait_text("#watch .chg span:nth-child(2)", "▲ ตั้งแต่ติดตาม +7.143%")
    assert "up" in app.attr("#watch .chg span:nth-child(1)", "class")


def test_tc_watch_06_rate_down(app):
    """TC-WATCH-06 สกุลเงินอ่อนค่าลง แสดง ▼ สีแดง"""
    app.star_in_list("JPY")
    app.servers.set_mock_rates(JPY=160)  # 35/160 = 0.21875
    app.refresh_and_wait()
    app.wait_text("#watch .chg span:nth-child(1)", "▼ ล่าสุด -6.250%")
    assert "down" in app.attr("#watch .chg span:nth-child(1)", "class")


def test_tc_watch_07_rate_unchanged(app):
    """TC-WATCH-07 อัตราไม่เปลี่ยน แสดง • 0.000%"""
    app.star_in_list("JPY")
    app.refresh_and_wait()
    app.wait_text("#watch .chg span:nth-child(1)", "• ล่าสุด 0.000%")
    assert "flat" in app.attr("#watch .chg span:nth-child(1)", "class")


def test_tc_watch_08_change_base(app):
    """TC-WATCH-08 เปลี่ยนสกุลฐานแล้วอัตราในการ์ดเปลี่ยนตาม"""
    app.star_in_list("JPY")
    app.select("#base", "USD")
    app.wait_text("#watch .w .rate", "0.006667", exact=False)  # 1 / 150


def test_tc_watch_09_star_same_as_base(app):
    """TC-WATCH-09 ติดตามสกุลเดียวกับสกุลฐาน ไม่แสดงการ์ด"""
    app.star_in_list("THB")  # สกุลฐานเริ่มต้นคือ THB
    app.wait_count("#watch .w", 0)
    app.wait_text("#watch .empty", "เลือกสกุลอื่น", exact=False)


def test_tc_watch_10_multiple(app):
    """TC-WATCH-10 ติดตามหลายสกุลพร้อมกัน"""
    for code in ("JPY", "EUR", "GBP"):
        app.star_in_list(code)
    app.wait_count("#watch .w", 3)
