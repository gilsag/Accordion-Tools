import { test as base, expect, type Page } from "@playwright/test";

/** Every test fails if the page logs an error or throws. */
export const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    await use(errors);
    expect(errors, "no console errors or uncaught exceptions").toEqual([]);
  }, { auto: true }],
});
export { expect };
export type { Page };

export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) <= 860;

export async function openApp(page: Page) {
  await page.goto("./");
  await expect(page.locator("svg [data-button-id]").first()).toBeVisible();
}

/** On phones, tools live in a bottom sheet opened from the Tools button. */
export async function openToolsSheet(page: Page) {
  if (!isPhone(page)) return;
  if (await page.locator(".left-panel button.section-title").first().isVisible()) return;
  await page.locator(".phone-tools-button").click();
}

export async function closeToolsSheet(page: Page) {
  if (isPhone(page) && await page.locator(".left-panel.phone-sheet-open").count()) {
    await page.keyboard.press("Escape");
    await expect(page.locator(".left-panel.phone-sheet-open")).toHaveCount(0);
  }
}

/** A collapsible tool or settings section header, by its visible title. */
export const sectionToggle = (page: Page, name: string) =>
  page.locator("button.section-title").filter({ hasText: new RegExp(`^\\s*${name}\\s*[+−]?\\s*$`) }).first();

/** Expand a tool or settings section (no-op if it is already open). */
export async function openTool(page: Page, name: string) {
  await openToolsSheet(page);
  const toggle = sectionToggle(page, name);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  return toggle;
}

/** Visible section titles in the open panel. */
export const sectionTitles = (page: Page) => page.locator("button.section-title").evaluateAll((buttons) =>
  buttons.filter((b) => (b as HTMLElement).offsetParent).map((b) => b.textContent!.replace(/[+−]\s*$/, "").trim()));

/** Opens the Settings panel; pass the translated label when not in English. */
export async function openSettings(page: Page, label = "Settings") {
  if (isPhone(page)) {
    await closeToolsSheet(page);
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu").getByRole("button", { name: label, exact: true }).click();
  } else {
    await page.locator(".topbar-secondary").getByRole("button", { name: label, exact: true }).click();
  }
}

const WORKSPACES = ["Stradella", "Treble", "Harmony"] as const;

/** Switches workspace by position, so it works in every interface language. */
export async function workspace(page: Page, name: (typeof WORKSPACES)[number]) {
  await closeToolsSheet(page);
  await page.locator(".topbar-primary").nth(WORKSPACES.indexOf(name)).click();
}

/** Counts notes started on the Web Audio clock, so tests can tell that a
 * player really scheduled sound. Call before openApp(). */
export async function recordAudioStarts(page: Page) {
  await page.addInitScript(() => {
    const counter = { starts: 0 };
    (window as unknown as { audioStarts: typeof counter }).audioStarts = counter;
    // Sample players override start(), so wrap both definitions.
    for (const proto of [AudioScheduledSourceNode.prototype, AudioBufferSourceNode.prototype]) {
      if (!Object.prototype.hasOwnProperty.call(proto, "start")) continue;
      const original = proto.start as (...args: unknown[]) => void;
      proto.start = function (this: AudioScheduledSourceNode, ...args: unknown[]) {
        counter.starts += 1;
        return original.apply(this, args);
      };
    }
  });
  return () => page.evaluate(() => (window as unknown as { audioStarts: { starts: number } }).audioStarts.starts);
}
