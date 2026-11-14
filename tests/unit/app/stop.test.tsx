// @vitest-environment jsdom
/** Stop (the playback bar's, and the one other players call before they
 * start) stops every tool's playback. Audio itself is covered by the
 * browser tests; this checks the state each tool clears. */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { AppProviders } from "../../../src/app/AppProviders";
import { usePlatformTools } from "../../../src/app/platform/platformContexts";
import { useProgressionAssistant } from "../../../src/features/progressionAssistant/progressionAssistantContext";
import { resetBrowserState, serveBundledFiles } from "../../support/appHarness";

beforeEach(() => {
  resetBrowserState();
  // Only the providers are rendered, not the whole application, so the
  // settings startup is held back.
  serveBundledFiles().hold("default-settings.json");
});
afterEach(cleanup);

test("Stop clears the buttons the Progression Assistant lit", () => {
  const { result } = renderHook(
    () => ({ assistant: useProgressionAssistant(), tools: usePlatformTools() }),
    { wrapper: AppProviders },
  );
  act(() => {
    result.current.assistant.setHarmonyProgressionActiveButtonIds(["bass-C"]);
    result.current.assistant.setHarmonyProgressionPulseSilent(true);
  });
  act(() => result.current.tools.stopAllPlayback());
  expect(result.current.assistant.harmonyProgressionActiveButtonIds).toEqual([]);
  expect(result.current.assistant.harmonyProgressionPulseSilent).toBe(false);
});
