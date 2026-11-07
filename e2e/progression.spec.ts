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

test("presets with secondary dominants and minor-key numerals load", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Progression Assistant");
  await page.getByRole("button", { name: "Use preset" }).click();
  const preset = page.locator("select:has(option[value='bird-blues'])");
  for (const [id, chords] of [["bird-blues", 12], ["coltrane-changes", 7], ["andalusian-cadence", 4], ["folia", 9]] as const) {
    await preset.selectOption(id);
    await expect(page.getByText(/Unsupported/i)).toHaveCount(0);
    await page.getByRole("button", { name: /Load preset/i }).click();
    await expect(rows(page)).toHaveCount(chords);
  }
  // Bird Blues in C: the fifth chord is V7/IV, which is C7.
  await preset.selectOption("bird-blues");
  await page.getByRole("button", { name: /Load preset/i }).click();
  await expect(chordName(page, 4)).toHaveText("C7");
});

test("in root position every chord has its root on a bass button", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Progression Assistant");
  await page.getByRole("button", { name: "Use preset" }).click();
  await page.locator("select:has(option[value='fifties'])").selectOption("fifties");
  await page.getByRole("button", { name: /Load preset/i }).click();
  await expect(page.locator(".progression-chord-recipe")).toHaveText([
    "C bass + C major", "A bass + A minor", "F bass + F major", "G bass + G major",
  ]);
  await page.getByRole("button", { name: "Any bass", exact: true }).click();
  await expect(page.locator(".progression-chord-recipe").first()).not.toHaveText("C bass + C major");
});

