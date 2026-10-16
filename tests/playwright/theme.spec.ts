import { test, expect, type Page } from "@playwright/test";
import { mockApi, openApp, ui } from "./helpers";

const DARK_BG = "rgb(14, 16, 32)";
const LIGHT_BG = "rgb(246, 247, 251)";
const bodyBg = (p: Page) => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
const htmlTheme = (p: Page) => p.evaluate(() => document.documentElement.getAttribute("data-theme"));

test.describe("ธีม", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.emulateMedia({ colorScheme: "light" });
    await openApp(page);
  });

  test("TC-THEME-01 ค่าเริ่มต้นคือ 'ตามระบบ'", { tag: "@smoke" }, async ({ page }) => {
    await expect(ui.themeBtn(page, "auto")).toHaveAttribute("aria-pressed", "true");
    await expect(ui.themeBtn(page, "dark")).toHaveAttribute("aria-pressed", "false");
    expect(await htmlTheme(page)).toBeNull();
    await expect.poll(() => bodyBg(page)).toBe(LIGHT_BG);
  });

  test("TC-THEME-02 เลือกธีมมืด", { tag: "@smoke" }, async ({ page }) => {
    await ui.themeBtn(page, "dark").click();
    expect(await htmlTheme(page)).toBe("dark");
    await expect(ui.themeBtn(page, "dark")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);
  });

  test("TC-THEME-03 เลือกมืดแล้วกลับเป็นธีมสว่าง", async ({ page }) => {
    await ui.themeBtn(page, "dark").click();
    await ui.themeBtn(page, "light").click();
    expect(await htmlTheme(page)).toBe("light");
    await expect.poll(() => bodyBg(page)).toBe(LIGHT_BG);
  });

  test("TC-THEME-04 จำธีมที่เลือกหลังรีโหลด", async ({ page }) => {
    await ui.themeBtn(page, "dark").click();
    await page.reload();
    await expect(ui.status(page)).toContainText("● สด");
    expect(await htmlTheme(page)).toBe("dark");
    await expect(ui.themeBtn(page, "dark")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);
  });

  test("TC-THEME-05 'ตามระบบ' เปลี่ยนตามโหมดของระบบ", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);
    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => bodyBg(page)).toBe(LIGHT_BG);
  });

  test("TC-THEME-06 เลือกเอง ชนะโหมดของระบบ", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await ui.themeBtn(page, "light").click();
    await expect.poll(() => bodyBg(page)).toBe(LIGHT_BG);
    await ui.themeBtn(page, "auto").click(); // กลับไปตามระบบ (ซึ่งเป็นมืด)
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);
  });
});
