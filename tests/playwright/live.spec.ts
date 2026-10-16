import { test, expect } from "@playwright/test";
import { openApp, ui } from "./helpers";

test.describe("Live API smoke", () => {
  test("เชื่อมต่อ API จริงและคำนวณค่าเงินได้", async ({ page }) => {
    await openApp(page);
    await expect(ui.result(page)).not.toHaveText("—");
    await expect(ui.rateline(page)).toContainText("USD");
    await expect(ui.rateline(page)).toContainText("THB");
  });
});

test.describe("Live API conversion group", () => {
  test("แปลงค่าเงินหลายกรณีด้วยอัตราจริง", async ({ page }) => {
    await openApp(page);

    await expect(ui.result(page)).toHaveText(/^[\d,.]+ THB$/);

    await ui.amount(page).fill("2");
    await expect(ui.result(page)).toHaveText(/^[\d,.]+ THB$/);

    await ui.to(page).selectOption("JPY");
    await expect(ui.result(page)).toHaveText(/^[\d,.]+ JPY$/);
    await expect(ui.rateline(page)).toContainText("USD");
    await expect(ui.rateline(page)).toContainText("JPY");

    await ui.swap(page).click();
    await expect(ui.from(page)).toHaveValue("JPY");
    await expect(ui.to(page)).toHaveValue("USD");
    await expect(ui.result(page)).toHaveText(/^[\d,.]+ USD$/);

    await ui.from(page).selectOption("EUR");
    await ui.to(page).selectOption("EUR");
    await expect(ui.result(page)).toHaveText("2 EUR");
  });
});
