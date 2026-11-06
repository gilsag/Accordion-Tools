import { test, expect, openApp, openTool, closeToolsSheet, recordAudioStarts, type Page } from "./fixtures";

async function playThenStop(page: Page, audioStarts: () => Promise<number>) {
  const bar = page.locator(".playback-bar");
  const play = bar.locator(".playback-bar-play");
  await expect(play).toBeEnabled();
  const before = await audioStarts();
  await play.click();
  await expect.poll(audioStarts, { timeout: 15_000 }).toBeGreaterThan(before);
  await expect(play).toBeDisabled();
  await bar.getByRole("button", { name: "Stop" }).click();
  await expect(play).toBeEnabled();
  await page.waitForTimeout(200);
  const afterStop = await audioStarts();
  await page.waitForTimeout(1500);
  expect(await audioStarts(), "no notes start after Stop").toBe(afterStop);
}

test("the ABC Player plays, pauses, continues and stops", async ({ page }) => {
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  await openTool(page, "ABC Player");
  await page.getByLabel("Example tune").selectOption("bella-ciao");
  await closeToolsSheet(page);
  const bar = page.locator(".playback-bar");
  await bar.locator(".playback-bar-play").click();
  await expect.poll(audioStarts, { timeout: 15_000 }).toBeGreaterThan(0);
  await bar.getByRole("button", { name: "Pause" }).click();
  await expect(bar.locator(".playback-bar-play")).toHaveText(/Continue/);
  await page.waitForTimeout(200);
  const paused = await audioStarts();
  await page.waitForTimeout(1000);
  expect(await audioStarts(), "paused").toBe(paused);
  await bar.locator(".playback-bar-play").click();
  await expect.poll(audioStarts, { timeout: 10_000 }).toBeGreaterThan(paused);
  await bar.getByRole("button", { name: "Stop" }).click();
  await expect(bar.locator(".playback-bar-play")).toHaveText(/Play/);
});

test("the Bass Pattern Player plays and stops", async ({ page }) => {
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  await openTool(page, "Bass Pattern Player");
  await closeToolsSheet(page);
  await playThenStop(page, audioStarts);
});

test("the Sequence player shows it is playing until the sequence ends", async ({ page }) => {
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  await openTool(page, "Sequence");
  await page.getByRole("button", { name: "Record sequence" }).click();
  await closeToolsSheet(page);
  const diagramButtons = page.locator("svg [data-button-id]");
  for (const index of [20, 21, 22]) await diagramButtons.nth(index).click();
  await openTool(page, "Sequence");
  await page.getByRole("button", { name: "Stop recording" }).click();
  await closeToolsSheet(page);
  const play = page.locator(".playback-bar .playback-bar-play");
  const before = await audioStarts();
  await play.click();
  await expect.poll(audioStarts, { timeout: 15_000 }).toBeGreaterThan(before);
  await expect(play, "Play is disabled while the sequence plays").toBeDisabled();
  await expect(play, "Play returns when the sequence ends").toBeEnabled({ timeout: 15_000 });
});

test("the Bass Pattern tempo names its beat", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Bass Pattern Player");
  const tempo = page.locator("label", { hasText: /^Tempo:/ });
  await expect(tempo).toContainText("quarter-note beat");
  await page.locator("select:has(option[value='tarantella'])").selectOption("tarantella");
  await expect(tempo).toContainText("dotted-quarter beat");
});

