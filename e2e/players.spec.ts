import { test, expect, openApp, openTool, closeToolsSheet, isPhone, recordAudioStarts, type Page } from "./fixtures";

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
  await openTool(page, "Annotate Diagram");
  await page.getByRole("group", { name: "Click mode" }).getByRole("button", { name: "Sequence" }).click();
  await closeToolsSheet(page);
  const diagramButtons = page.locator("svg [data-button-id]");
  for (const index of [20, 21, 22]) await diagramButtons.nth(index).click();
  await expect(page.locator("svg .sequence-number")).toHaveCount(3);
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


test("a two-voice tune plays both hands at once, or one side when chosen", async ({ page }) => {
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  await openTool(page, "ABC Player");
  const hands = page.getByRole("group", { name: "Hands" });
  await expect(hands.getByRole("button", { name: "Both" })).toHaveAttribute("aria-pressed", "true");
  // The first opening loads Happy Birthday, so both hands show at once.
  await expect(page.getByLabel("Example tune")).toHaveValue("happy-birthday");
  await expect(page.locator("svg.abc-hands-diagram [data-hand='stradella']")).toHaveCount(1);
  await page.getByLabel("Example tune").selectOption("katyusha");
  await expect(page.getByLabel("Example tune")).toHaveValue("katyusha");
  await expect(page.getByText("Two-voice tunes play voice 1 on the treble")).toBeVisible();
  await closeToolsSheet(page);

  const both = page.locator("svg.abc-hands-diagram");
  const treble = both.locator("[data-hand='treble']");
  const stradella = both.locator("[data-hand='stradella']");
  await expect(both).toHaveCount(1);
  await expect(page.locator("svg .bellows-strip"), "no bellows guide in Both view").toHaveCount(0);
  await expect(page.locator("svg .stradella-row-label"), "no row names in Both view").toHaveCount(0);
  if (isPhone(page)) {
    // Phones show one manual at a time: the current side first, Treble on request.
    const show = page.getByRole("group", { name: "Show" });
    await expect(stradella).toHaveCount(1);
    await expect(treble).toHaveCount(0);
    await show.getByRole("button", { name: "Treble" }).click();
    await expect(treble).toHaveCount(1);
    await expect(stradella).toHaveCount(0);
  } else {
    await expect(treble).toContainText("Treble, voice 1");
    await expect(stradella).toContainText("Stradella, voice 2");
    const trebleBox = await treble.boundingBox();
    const stradellaBox = await stradella.boundingBox();
    expect(trebleBox!.y, "Treble above Stradella").toBeLessThan(stradellaBox!.y);
  }

  const bar = page.locator(".playback-bar");
  const before = await audioStarts();
  await bar.locator(".playback-bar-play").click();
  await expect.poll(audioStarts, { timeout: 15_000 }).toBeGreaterThan(before + 1);
  if (!isPhone(page)) {
    await expect(treble.locator(".abc-match").first(), "melody lights the treble").toBeVisible({ timeout: 10_000 });
    await expect(stradella.locator(".abc-match").first(), "bass lights the Stradella").toBeVisible({ timeout: 10_000 });
  }
  await bar.getByRole("button", { name: "Pause" }).click();
  if (!isPhone(page)) {
    // Pause keeps the last played button of each hand lit, and they stay lit.
    await page.waitForTimeout(800);
    await expect(treble.locator(".abc-match").first()).toBeVisible();
    await expect(stradella.locator(".abc-match").first()).toBeVisible();
  }
  await bar.getByRole("button", { name: "Stop" }).click();
  await expect(page.locator("svg .abc-match"), "Stop clears the highlights").toHaveCount(0);

  if (!isPhone(page)) {
    // Show notation opens the staff in the results panel, not under the diagram.
    await page.locator(".topbar").getByRole("button", { name: "Show notation" }).click();
    await expect(page.locator(".workspace-inspector .rendered-abc svg").first()).toBeVisible();
    await expect(page.locator(".rendered-notation-panel")).toHaveCount(0);
  }

  // Choosing one side shows only that diagram and switches the workspace to it.
  await openTool(page, "ABC Player");
  await hands.getByRole("button", { name: "Treble" }).click();
  await expect(page.locator(".topbar-primary.active")).toHaveText(/Treble/);
  await closeToolsSheet(page);
  await expect(both).toHaveCount(0);
  await expect(page.locator("svg [data-button-id^='treble-']").first()).toBeVisible();
});
