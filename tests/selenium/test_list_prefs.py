import pytest


@pytest.fixture(autouse=True)
def _open(app):
    app.load()


def test_tc_list_01_total_currencies(app):
    """TC-LIST-01 แสดงสกุลเงินครบ 33 รายการ"""
    app.wait_count("#all .item", 33)


@pytest.mark.smoke
def test_tc_list_02_search_by_code(app):
    """TC-LIST-02 ค้นหาด้วยรหัส (ไม่สนตัวพิมพ์เล็กใหญ่)"""
    app.set_value("#q", "jpy")
    app.wait_count("#all .item", 1)
    assert "JPY" in app.text("#all .item")


def test_tc_list_03_search_by_thai_name(app):
    """TC-LIST-03 ค้นหาด้วยชื่อภาษาไทย"""
    app.set_value("#q", "ยูโร")
    app.wait_count("#all .item", 1)
    assert "EUR" in app.text("#all .item")


def test_tc_list_04_no_result(app):
    """TC-LIST-04 ค้นหาแล้วไม่พบ"""
    app.set_value("#q", "zzz")
    app.wait_count("#all .item", 0)
    app.wait_text("#all .empty", "ไม่พบสกุลเงิน")


def test_tc_pref_01_remember_selection(app):
    """TC-PREF-01 จำสกุลที่เลือกไว้หลังรีโหลด"""
    app.select("#from", "EUR")
    app.select("#to", "GBP")
    app.select("#base", "USD")
    app.reload()
    assert app.selected("#from") == "EUR"
    assert app.selected("#to") == "GBP"
    assert app.selected("#base") == "USD"


def test_tc_ui_01_mobile_no_horizontal_scroll(app):
    """TC-UI-01 หน้าจอเล็กไม่มีการเลื่อนแนวนอน (รัน headless เพื่อให้ย่อหน้าต่างได้ถึง 375px)"""
    app.d.set_window_size(375, 667)
    if app.d.execute_script("return window.innerWidth") > 420:
        pytest.skip("เบราว์เซอร์ไม่ยอมย่อหน้าต่างถึง 375px — รันแบบ headless แทน")
    app.star_in_list("JPY")
    overflow = app.d.execute_script("return document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 0
