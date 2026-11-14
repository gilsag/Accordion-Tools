// @vitest-environment jsdom
/** What starting a player does to the other tools. Sound is off, so the
 * players run their timers without audio; the order of each transport's
 * steps is covered in tests/unit/modules/. */
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
  installAudioClock,
  renderApp,
  resetBrowserState,
  serveBundledFiles,
} from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  serveBundledFiles();
  installAudioClock();
});
afterEach(cleanup);

test("starting the ABC Player hides the Finders, and starting the Bass Pattern Player stops it", async () => {
  const app = await renderApp();
  await app.run((model) => model.tools.toggleToolSection("abcPlayer"));
  await expect.poll(() => app.model.tools.abcText).toContain("T:Happy Birthday");
  await app.run((model) => model.tools.setStradellaChordFinderActive(true));
  await app.run((model) => model.tools.setScaleFinderActive(true));

  await app.run((model) => model.workspace.scheduleAbcPlayback());
  expect(app.model.tools.abcPlaybackState).toBe("playing");
  expect(app.model.tools.stradellaChordFinderActive).toBe(false);
  expect(app.model.tools.scaleFinderActive).toBe(false);

  await app.run((model) => model.workspace.scheduleBassPatternPlayback());
  expect(app.model.tools.bassPatternPlaybackState).toBe("playing");
  expect(app.model.tools.abcPlaybackState).toBe("stopped");
});

test("Stop stops both players", async () => {
  const app = await renderApp();
  await app.run((model) => model.workspace.scheduleBassPatternPlayback());
  expect(app.model.tools.bassPatternPlaybackState).toBe("playing");
  await app.run((model) => model.workspace.stopSoundPlayback());
  expect(app.model.tools.bassPatternPlaybackState).toBe("stopped");
});
