import { test, expect, openApp, openSettings, sectionToggle } from "./fixtures";

/** Shared preferences are visible in Settings, independent from the sound register UI. */
test("global Stradella notation defaults and preferences", async ({page}) => {
  await openApp(page);
  await openSettings(page);
  const section = sectionToggle(page,"Music notation");
  if (await section.getAttribute("aria-expanded") !== "true") await section.click();
  const placement = page.getByRole("group", { name: "Notation position" });
  const mode = page.getByRole("group", { name: "Left-hand notation" });
  const quality = page.getByRole("group", { name: "Chord-quality symbols" });
  const counterbass = page.getByLabel("Mark counterbass notes with a dash");
  await expect(placement.getByRole("button", { name: "Right panel" })).toHaveAttribute("aria-pressed", "true");
  await expect(mode.getByRole("button", { name: /Standard Stradella/ })).toHaveAttribute("aria-pressed", "true");
  await expect(quality.getByRole("button", { name: "Show on every chord" })).toHaveAttribute("aria-pressed", "true");
  await expect(counterbass).not.toBeChecked();
  await placement.getByRole("button", { name: "Below diagram" }).click();
  await mode.getByRole("button", { name: /Expanded/ }).click();
  await quality.getByRole("button", { name: "Show when quality changes" }).click();
  await counterbass.check();
  await expect(placement.getByRole("button", { name: "Below diagram" })).toHaveAttribute("aria-pressed", "true");
  await expect(mode.getByRole("button", { name: /Expanded/ })).toHaveAttribute("aria-pressed", "true");
  await expect(quality.getByRole("button", { name: "Show when quality changes" })).toHaveAttribute("aria-pressed", "true");
  await expect(counterbass).toBeChecked();
});
