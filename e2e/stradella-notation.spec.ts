import { test, expect, openApp, openSettings, sectionToggle } from "./fixtures";

/** Shared preferences are visible in Settings, independent from the sound register UI. */
test("global Stradella notation defaults and preferences", async ({page}) => {
  await openApp(page);
  await openSettings(page);
  const section = sectionToggle(page,"Music notation");
  if (await section.getAttribute("aria-expanded") !== "true") await section.click();
  const mode = page.locator("#stradella-notation-mode");
  const quality = page.locator("#stradella-chord-labels");
  const counterbass = page.getByLabel("Mark counterbass notes with a dash");
  await expect(mode).toHaveValue("symbolic");
  await expect(quality).toHaveValue("always");
  await expect(counterbass).not.toBeChecked();
  await mode.selectOption("sounding");
  await quality.selectOption("changes");
  await counterbass.check();
  await expect(mode).toHaveValue("sounding");
  await expect(quality).toHaveValue("changes");
  await expect(counterbass).toBeChecked();
});
