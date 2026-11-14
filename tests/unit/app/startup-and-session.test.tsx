// @vitest-environment jsdom
/** Startup order (built-in defaults, then default-settings.json, then the
 * saved session) and when the session is written. The document format and
 * the validation of each key are covered in tests/unit/modules/. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { SAVED_SESSION_KEY } from "../../../src/settings/settingsSession";
import {
  renderApp,
  resetBrowserState,
  serveBundledFiles,
  waitForStartup,
} from "../../support/appHarness";

beforeEach(resetBrowserState);
afterEach(cleanup);

const savedSession = () => JSON.parse(window.localStorage.getItem(SAVED_SESSION_KEY) ?? "null");
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("the saved session takes precedence over default-settings.json", async () => {
  serveBundledFiles();
  window.localStorage.setItem(
    SAVED_SESSION_KEY,
    JSON.stringify({ settingsVersion: 3, basses: "72", soundVolume: 0.4 }),
  );
  const app = await renderApp();
  expect(app.model.settings.basses).toBe("72");
  expect(app.model.settings.soundVolume).toBe(0.4);
});

test("nothing is stored while default-settings.json is still loading", async () => {
  const files = serveBundledFiles();
  const defaults = files.hold("default-settings.json");
  window.localStorage.setItem(
    SAVED_SESSION_KEY,
    JSON.stringify({ settingsVersion: 3, basses: "72" }),
  );
  const app = await renderApp({ waitForStartup: false });
  await app.run((model) => model.settings.setSpacing(30));
  await pause(800);
  expect(savedSession()).toEqual({ settingsVersion: 3, basses: "72" });

  defaults.release();
  await waitForStartup();
  await expect.poll(() => app.model.settings.basses).toBe("72");
});

test("a change is stored after a short quiet period", async () => {
  serveBundledFiles();
  const app = await renderApp();
  expect(savedSession().basses).toBe("96");
  await app.run((model) => model.settings.setBasses("120"));
  await expect.poll(() => savedSession().basses, { timeout: 2000 }).toBe("120");
});

test("without default-settings.json the built-in defaults start the session", async () => {
  serveBundledFiles().fail("default-settings.json");
  const app = await renderApp();
  expect(savedSession().basses).toBe(app.model.settings.basses);
});

test("a held session (a shared link) is kept until the person changes something", async () => {
  const app = await renderApp();
  await expect.poll(() => savedSession()?.basses, { timeout: 2000 }).toBe("96");
  // What a shared link does: hold the session, then show its own values.
  app.settings.holdSession();
  await app.run((model) => model.settings.setBasses("72"));
  await new Promise((resolve) => setTimeout(resolve, 1200));
  expect(savedSession().basses).toBe("96");
  // The first change of the person's own adopts what is shown.
  await app.run((model) => model.tools.setScaleFinderRoot("G"));
  await expect.poll(() => savedSession().basses, { timeout: 2000 }).toBe("72");
  expect(savedSession().scaleFinderRoot).toBe("G");
});

test("a callback waiting for startup runs once startup is done", async () => {
  const app = await renderApp();
  let ran = 0;
  app.settings.whenStarted(() => ran++);
  expect(ran, "startup had already finished, so it runs at once").toBe(1);
});
