// @vitest-environment jsdom
/** The Harmony recording's state: what it starts with, and the chord-id
 * counter shared with the Progression Assistant. */
import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { useHarmonyRecordingState } from "./useHarmonyRecording";

test("a new recording is empty, not recording, with its score hidden", () => {
  const { result } = renderHook(() => useHarmonyRecordingState());
  expect(result.current.harmonyRecordedProgression).toEqual([]);
  expect(result.current.harmonyProgressionRecording).toBe(false);
  expect(result.current.harmonyRecordedNotationVisible).toBe(false);
  expect(result.current.harmonyRecordedProgressionPlaying).toBe(false);
  expect(result.current.harmonyRecordedNotationRef.current).toBeNull();
  expect(result.current.harmonyRecordedPlaybackTimeoutsRef.current).toEqual([]);
});

test("the chord-id counter starts at 1 and survives renders", () => {
  const { result, rerender } = renderHook(() => useHarmonyRecordingState());
  expect(result.current.harmonyProgressionIdRef.current).toBe(1);
  result.current.harmonyProgressionIdRef.current += 2;
  act(() => result.current.setHarmonyProgressionRecording(true));
  rerender();
  expect(result.current.harmonyProgressionIdRef.current).toBe(3);
});
