import pytest

DARK_BG = "rgb(14, 16, 32)"
LIGHT_BG = "rgb(246, 247, 251)"


@pytest.fixture(autouse=True)
def _open(app):
    app.load()


@pytest.mark.smoke
def test_tc_theme_01_default_is_auto(app):
    """TC-THEME-01 ค่าเริ่มต้นคือ 'ตามระบบ'"""
    assert app.attr('[data-theme-set="auto"]', "aria-pressed") == "true"
    assert app.attr('[data-theme-set="dark"]', "aria-pressed") == "false"
    assert app.html_theme() is None


@pytest.mark.smoke
def test_tc_theme_02_dark(app):
    """TC-THEME-02 เลือกธีมมืด"""
    app.choose_theme("dark")
    assert app.html_theme() == "dark"
    assert app.attr('[data-theme-set="dark"]', "aria-pressed") == "true"
    app.wait_bg(DARK_BG)


def test_tc_theme_03_back_to_light(app):
    """TC-THEME-03 เลือกมืดแล้วกลับเป็นธีมสว่าง"""
    app.choose_theme("dark")
    app.choose_theme("light")
    assert app.html_theme() == "light"
    app.wait_bg(LIGHT_BG)


def test_tc_theme_04_persist(app):
    """TC-THEME-04 จำธีมที่เลือกหลังรีโหลด"""
    app.choose_theme("dark")
    app.reload()
    assert app.html_theme() == "dark"
    assert app.attr('[data-theme-set="dark"]', "aria-pressed") == "true"
    app.wait_bg(DARK_BG)
