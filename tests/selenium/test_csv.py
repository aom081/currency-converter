import datetime

from app_page import wait_for_download


def _lines(raw):
    return raw.lstrip("\ufeff").strip().splitlines()


def test_tc_csv_01_export_chart(app, download_dir):
    """TC-CSV-01 ส่งออกข้อมูลกราฟย้อนหลัง"""
    app.load()
    app.wait_true(lambda: app.el("#export-chart").is_enabled(), "ปุ่มส่งออกกราฟยังใช้ไม่ได้")
    app.click("#export-chart")
    raw = wait_for_download(download_dir, "USD-THB-30d.csv")
    assert raw.startswith("\ufeff")  # BOM ให้ Excel อ่านภาษาไทยถูก
    lines = _lines(raw)
    assert len(lines) == 32  # หัวตาราง + 31 วัน
    assert lines[0] == "date,rate"
    assert lines[1].endswith(",31.5")
    assert lines[31].endswith(",35")


def test_tc_csv_02_chart_export_disabled_without_chart(app):
    """TC-CSV-02 ไม่มีกราฟ ปุ่มส่งออกกราฟใช้ไม่ได้"""
    app.load()
    app.select("#to", "USD")
    app.wait_true(lambda: not app.el("#export-chart").is_enabled(), "ปุ่มควรใช้ไม่ได้เมื่อไม่มีกราฟ")
    app.select("#to", "EUR")
    app.wait_true(lambda: app.el("#export-chart").is_enabled(), "ปุ่มควรใช้ได้เมื่อมีกราฟ")


def test_tc_csv_03_export_watchlist(app, download_dir):
    """TC-CSV-03 ส่งออกประวัติอัตราของรายการที่ติดตาม"""
    app.load()
    app.star_in_list("JPY")
    app.star_in_list("EUR")
    app.servers.set_mock_rates(JPY=140)
    app.refresh_and_wait()
    app.click("#export-watch")
    lines = _lines(wait_for_download(download_dir, "watchlist-THB.csv"))
    assert len(lines) == 3  # หัวตาราง + ข้อมูล 2 รอบ
    assert lines[0] == "time,JPY/THB,EUR/THB"
    row1, row2 = lines[1].split(","), lines[2].split(",")
    datetime.datetime.fromisoformat(row1[0].replace("Z", "+00:00"))  # เวลาถูกรูปแบบ
    assert row1[1:] == ["0.233333", "38.888889"]  # 35/150, 35/0.9
    assert row2[1:] == ["0.25", "38.888889"]  # 35/140


def test_tc_csv_04_watch_export_disabled_when_empty(app):
    """TC-CSV-04 ยังไม่ติดตามสกุลใด ปุ่มส่งออกรายการใช้ไม่ได้"""
    app.load()
    assert not app.el("#export-watch").is_enabled()
    app.star_in_list("JPY")
    app.wait_true(lambda: app.el("#export-watch").is_enabled(), "ปุ่มควรใช้ได้หลังติดตาม")
