import { test, expect, openApp, openTool, closeToolsSheet, sectionToggle, openToolsSheet, isPhone, recordAudioStarts, type Page } from "./fixtures";

async function chooseAnnotateMode(page: Page, mode: "Select" | "Finger" | "Sequence" | "Notes") {
  await openTool(page, "Annotate Diagram");
  const choice = page.getByRole("group", { name: "Click mode" }).getByRole("button", { name: mode });
  await choice.click();
  await expect(choice).toHaveAttribute("aria-pressed", "true");
  await closeToolsSheet(page);
}

test("Annotate Diagram clicks do only the chosen mode and every mark stays visible", async ({ page }) => {
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  const button = (index: number) => page.locator("svg [data-button-id]").nth(index);
  const selected = page.locator("svg [data-button-id] .button.selected");
  const fingers = page.locator("svg .finger-label");
  const steps = page.locator("svg .sequence-number");

  // With the tool closed a click only plays the button.
  let before = await audioStarts();
  await button(20).click();
  await expect.poll(audioStarts, { timeout: 10_000 }).toBeGreaterThan(before);
  await expect(selected).toHaveCount(0);

  await chooseAnnotateMode(page, "Select");
  before = await audioStarts();
  await button(20).click();
  await expect(button(20).locator(".button.selected")).toHaveCount(1);
  await expect.poll(audioStarts, { timeout: 10_000 }).toBeGreaterThan(before);
  await expect(fingers).toHaveCount(0);
  await expect(steps).toHaveCount(0);

  await chooseAnnotateMode(page, "Finger");
  await openTool(page, "Annotate Diagram");
  await expect(page.getByRole("group", { name: "Fingering value" }).getByRole("button", { name: "1" }),
    "finger 1 is chosen by default").toHaveAttribute("aria-pressed", "true");
  await closeToolsSheet(page);
  await button(21).click();
  await button(22).click();
  await expect(button(21).locator(".finger-label")).toHaveText("1");
  await expect(button(22).locator(".finger-label"), "the finger value is kept").toHaveText("1");
  await button(22).click();
  await expect(button(22).locator(".finger-label"), "the same finger again removes it").toHaveCount(0);
  await expect(selected).toHaveCount(1);
  await expect(steps).toHaveCount(0);

  await chooseAnnotateMode(page, "Sequence");
  await button(23).click();
  await button(24).click();
  await expect(steps).toHaveCount(2);
  await expect(selected).toHaveCount(1);
  await expect(fingers).toHaveCount(1);

  await chooseAnnotateMode(page, "Notes");
  await button(25).click();
  const editor = page.locator(".annotation-editor textarea");
  await editor.fill("Thumb");
  await editor.press("Enter");
  await expect(page.locator("svg text", { hasText: "Thumb" })).toHaveCount(1);

  // Every mark is still on the diagram, and stays after the tool closes.
  await expect(selected).toHaveCount(1);
  await expect(fingers).toHaveCount(1);
  await expect(steps).toHaveCount(2);
  await openToolsSheet(page);
  await sectionToggle(page, "Annotate Diagram").click();
  await closeToolsSheet(page);
  await button(26).click();
  await expect(selected).toHaveCount(1);
  await expect(fingers).toHaveCount(1);
  await expect(steps).toHaveCount(2);
  await expect(page.locator(".annotation-editor textarea")).toHaveCount(0);
});

test("diagram buttons work from the keyboard", async ({ page }) => {
  test.skip(isPhone(page), "keyboard navigation is a desktop concern");
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  const tabStop = page.locator('svg [data-button-id][tabindex="0"]');
  await expect(tabStop).toHaveCount(1);
  await tabStop.focus();
  const label = () => page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  await expect.poll(label).toMatch(/, /);
  const start = await label();
  // Focus moves after React re-renders the roving tab stop, so poll for it.
  await page.keyboard.press("ArrowRight");
  await expect.poll(label).not.toBe(start);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(label).toBe(start);
  await page.keyboard.press("ArrowDown");
  await expect.poll(label).not.toBe(start);
  // Only one diagram button is in the Tab order at a time.
  await expect(page.locator('svg [data-button-id][tabindex="0"]')).toHaveCount(1);
  const before = await audioStarts();
  await page.keyboard.press("Enter");
  await expect.poll(audioStarts, { timeout: 10_000 }).toBeGreaterThan(before);
});

