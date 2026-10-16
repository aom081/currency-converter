import { test, expect, type Download } from "@playwright/test";
import { readFileSync } from "node:fs";
import { mockApi, openApp, refreshAndWait, ui } from "./helpers";

async function readCsv(download: Download): Promise<{ raw: string; lines: string[] }> {
  const raw = readFileSync(await download.path(), "utf8");
  return { raw, lines: raw.replace(/^\ufeff/, "").trim().split(/\r?\n/) };
}

test.describe("ส่งออก CSV", () => {
  test("TC-CSV-01 ส่งออกข้อมูลกราฟย้อนหลัง", { tag: "@smoke" }, async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    await expect(ui.exportChart(page)).toBeEnabled();
    const [dl] = await Promise.all([page.waitForEvent("download"), ui.exportChart(page).click()]);
    expect(dl.suggestedFilename()).toBe("USD-THB-30d.csv");
    const { raw, lines } = await readCsv(dl);
    expect(raw.startsWith("\ufeff")).toBe(true); // BOM ให้ Excel อ่านภาษาไทยถูก
    expect(lines).toHaveLength(32); // หัวตาราง + 31 วัน
    expect(lines[0]).toBe("date,rate");
    expect(lines[1].endsWith(",31.5")).toBe(true);
    expect(lines[31].endsWith(",35")).toBe(true);
  });

  test("TC-CSV-02 ไม่มีกราฟ ปุ่มส่งออกกราฟใช้ไม่ได้", async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    await ui.to(page).selectOption("USD");
    await expect(ui.exportChart(page)).toBeDisabled();
    await ui.to(page).selectOption("EUR");
    await expect(ui.exportChart(page)).toBeEnabled();
  });

  test("TC-CSV-03 ส่งออกประวัติอัตราของรายการที่ติดตาม", async ({ page }) => {
    const mock = await mockApi(page);
    await openApp(page);
    await ui.listStar(page, "JPY").click();
    await ui.listStar(page, "EUR").click();
    mock.rates.JPY = 140;
    await refreshAndWait(page, mock);
    const [dl] = await Promise.all([page.waitForEvent("download"), ui.exportWatch(page).click()]);
    expect(dl.suggestedFilename()).toBe("watchlist-THB.csv");
    const { lines } = await readCsv(dl);
    expect(lines).toHaveLength(3); // หัวตาราง + ข้อมูล 2 รอบ
    expect(lines[0]).toBe("time,JPY/THB,EUR/THB");
    const row1 = lines[1].split(",");
    const row2 = lines[2].split(",");
    expect(new Date(row1[0]).toString()).not.toBe("Invalid Date");
    expect(row1.slice(1)).toEqual(["0.233333", "38.888889"]); // 35/150, 35/0.9
    expect(row2.slice(1)).toEqual(["0.25", "38.888889"]); // 35/140
  });

  test("TC-CSV-04 ยังไม่ติดตามสกุลใด ปุ่มส่งออกรายการใช้ไม่ได้", async ({ page }) => {
    await mockApi(page);
    await openApp(page);
    await expect(ui.exportWatch(page)).toBeDisabled();
    await ui.listStar(page, "JPY").click();
    await expect(ui.exportWatch(page)).toBeEnabled();
  });
});
