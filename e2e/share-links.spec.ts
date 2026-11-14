import {
  test,
  expect,
  openApp,
  openSettings,
  openTool,
  openToolsSheet,
  closeToolsSheet,
  isPhone,
  type Page,
} from "./fixtures";

const savedSession = (page: Page) =>
  page.evaluate(() => window.localStorage.getItem("accordionTools.session.v1") ?? "");

async function copyLinkFromMenu(page: Page) {
  await closeToolsSheet(page);
  if (isPhone(page)) {
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu").getByRole("button", { name: "Copy link" }).click();
  } else {
    await page.locator(".export-menu > summary").click();
    await page.locator(".export-menu").getByRole("button", { name: "Copy link" }).click();
  }
  await expect(page.getByRole("status")).toContainText("Link copied");
  return page.evaluate(() => navigator.clipboard.readText());
}

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});

test("a link opens the instrument and chord without replacing the person's own setup", async ({
  page,
}) => {
  await openApp(page);
  await expect.poll(() => savedSession(page)).toContain('"basses":"96"');

  await page.goto("./?side=stradella&basses=72&tool=stradella-chords&root=E&chord=minor7");
  await expect(page.locator(".diagram text.title")).toContainText("Em7");
  await openToolsSheet(page);
  await expect(page.getByLabel("Chord root")).toHaveValue("E");
  await expect(page.getByLabel("Chord type")).toHaveValue("minor7");
  expect(new URL(page.url()).search, "the query is removed once read").toBe("");
  await openSettings(page);
  await openTool(page, "Instrument");
  await expect(page.getByRole("combobox", { name: "Basses", exact: true })).toHaveValue("72");

  // The saved session still holds the person's own instrument...
  await page.waitForTimeout(1200);
  expect(await savedSession(page)).toContain('"basses":"96"');
  // ...so a reload returns to it.
  await page.reload();
  await openSettings(page);
  await openTool(page, "Instrument");
  await expect(page.getByRole("combobox", { name: "Basses", exact: true })).toHaveValue("96");
});

test("changing something after opening a link keeps the shown setup", async ({ page }) => {
  await page.goto("./?side=stradella&basses=120");
  await expect(page.locator("svg [data-button-id]").first()).toBeVisible();
  await openSettings(page);
  await openTool(page, "Sound");
  await page.getByLabel(/Note length in players/).fill("50");
  await expect.poll(() => savedSession(page)).toContain('"basses":"120"');
});

test("Copy link reproduces the chord and the chosen realization", async ({ browser, page }) => {
  await openApp(page);
  await openTool(page, "Chord Finder");
  await page.getByLabel("Chord root").selectOption("D");
  await page.getByLabel("Chord type").selectOption("dominant7");
  await page.getByRole("button", { name: "Next" }).click();
  const position = await page.locator(".realization-navigation .hint").textContent();
  expect(position).toMatch(/^2 \//);
  const link = await copyLinkFromMenu(page);
  expect(link).toContain("tool=stradella-chords");
  expect(link).toContain("n=2");

  const other = await browser.newPage({ viewport: page.viewportSize() ?? undefined });
  await other.goto(link);
  await expect(other.locator(".diagram text.title")).toContainText("D7");
  await openToolsSheet(other);
  await expect(other.getByLabel("Chord root")).toHaveValue("D");
  await expect(other.getByLabel("Chord type")).toHaveValue("dominant7");
  await expect(other.locator(".realization-navigation .hint")).toHaveText(position ?? "");
  await other.close();
});

test("a treble link opens the layout and the treble Chord Finder", async ({ page }) => {
  await page.goto("./?side=treble&layout=b-system&tool=treble-chords&root=D&chord=minor-triad");
  await expect(page.locator("svg [data-button-id]").first()).toBeVisible();
  await openToolsSheet(page);
  await expect(page.getByLabel("Chord root")).toHaveValue("D");
  await expect(page.getByLabel("Chord type")).toHaveValue("minor-triad");
  await openSettings(page);
  await openTool(page, "Instrument");
  await expect(page.getByRole("combobox", { name: "Treble layout", exact: true })).toHaveValue(
    "b-system",
  );
});

test("a Scale Finder link shows the scale", async ({ page }) => {
  await page.goto("./?side=stradella&basses=96&tool=scales&root=G&scale=natural-minor-scale");
  await expect(page.locator("svg [data-button-id]").first()).toBeVisible();
  await openToolsSheet(page);
  await expect(page.getByRole("button", { name: "Hide scale" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Scale root" })).toHaveValue("G");
});

test("a link with unknown values still opens the app", async ({ page }) => {
  await page.goto("./?side=moon&basses=999&tool=stradella-chords&root=H&chord=nonsense");
  await expect(page.locator("svg [data-button-id]").first()).toBeVisible();
});
