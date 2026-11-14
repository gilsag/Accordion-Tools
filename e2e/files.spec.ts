import {
  test,
  expect,
  openApp,
  openTool,
  openSettings,
  downloadFrom,
  chooseDownload,
  type Page,
} from "./fixtures";

test("the diagram downloads as SVG and PNG", async ({ page }) => {
  await openApp(page);
  const svg = await downloadFrom(page, () => chooseDownload(page, "SVG"));
  expect(svg.name).toMatch(/\.svg$/);
  const text = svg.bytes.toString("utf8");
  expect(text).toContain("<svg");
  expect(text, "interactive attributes are stripped from exports").not.toContain("tabindex");
  const png = await downloadFrom(page, () => chooseDownload(page, "PNG"));
  expect(png.name).toMatch(/\.png$/);
  expect(png.bytes.subarray(1, 4).toString("latin1")).toBe("PNG");
  expect(png.bytes.length).toBeGreaterThan(5_000);
});

test("Chord Finder downloads every realization as a ZIP", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Chord Finder");
  const zip = await downloadFrom(page, () =>
    page.getByRole("button", { name: "Download all diagrams (ZIP)" }).click(),
  );
  expect(zip.name).toMatch(/\.zip$/);
  expect(zip.bytes.subarray(0, 2).toString("latin1")).toBe("PK");
  expect(zip.bytes.length).toBeGreaterThan(1_000);
});

async function saveSettings(page: Page) {
  await openTool(page, "About");
  const file = await downloadFrom(page, () =>
    page.getByRole("button", { name: "Save settings JSON" }).click(),
  );
  return JSON.parse(file.bytes.toString("utf8")) as Record<string, unknown>;
}

test("settings save with a version and the note-length setting", async ({ page }) => {
  await openApp(page);
  await openSettings(page);
  await openTool(page, "Sound");
  await page.getByLabel(/Note length in players/).fill("50");
  const saved = await saveSettings(page);
  expect(saved.settingsVersion).toBe(3);
  expect(saved.soundArticulation).toBe(0.5);
  expect(saved).not.toHaveProperty("progressionAllowApproximations");
  expect(saved).not.toHaveProperty("selectionOnClick");
});

test("a settings file from v0.17.0 still loads", async ({ page }) => {
  await openApp(page);
  await openSettings(page);
  await openTool(page, "About");
  const legacy = {
    soundNoteDurationMs: 600,
    side: "stradella",
    progressionAllowApproximations: false,
    selectionOnClick: true,
  };
  await page.locator('input[type="file"][accept*="json"]').setInputFiles({
    name: "accordion-tools-settings.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect(page.getByText("Could not read this settings file")).toHaveCount(0);
  const saved = await saveSettings(page);
  expect(saved.soundNoteDurationMs).toBe(600);
  expect(saved.soundArticulation).toBe(0.85);
  expect(saved.settingsVersion).toBe(3);
  expect(saved).not.toHaveProperty("selectionOnClick");
});

test("settings survive a reload, and Reset returns to the bundled defaults", async ({ page }) => {
  const noteLength = page.getByLabel(/Note length in players/);
  const savedSession = () =>
    page.evaluate(() => window.localStorage.getItem("accordionTools.session.v1") ?? "");

  await openApp(page);
  await openSettings(page);
  await openTool(page, "Sound");
  const bundledDefault = await noteLength.inputValue();
  expect(bundledDefault).not.toBe("50");
  await noteLength.fill("50");
  await expect
    .poll(savedSession, { message: "the change is stored shortly after it is made" })
    .toContain('"soundArticulation":0.5');

  // The saved session overrides default-settings.json on the next visit.
  await page.reload();
  await expect(page.locator("svg [data-button-id]").first()).toBeVisible();
  await openSettings(page);
  await openTool(page, "Sound");
  await expect(noteLength).toHaveValue("50");

  // Reset asks for confirmation, forgets the session and reloads.
  await openTool(page, "About");
  await page.getByRole("button", { name: "Reset to defaults" }).click();
  await expect(page.getByText(/Reset every setting to its default/)).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("svg [data-button-id]").first()).toBeVisible();
  await openSettings(page);
  await openTool(page, "Sound");
  await expect(noteLength).toHaveValue(bundledDefault);
});

test("a file that is not a settings file is reported in the page, which stays usable", async ({
  page,
}) => {
  page.on("dialog", (dialog) => {
    throw new Error(`unexpected browser dialog: ${dialog.message()}`);
  });
  await openApp(page);
  await openSettings(page);
  await openTool(page, "About");
  await page.locator('input[type="file"][accept*="json"]').setInputFiles({
    name: "notes.json",
    mimeType: "application/json",
    buffer: Buffer.from("this is not JSON"),
  });
  const alert = page.getByRole("alert").filter({ hasText: "Could not read this settings file" });
  await expect(alert).toBeVisible();
  // Nothing is blocked while the message is shown.
  await openTool(page, "Sound");
  await expect(page.getByLabel(/Note length in players/)).toBeVisible();
  await page.getByRole("button", { name: "Dismiss message" }).click();
  await expect(alert).toHaveCount(0);
});

test("a PNG the browser cannot draw is reported in the page", async ({ page }) => {
  page.on("dialog", (dialog) => {
    throw new Error(`unexpected browser dialog: ${dialog.message()}`);
  });
  await openApp(page);
  // Every image fails to load, as when a browser cannot render the SVG.
  await page.evaluate(() => {
    const RealImage = window.Image;
    window.Image = function () {
      const image = new RealImage();
      Object.defineProperty(image, "src", {
        set() {
          setTimeout(() => image.onerror?.(new Event("error")));
        },
      });
      return image;
    } as unknown as typeof Image;
  });
  await chooseDownload(page, "PNG");
  await expect(page.getByRole("alert")).toContainText("The PNG could not be created");
});
