import pytest


@pytest.fixture(autouse=True)
def _open(app):
    app.load()


@pytest.mark.smoke
def test_tc_multi_01_empty(app):
    """TC-MULTI-01 ยังไม่ติดตามสกุลใด แสดงข้อความแนะนำ"""
    assert app.count("#multi .mrow") == 0
    app.wait_text("#multi .empty", "ติดตามสกุลเงิน", exact=False)


@pytest.mark.smoke
def test_tc_multi_02_all_watched(app):
    """TC-MULTI-02 แสดงผลทุกสกุลที่ติดตาม"""
    for code in ("JPY", "EUR", "GBP"):
        app.star_in_list(code)
    app.wait_text("#multi-head", "จาก 1,000 USD")
    app.wait_count("#multi .mrow", 3)
    app.wait_text('[data-multi="JPY"] .mval', "150,000 JPY")
    app.wait_text('[data-multi="EUR"] .mval', "900 EUR")
    app.wait_text('[data-multi="GBP"] .mval', "800 GBP")


def test_tc_multi_03_amount_change(app):
    """TC-MULTI-03 เปลี่ยนจำนวนเงินแล้วตารางเปลี่ยนตาม"""
    app.star_in_list("JPY")
    app.star_in_list("EUR")
    app.set_value("#amt", "2")
    app.wait_text("#multi-head", "จาก 2 USD")
    app.wait_text('[data-multi="JPY"] .mval', "300 JPY")
    app.wait_text('[data-multi="EUR"] .mval', "1.8 EUR")


def test_tc_multi_04_change_source(app):
    """TC-MULTI-04 เปลี่ยนสกุลต้นทาง และไม่แสดงแถวของสกุลต้นทางเอง"""
    for code in ("THB", "JPY", "EUR"):
        app.star_in_list(code)
    app.select("#from", "THB")
    app.wait_count("#multi .mrow", 2)
    app.wait_text('[data-multi="JPY"] .mval', "4,285.71 JPY")
    app.wait_text('[data-multi="EUR"] .mval', "25.7143 EUR")


def test_tc_multi_05_unstar(app):
    """TC-MULTI-05 เลิกติดตามแล้วแถวหายไป"""
    app.star_in_list("JPY")
    app.wait_count("#multi .mrow", 1)
    app.star_in_list("JPY")
    app.wait_count("#multi .mrow", 0)
