// @vitest-environment jsdom
/** The platform providers own the shared state; every reader sees the same
 * owner, and a reader outside the providers fails loudly. */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { PlatformProviders } from "../../../src/app/platform/PlatformProviders";
import {
  usePlatformInstrument,
  usePlatformNavigation,
  usePlatformSound,
} from "../../../src/app/platform/platformContexts";
import { resetBrowserState } from "../../support/appHarness";

beforeEach(resetBrowserState);
afterEach(cleanup);

test("reading shared state outside the providers names the missing provider", () => {
  expect(() => renderHook(() => usePlatformInstrument())).toThrow(
    "usePlatformInstrument() must be called inside <PlatformProviders>.",
  );
});

test("navigation changes the instrument side that every reader sees", () => {
  const { result } = renderHook(
    () => ({ instrument: usePlatformInstrument(), navigation: usePlatformNavigation() }),
    { wrapper: PlatformProviders },
  );
  act(() => result.current.instrument.setSide("treble"));
  act(() => result.current.navigation.navigateToTool("progressionAssistant"));
  expect(result.current.instrument.side).toBe("stradella");
  expect(result.current.navigation.activeToolSection).toBe("progressionAssistant");
});

test("sound options follow the instrument's register model", () => {
  const { result } = renderHook(
    () => ({ instrument: usePlatformInstrument(), sound: usePlatformSound() }),
    { wrapper: PlatformProviders },
  );
  const before = result.current.sound.soundOptions;
  act(() => result.current.instrument.setStradellaBassRegisterOctave(4));
  expect(result.current.sound.soundOptions).not.toBe(before);
  expect(result.current.sound.soundOptions.stradellaRegisterModel).toBe(
    result.current.instrument.stradellaRegisterModel,
  );
});
