import { test, expect, openApp, openTool, closeToolsSheet, workspace, openToolsSheet, sectionTitles, openSettings } from "./fixtures";

// Opens every tool of every workspace and every settings section. The fixture
// fails the test on any console error or uncaught exception.
for (const name of ["Stradella", "Treble", "Harmony"] as const) {
  test(`${name}: every tool opens without errors`, async ({ page }) => {
    await openApp(page);
    await workspace(page, name);
    await openToolsSheet(page);
    for (const tool of await sectionTitles(page)) await openTool(page, tool);
    await closeToolsSheet(page);
    await expect(page.locator(".canvas-wrap svg").first()).toBeVisible();
  });
}

test("every settings section opens without errors", async ({ page }) => {
  await openApp(page);
  await openSettings(page);
  const sections = await sectionTitles(page);
  expect(sections).toContain("Sound");
  for (const section of sections) await openTool(page, section);
});

test("the page does not scroll sideways", async ({ page }) => {
  await openApp(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("the guides open in the documentation viewer", async ({ page }) => {
  await openApp(page);
  await openSettings(page);
  await openTool(page, "About");
  await page.getByRole("button", { name: "Open documentation" }).click();
  const dialog = page.locator(".documentation-dialog");
  await expect(dialog.locator(".documentation-article h1, .documentation-article h2").first()).toBeVisible();
  await dialog.locator(".documentation-header button").click();
  await expect(dialog).toBeHidden();
});

test("the status bar names the open tool", async ({ page }) => {
  await openApp(page);
  const status = page.locator(".status-bar");
  await expect(status).toContainText("No active tool");
  await openTool(page, "ABC Player");
  await closeToolsSheet(page);
  await expect(status).toContainText("ABC Player");
  await expect(status).not.toContainText("No active tool");
});
