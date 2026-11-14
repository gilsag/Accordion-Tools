/** In-page notices: errors stay until dismissed, information goes after a
 * while, and the same message is never shown twice at once.
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { INFO_NOTICE_MS, useNotices } from "../../../src/app/platform/useNotices";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test("an error stays until it is dismissed", () => {
  const { result } = renderHook(() => useNotices());
  act(() => result.current.notify("Export failed"));
  act(() => vi.advanceTimersByTime(INFO_NOTICE_MS * 3));
  expect(result.current.notices).toMatchObject([{ kind: "error", message: "Export failed" }]);
  act(() => result.current.dismiss(result.current.notices[0].id));
  expect(result.current.notices).toEqual([]);
});

test("information goes by itself", () => {
  const { result } = renderHook(() => useNotices());
  act(() => result.current.notify("Only chords were sent", "info"));
  expect(result.current.notices).toHaveLength(1);
  act(() => vi.advanceTimersByTime(INFO_NOTICE_MS));
  expect(result.current.notices).toEqual([]);
});

test("repeating a message replaces it instead of stacking", () => {
  const { result } = renderHook(() => useNotices());
  act(() => {
    result.current.notify("Export failed");
    result.current.notify("Export failed");
    result.current.notify("Another problem");
  });
  expect(result.current.notices.map((notice) => notice.message)).toEqual([
    "Export failed",
    "Another problem",
  ]);
});
