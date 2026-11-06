import { test, expect, openApp, openTool, closeToolsSheet, recordAudioStarts, type Page } from "./fixtures";

const rows = (page: Page) => page.locator(".harmony-progression-list > li");
const chordName = (page: Page, index: number) => rows(page).nth(index).locator(".progression-chord-name strong");

async function loadPreset(page: Page) {
  await openApp(page);
  await openTool(page, "Progression Assistant");
  await page.getByRole("button", { name: "Use preset" }).click();
  await page.getByRole("button", { name: /Load preset/i }).click();
  await expect(rows(page).first()).toBeVisible();
}

test("each chord row moves up, down and is removed with one click", async ({ page }) => {
  await loadPreset(page);
  const before = await rows(page).count();
  expect(before).toBeGreaterThan(2);
  const first = await chordName(page, 0).innerText();
  const second = await chordName(page, 1).innerText();
  await rows(page).nth(1).getByRole("button", { name: "Move chord earlier" }).click();
  await expect(chordName(page, 0)).toHaveText(second);
  await expect(chordName(page, 1)).toHaveText(first);
  await rows(page).nth(0).getByRole("button", { name: "Move chord later" }).click();
  await expect(chordName(page, 0)).toHaveText(first);
  await rows(page).nth(0).getByRole("button", { name: "Remove chord" }).click();
  await expect(rows(page)).toHaveCount(before - 1);
});

test("the playback bar plays and stops the progression", async ({ page }) => {
  const audioStarts = await recordAudioStarts(page);
  await loadPreset(page);
  await closeToolsSheet(page);
  const bar = page.locator(".playback-bar");
  const play = bar.getByRole("button", { name: "Play" });
  await play.click();
  await expect.poll(audioStarts, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(play, "Play is disabled while the progression plays").toBeDisabled();
  await bar.getByRole("button", { name: "Stop" }).click();
  await expect(play).toBeEnabled();
  // Nothing new starts once stopped.
  await page.waitForTimeout(200);
  const afterStop = await audioStarts();
  await page.waitForTimeout(1500);
  expect(await audioStarts()).toBe(afterStop);
});
