import {
  test,
  expect,
  openApp,
  openTool,
  openSettings,
  workspace,
  downloadFrom,
  chooseDownload,
  type Page,
} from "./fixtures";

// Downloads reference diagrams as SVG and compares where every button is
// drawn: its shapes' positions and sizes, its classes and its label. Styles,
// fonts and the title are left out, so only a change that moves, resizes,
// adds, removes or relabels a button fails. After an intended layout change,
// review the diff and run `npx playwright test export-snapshots --update-snapshots`.
// Desktop only (playwright.config.ts): the files do not depend on the screen.

/** One line per drawn button, from the downloaded file. */
async function buttonGeometry(page: Page) {
  const file = await downloadFrom(page, () => chooseDownload(page, "SVG"));
  return page.evaluate((source) => {
    const svg = new DOMParser().parseFromString(source, "image/svg+xml").documentElement;
    const round = (value: string | null) =>
      value === null ? "" : String(Math.round(Number(value) * 100) / 100);
    const lines = [`viewBox ${svg.getAttribute("viewBox")?.split(/\s+/).map(round).join(" ")}`];
    for (const group of svg.querySelectorAll("g.button-group")) {
      const parts = [...group.querySelectorAll("circle, rect, ellipse, text")].map((shape) => {
        const classes = [...shape.classList].sort().join(".");
        if (shape.tagName === "text")
          return `text(${round(shape.getAttribute("x"))},${round(shape.getAttribute("y"))} "${shape.textContent}")`;
        const geometry = ["cx", "cy", "r", "x", "y", "width", "height", "rx", "ry"]
          .filter((name) => shape.hasAttribute(name))
          .map((name) => `${name}=${round(shape.getAttribute(name))}`)
          .join(" ");
        return `${shape.tagName}${classes ? `.${classes}` : ""}(${geometry})`;
      });
      const transform = group.getAttribute("transform");
      lines.push((transform ? `[${transform}] ` : "") + parts.join(" "));
    }
    return lines.join("\n") + "\n";
  }, file.bytes.toString("utf8"));
}

async function chooseInstrument(page: Page, label: "Basses" | "Treble layout", value: string) {
  await openSettings(page);
  await openTool(page, "Instrument");
  await page.getByRole("combobox", { name: label, exact: true }).selectOption(value);
}

for (const basses of ["48-8x6", "96", "120"])
  test(`Stradella ${basses}`, async ({ page }) => {
    await openApp(page);
    await chooseInstrument(page, "Basses", basses);
    expect(await buttonGeometry(page)).toMatchSnapshot(`stradella-${basses}.txt`);
  });

test("Stradella 96 with Em7 in the Chord Finder", async ({ page }) => {
  await openApp(page);
  await chooseInstrument(page, "Basses", "96");
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await openTool(page, "Chord Finder");
  await page.getByLabel("Chord root").selectOption("E");
  await page.getByLabel("Chord type").selectOption("minor7");
  expect(await buttonGeometry(page)).toMatchSnapshot("stradella-96-em7.txt");
});

for (const layout of ["c-system", "b-system", "piano"])
  test(`Treble ${layout}`, async ({ page }) => {
    await openApp(page);
    await workspace(page, "Treble");
    await chooseInstrument(page, "Treble layout", layout);
    expect(await buttonGeometry(page)).toMatchSnapshot(`treble-${layout}.txt`);
  });
