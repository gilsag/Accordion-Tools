import { ES } from "../src/i18n/es";
import { test, expect, openApp, openTool, openToolsSheet, openSettings, sectionTitles, workspace, type Page } from "./fixtures";

// Words that only appear in English text. Any of them in the Spanish interface
// means a label bypassed the translation catalog.
const ENGLISH = /\b(the|and|with|from|show|hide|play|stop|chord|button|buttons|settings|download|root|bass|treble)\b/i;

async function englishLeftovers(page: Page) {
  return page.evaluate((source) => {
    const pattern = new RegExp(source, "i");
    const found = new Set<string>();
    const scopes = document.querySelectorAll(".left-panel, .topbar, .playback-bar, .workspace-inspector");
    for (const scope of scopes) {
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const element = node.parentElement!;
        if (!element.checkVisibility() || element.closest("textarea, code, pre, option, .no-translate")) continue;
        const text = node.textContent!.trim();
        if (text && pattern.test(text)) found.add(text);
      }
      for (const element of scope.querySelectorAll<HTMLElement>("[title], [aria-label]")) {
        if (!element.checkVisibility()) continue;
        for (const text of [element.title, element.getAttribute("aria-label") ?? ""]) if (pattern.test(text)) found.add(text);
      }
    }
    return [...found];
  }, ENGLISH.source);
}

test.use({ locale: "es-ES" });

test("the Spanish interface shows no English labels", async ({ page }) => {
  await openApp(page);
  const leftovers = new Set<string>();
  for (const name of ["Stradella", "Treble", "Harmony"] as const) {
    await workspace(page, name);
    await openToolsSheet(page);
    for (const tool of await sectionTitles(page)) {
      await openTool(page, tool);
      for (const text of await englishLeftovers(page)) leftovers.add(`${name} › ${tool}: ${text}`);
    }
  }
  await openSettings(page, ES["nav.settings"]);
  for (const section of await sectionTitles(page)) {
    await openTool(page, section);
    for (const text of await englishLeftovers(page)) leftovers.add(`Settings › ${section}: ${text}`);
  }
  expect([...leftovers]).toEqual([]);
});
