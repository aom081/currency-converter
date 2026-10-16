import pytest


@pytest.fixture
def three(app):
    app.load()
    app.watch_three()  # JPY, EUR, GBP
    return app


@pytest.mark.smoke
def test_tc_sort_01_default_manual(three):
    """TC-SORT-01 ค่าเริ่มต้นเรียงตามที่เพิ่ม (กำหนดเอง)"""
    assert three.selected("#watch-sort") == "manual"
    three.wait_codes(["JPY", "EUR", "GBP"])


def test_tc_sort_02_move_buttons(three):
    """TC-SORT-02 เลื่อนการ์ดขึ้น/ลงด้วยปุ่ม ▲▼"""
    assert not three.el('[data-move-up="JPY"]').is_enabled()
    assert not three.el('[data-move-down="GBP"]').is_enabled()
    three.click('[data-move-down="JPY"]')
    three.wait_codes(["EUR", "JPY", "GBP"])
    three.click('[data-move-up="GBP"]')
    three.wait_codes(["EUR", "GBP", "JPY"])


def test_tc_sort_03_by_code(three):
    """TC-SORT-03 เรียงตามรหัสสกุล A→Z"""
    three.select("#watch-sort", "code")
    three.wait_codes(["EUR", "GBP", "JPY"])


@pytest.mark.smoke
def test_tc_sort_04_by_gain_and_loss(three):
    """TC-SORT-04 เรียงตามแข็งค่า/อ่อนค่ามากสุด"""
    three.servers.set_mock_rates(JPY=140, EUR=0.95)  # JPY +7.143%, EUR -5.263%, GBP 0%
    three.refresh_and_wait()
    three.select("#watch-sort", "gain")
    three.wait_codes(["JPY", "GBP", "EUR"])
    three.select("#watch-sort", "loss")
    three.wait_codes(["EUR", "GBP", "JPY"])


def test_tc_sort_05_persist(three):
    """TC-SORT-05 จำโหมดเรียงและลำดับที่จัดเองหลังรีโหลด"""
    three.click('[data-move-down="JPY"]')
    three.reload()
    three.wait_codes(["EUR", "JPY", "GBP"])
    three.select("#watch-sort", "code")
    three.reload()
    assert three.selected("#watch-sort") == "code"
    three.wait_codes(["EUR", "GBP", "JPY"])


def test_tc_sort_06_move_buttons_only_in_manual(three):
    """TC-SORT-06 ปุ่ม ▲▼ แสดงเฉพาะโหมดกำหนดเอง"""
    assert three.count("[data-move-down]") == 3
    three.select("#watch-sort", "code")
    three.wait_count("[data-move-down]", 0)
    three.select("#watch-sort", "manual")
    three.wait_count("[data-move-down]", 3)
