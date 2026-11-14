import {
  test,
  expect,
  openApp,
  openTool,
  closeToolsSheet,
  openSettings,
  workspace,
  downloadFrom,
  chooseDownload,
  type Page,
} from "./fixtures";

// The page background in each theme (--ui-bg in src/styles/tokens.css).
const LIGHT_BG = "rgb(246, 247, 251)";
const DARK_BG = "rgb(16, 20, 28)";
const pageBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
const savedSession = (page: Page) =>
  page.evaluate(() => window.localStorage.getItem("accordionTools.session.v1") ?? "");

async function openAppearance(page: Page) {
  await openSettings(page);
  await openTool(page, "Appearance");
}

async function chooseTheme(page: Page, name: "system" | "light" | "dark") {
  await page.getByLabel("Interface theme").selectOption(name);
}

test("the interface follows the system's light or dark setting", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openApp(page);
  await expect.poll(() => pageBackground(page)).toBe(LIGHT_BG);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => pageBackground(page)).toBe(DARK_BG);
});

test("a theme chosen in Settings overrides the system and is remembered", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await openApp(page);
  await openAppearance(page);
  await chooseTheme(page, "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => pageBackground(page)).toBe(LIGHT_BG);
  await expect.poll(() => savedSession(page)).toContain('"interfaceTheme":"light"');

  await page.reload();
  await expect(page.locator("svg [data-button-id]").first()).toBeVisible();
  await expect.poll(() => pageBackground(page)).toBe(LIGHT_BG);

  await page.emulateMedia({ colorScheme: "light" });
  await openAppearance(page);
  await chooseTheme(page, "dark");
  await expect.poll(() => pageBackground(page)).toBe(DARK_BG);

  await chooseTheme(page, "system");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  await expect.poll(() => pageBackground(page)).toBe(LIGHT_BG);
});

// Exports embed the page's stylesheets (SVG) or its computed styles (PNG), so
// a diagram colour that followed the theme would show up here.
async function exportsInBothThemes(page: Page) {
  const files = { light: [] as Buffer[], dark: [] as Buffer[] };
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const format of ["SVG", "PNG"] as const)
      files[scheme].push((await downloadFrom(page, () => chooseDownload(page, format))).bytes);
  }
  return files;
}

test("Stradella and Chord Finder exports are the same in both themes", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Chord Finder");
  await closeToolsSheet(page);
  const { light, dark } = await exportsInBothThemes(page);
  expect(dark[0].toString("utf8")).toBe(light[0].toString("utf8"));
  expect(dark[1].equals(light[1]), "PNG bytes match").toBe(true);
});

test("Harmony Explorer exports are the same in both themes", async ({ page }) => {
  await openApp(page);
  await workspace(page, "Harmony");
  await expect(page.locator("svg.harmonic-diagram")).toBeVisible();
  const { light, dark } = await exportsInBothThemes(page);
  expect(dark[0].toString("utf8")).toBe(light[0].toString("utf8"));
  expect(dark[1].equals(light[1]), "PNG bytes match").toBe(true);
});

test("the engraved score downloads the same in both themes", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "the same export, reached through the overflow menu");
  await openApp(page);
  await openTool(page, "ABC Player");
  await closeToolsSheet(page);
  await page
    .getByRole("button", { name: /Show notation/i })
    .first()
    .click();
  const download = page.locator(".shared-notation-score").getByRole("button", {
    name: "Download SVG",
  });
  await page.emulateMedia({ colorScheme: "light" });
  const light = await downloadFrom(page, () => download.click());
  await page.emulateMedia({ colorScheme: "dark" });
  const dark = await downloadFrom(page, () => download.click());
  expect(dark.bytes.toString("utf8")).toBe(light.bytes.toString("utf8"));
});