test("on phones the Tools sheet stays open while a tool is expanded", async ({ page }) => {
  test.skip(!isPhone(page), "phone layout only");
  await openApp(page);
  await openTool(page, "Chord Finder");
  const sheet = page.locator(".left-panel.phone-sheet-open");
  await expect(sheet).toBeVisible();
  await page.getByLabel("Chord type").selectOption("minor-triad");
  await expect(sheet, "changing a control keeps the sheet open").toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(page.locator(".playback-bar, .canvas-wrap").first()).toBeVisible();
});

test("on phones the diagram scrolls rather than squeezing buttons", async ({ page }) => {
  test.skip(!isPhone(page), "phone layout only");
  await openApp(page);
  const box = await page.locator("svg [data-button-id]").first().boundingBox();
  expect(box!.width, "readable button size in CSS px").toBeGreaterThanOrEqual(24);
});

test("the toolbar stays on one row at 1280 px with the Results panel open", async ({ page }) => {
  test.skip(isPhone(page), "desktop toolbar only");
  await page.setViewportSize({ width: 1280, height: 800 });
  await openApp(page);
  const height = () => page.locator(".topbar").evaluate((bar) => bar.getBoundingClientRect().height);
  const oneRow = await height();
  await openTool(page, "Chord Finder");
  await expect(page.locator(".workspace-inspector")).toBeVisible();
  expect(await height()).toBeLessThanOrEqual(oneRow);
  await openTool(page, "ABC Player");
  await page.getByLabel("Example tune").selectOption("bella-ciao");
  await expect(page.locator(".topbar").getByRole("button", { name: "Show notation" })).toBeVisible();
  expect(await height()).toBeLessThanOrEqual(oneRow);
  // Labels hidden in compact mode stay available to screen readers.
  await expect(page.locator(".topbar").getByRole("button", { name: "Settings", exact: true })).toBeVisible();
});


test("the tools and results panels can be resized and reset", async ({ page }) => {
  test.skip(isPhone(page), "Phones use the Tools sheet instead of side panels");
  await openApp(page);
  const panel = page.locator(".left-panel");
  const handle = page.getByRole("separator", { name: /Resize the tools panel/ });
  const before = (await panel.boundingBox())!.width;
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + 200, { steps: 6 });
  await page.mouse.up();
  await expect.poll(async () => Math.round((await panel.boundingBox())!.width)).toBeGreaterThan(before + 100);
  const widened = (await panel.boundingBox())!.width;

  // Remembered in this browser.
  await page.reload();
  await expect.poll(async () => Math.round((await page.locator(".left-panel").boundingBox())!.width)).toBe(Math.round(widened));

  // Arrow keys move the edge; a double-click restores the default.
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(async () => Math.round((await panel.boundingBox())!.width)).toBe(Math.round(widened) - 16);
  await handle.dblclick();
  await expect.poll(async () => Math.round((await panel.boundingBox())!.width)).toBe(Math.round(before));

  // The results panel's edge grows it towards the diagram.
  await openTool(page, "Chord Finder");
  const inspector = page.locator(".workspace-inspector");
  await expect(inspector).toBeVisible();
  const resultsHandle = page.getByRole("separator", { name: /Resize the results panel/ });
  const resultsBefore = (await inspector.boundingBox())!.width;
  await resultsHandle.focus();
  for (let step = 0; step < 4; step += 1) await page.keyboard.press("ArrowLeft");
  await expect.poll(async () => Math.round((await inspector.boundingBox())!.width)).toBe(Math.round(resultsBefore) + 64);
  await page.keyboard.press("Enter");
  await expect.poll(async () => Math.round((await inspector.boundingBox())!.width)).toBe(Math.round(resultsBefore));
});
