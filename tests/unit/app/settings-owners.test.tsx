// @vitest-environment jsdom
/** Settings files, imports and the saved session reach every state owner
 * through the settings registry. Key validation, aliases and migrations are
 * covered by the settings-controller tests in tests/unit/modules/. */
import { readFileSync } from "node:fs";
import { act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createSettingsRegistry } from "../../../src/settings/settingsRegistry";
import { SAVED_SESSION_KEY } from "../../../src/settings/settingsSession";
import { renderApp, resetBrowserState, serveBundledFiles } from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
});
afterEach(cleanup);

test("every settings owner is registered in the composed application", async () => {
  const app = await renderApp();
  expect(app.settings.missingOwners()).toEqual([]);
});

test("a saved settings file has every key, in the frozen order", async () => {
  const app = await renderApp();
  const expectedKeys = JSON.parse(readFileSync("tests/fixtures/settings-export-keys.json", "utf8"));
  expect(Object.keys(app.settings.collect())).toEqual(expectedKeys);
});

test("a saved settings file reports the values of platform and tool owners alike", async () => {
  const app = await renderApp();
  await app.run((model) => model.settings.setBasses("72"));
  await app.run((model) => model.tools.setScaleFinderRoot("G"));
  await app.run((model) => model.tools.setBassPatternTempoBpm(132));
  const file = app.settings.collect();
  expect(file.basses).toBe("72");
  expect(file.scaleFinderRoot).toBe("G");
  expect(file.bassPatternTempoBpm).toBe(132);
});

test("an imported file reaches platform and tool owners alike", async () => {
  const app = await renderApp();
  await act(async () =>
    app.settings.applyImported({
      settingsVersion: 3,
      basses: "72",
      soundVolume: 0.3,
      chordFinderRoot: "E",
      abcHands: "treble",
      progressionRhythmPattern: "waltz",
      language: "es",
    }),
  );
  // An imported language is also remembered for the next visit.
  expect(app.model.settings.languagePreference).toBe("es");
  expect(window.localStorage.getItem("accordionTools.interfaceLanguage.v1")).toBe("es");
  expect(app.model.settings.basses).toBe("72");
  expect(app.model.settings.soundVolume).toBe(0.3);
  expect(app.model.tools.chordFinderRoot).toBe("E");
  expect(app.model.tools.abcHands).toBe("treble");
  expect(app.model.tools.harmonyProgressionRhythmPattern).toBe("waltz");
});

test("with an owner missing, startup neither loads nor saves settings", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  window.localStorage.setItem(SAVED_SESSION_KEY, '{"settingsVersion":3,"basses":"72"}');
  const registry = createSettingsRegistry();
  registry.start(`${import.meta.env.BASE_URL}default-settings.json`);
  await vi.waitFor(() => expect(error).toHaveBeenCalled());
  expect(String(error.mock.calls[0][0])).toContain("Settings owners not registered: language");
  expect(registry.missingOwners()).toHaveLength(15);
  expect(window.localStorage.getItem(SAVED_SESSION_KEY)).toBe(
    '{"settingsVersion":3,"basses":"72"}',
  );
});
