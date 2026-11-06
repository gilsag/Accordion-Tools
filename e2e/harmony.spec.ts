import { test, expect, openApp, workspace, openToolsSheet, closeToolsSheet, recordAudioStarts } from "./fixtures";

test("a recorded Harmony progression plays on the audio clock and stops", async ({ page }) => {
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  await workspace(page, "Harmony");
  await openToolsSheet(page);
  await page.getByRole("button", { name: "Start recording" }).click();
  await closeToolsSheet(page);
  const chords = page.locator(".harmonic-circle text.chord-label, svg text.chord-label");
  for (const index of [0, 3, 5]) await chords.nth(index).click();
  await openToolsSheet(page);
  await page.getByRole("button", { name: "Stop recording" }).click();
  await closeToolsSheet(page);

  const bar = page.locator(".playback-bar");
  const before = await audioStarts();
  await bar.getByRole("button", { name: "Play" }).click();
  await expect(bar.getByRole("button", { name: "Play" })).toBeDisabled();
  await expect.poll(audioStarts, { timeout: 15_000 }).toBeGreaterThan(before);
  await bar.getByRole("button", { name: "Stop" }).click();
  await expect(bar.getByRole("button", { name: "Play" })).toBeEnabled();
  await page.waitForTimeout(200);
  const afterStop = await audioStarts();
  await page.waitForTimeout(1500);
  expect(await audioStarts(), "no notes start after Stop").toBe(afterStop);
});
