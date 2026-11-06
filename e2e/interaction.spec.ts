import { test, expect, openApp, openTool, isPhone, recordAudioStarts } from "./fixtures";

test("diagram buttons work from the keyboard", async ({ page }) => {
  test.skip(isPhone(page), "keyboard navigation is a desktop concern");
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  const tabStop = page.locator('svg [data-button-id][tabindex="0"]');
  await expect(tabStop).toHaveCount(1);
  await tabStop.focus();
  const label = () => page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  const start = await label();
  expect(start).toMatch(/, /);
  await page.keyboard.press("ArrowRight");
  const moved = await label();
  expect(moved).not.toBe(start);
  await page.keyboard.press("ArrowLeft");
  expect(await label()).toBe(start);
  await page.keyboard.press("ArrowDown");
  expect(await label()).not.toBe(start);
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

