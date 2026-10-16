import pytest


@pytest.fixture
def czk(app):
    """API ส่ง CZK มาเพิ่ม (ไม่อยู่ในรายการหลัก 33 สกุล)"""
    app.servers.set_mock_rates(CZK=22)
    app.load()
    return app


@pytest.mark.smoke
def test_tc_cur_01_extra_currency_listed(czk):
    """TC-CUR-01 สกุลที่ API ส่งมาเพิ่มขึ้นในรายการและค้นหาได้"""
    czk.wait_count("#all .item", 34)
    czk.set_value("#q", "czk")
    czk.wait_count("#all .item", 1)
    assert "CZK" in czk.text("#all .item")


def test_tc_cur_02_convert_to_extra(czk):
    """TC-CUR-02 เลือกสกุลเพิ่มเติมเป็นปลายทางแล้วคำนวณได้"""
    czk.select("#to", "CZK")
    czk.wait_text("#result", "22,000 CZK")


def test_tc_cur_03_watch_extra(czk):
    """TC-CUR-03 ติดตามสกุลเพิ่มเติมได้"""
    czk.star_in_list("CZK")
    czk.wait_count("#watch .w", 1)
    czk.wait_text("#watch .w .rate", "1.5909", exact=False)  # 35 / 22
