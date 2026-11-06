import { test, expect, openApp, openTool, closeToolsSheet, isPhone, type Page } from "./fixtures";

async function findChord(page: Page, root: string, type: string) {
  await openApp(page);
  await openTool(page, "Chord Finder");
  await page.getByLabel("Chord root").selectOption(root);
  await page.getByLabel("Chord type").selectOption(type);
}

/** The "Buttons played" cell of each realization row in the Results panel. */
const realizations = (page: Page) => page.locator(".workspace-inspector tbody tr td:nth-child(2)");

async function showResults(page: Page) {
  await closeToolsSheet(page);
  if (isPhone(page) && !(await page.locator(".workspace-inspector").isVisible())) {
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu").getByRole("button", { name: /results/i }).click();
  }
}

test("Em7 in root position is E bass + G major", async ({ page }) => {
  await findChord(page, "E", "minor7");
  await expect(page.getByLabel("Requested bass / inversion")).toHaveValue("E");
  await showResults(page);
  await expect(realizations(page).first()).toHaveText("E bass + G major");
});

test("choosing any bass widens the results", async ({ page }) => {
  await findChord(page, "E", "minor7");
  await showResults(page);
  await expect(realizations(page).first()).toBeVisible();
  const rootOnly = await realizations(page).count();
  await openTool(page, "Chord Finder");
  await page.getByLabel("Requested bass / inversion").selectOption("");
  await showResults(page);
  await expect.poll(() => realizations(page).count()).toBeGreaterThan(rootOnly);
});

test("a chord with no root-position fingering falls back to any bass", async ({ page }) => {
  await findChord(page, "C", "major6add9");
  await expect(page.getByRole("status").filter({ hasText: "Root position isn't available" })).toBeVisible();
  await showResults(page);
  expect(await realizations(page).count()).toBeGreaterThan(0);
});

test("Cmaj7 is shown on the diagram as C bass + E minor", async ({ page }) => {
  await findChord(page, "C", "major7");
  await showResults(page);
  await expect(realizations(page).first()).toHaveText("C bass + E minor");
  const highlighted = page.locator('svg [data-button-id][data-focus="active"]');
  await expect(highlighted).toHaveCount(2);
});

test("opening another tool hides the Chord Finder result; reopening restores it", async ({ page }) => {
  await findChord(page, "E", "minor7");
  await page.getByLabel("Requested bass / inversion").selectOption("");
  await showResults(page);
  const selectedRow = page.locator(".workspace-inspector tbody tr").filter({ has: page.locator('[aria-pressed="true"]') });
  await page.locator(".workspace-inspector tbody tr").nth(2).click();
  const chosen = await selectedRow.locator("td:nth-child(2)").innerText();
  const lit = page.locator('svg [data-button-id][data-focus="active"]');
  const litCount = await lit.count();
  expect(litCount).toBeGreaterThan(0);
  await openTool(page, "Bass Pattern Player");
  await closeToolsSheet(page);
  await expect(lit).toHaveCount(0);
  await expect(page.locator(".workspace-inspector")).toHaveCount(0);
  await openTool(page, "Chord Finder");
  await expect(page.getByLabel("Chord type")).toHaveValue("minor7");
  await showResults(page);
  await expect(selectedRow.locator("td:nth-child(2)")).toHaveText(chosen);
  await expect(lit).toHaveCount(litCount);
});
