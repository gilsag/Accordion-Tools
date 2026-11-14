import { test, expect, openApp, openTool, closeToolsSheet, workspace, type Page } from "./fixtures";

/** Records when each scheduled sound starts, on the AudioContext clock. A
 * click is a 60 ms oscillator; with the default La Melodiosa source every
 * note is a sample, so the two cannot be confused. */
async function recordSounds(page: Page) {
  await page.addInitScript(() => {
    const log: { kind: "click" | "note"; at: number }[] = [];
    (window as unknown as { sounds: typeof log }).sounds = log;
    const started = new WeakMap<object, number>();
    const oscillator = OscillatorNode.prototype;
    const originalStart = oscillator.start;
    const originalStop = oscillator.stop;
    oscillator.start = function (this: OscillatorNode, when?: number) {
      started.set(this, when ?? this.context.currentTime);
      return originalStart.call(this, when);
    };
    oscillator.stop = function (this: OscillatorNode, when?: number) {
      const at = started.get(this);
      if (at !== undefined && when !== undefined && Math.abs(when - at - 0.06) < 1e-6)
        log.push({ kind: "click", at });
      return originalStop.call(this, when);
    };
    const buffer = AudioBufferSourceNode.prototype;
    const originalBufferStart = buffer.start;
    buffer.start = function (this: AudioBufferSourceNode, when?: number, ...rest: number[]) {
      log.push({ kind: "note", at: when ?? this.context.currentTime });
      return originalBufferStart.call(this, when, ...rest);
    };
  });
  return () =>
    page.evaluate(() =>
      [...(window as unknown as { sounds: { kind: string; at: number }[] }).sounds].sort(
        (a, b) => a.at - b.at,
      ),
    );
}

const toggle = (page: Page, name: "Count-in" | "Metronome") =>
  page.locator(".playback-bar").getByRole("button", { name, exact: true });

test("the count-in plays one bar of clicks, then the Rhythm Trainer starts", async ({ page }) => {
  const sounds = await recordSounds(page);
  await openApp(page);
  await openTool(page, "Bass–Treble Rhythm Trainer");
  await page.locator(".rhythm-trainer-controls select").first().selectOption("3/4");
  await closeToolsSheet(page);
  await toggle(page, "Count-in").click();
  await expect(toggle(page, "Count-in")).toHaveAttribute("aria-pressed", "true");
  await page.locator(".playback-bar-play").click();
  await expect
    .poll(async () => (await sounds()).filter((sound) => sound.kind === "note").length, {
      timeout: 15_000,
    })
    .toBeGreaterThan(0);
  await page.locator(".playback-bar").getByRole("button", { name: "Stop" }).click();

  const log = await sounds();
  const firstNote = log.find((sound) => sound.kind === "note")!.at;
  const countIn = log.filter((sound) => sound.kind === "click" && sound.at < firstNote - 1e-3);
  expect(countIn, "three clicks in 3/4").toHaveLength(3);
  // At 80 beats per minute a beat is 0.75 s; the music starts one beat after the last click.
  const gaps = [...countIn.map((click) => click.at), firstNote]
    .slice(1)
    .map((at, index) => at - countIn[index].at);
  for (const gap of gaps) expect(gap).toBeCloseTo(0.75, 2);
});

test("the metronome clicks on every beat while the ABC Player plays", async ({ page }) => {
  const sounds = await recordSounds(page);
  await openApp(page);
  await openTool(page, "ABC Player");
  await closeToolsSheet(page);
  await toggle(page, "Metronome").click();
  await page.locator(".playback-bar-play").click();
  await expect
    .poll(async () => (await sounds()).filter((sound) => sound.kind === "click").length, {
      timeout: 15_000,
    })
    .toBeGreaterThan(3);
  await page.locator(".playback-bar").getByRole("button", { name: "Stop" }).click();

  const clicks = (await sounds()).filter((sound) => sound.kind === "click").slice(0, 4);
  const firstNote = (await sounds()).find((sound) => sound.kind === "note")!.at;
  expect(clicks[0].at, "no count-in: the first click is with the music").toBeGreaterThanOrEqual(
    firstNote - 1.5,
  );
  const beat = clicks[1].at - clicks[0].at;
  expect(beat).toBeGreaterThan(0.2);
  expect(clicks[3].at - clicks[2].at).toBeCloseTo(beat, 3);
});

test("the switches are remembered and offered only by players that keep time", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Bass Pattern Player");
  await closeToolsSheet(page);
  await toggle(page, "Metronome").click();
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("accordionTools.session.v1") ?? ""))
    .toContain('"metronome":true');
  await page.reload();
  await openTool(page, "Bass Pattern Player");
  await closeToolsSheet(page);
  await expect(toggle(page, "Metronome")).toHaveAttribute("aria-pressed", "true");

  // The Harmony recording replays chords as recorded, without a meter.
  await workspace(page, "Harmony");
  await expect(page.locator(".playback-bar-clicks")).toHaveCount(0);
});
