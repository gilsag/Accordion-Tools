/** Deferred ABC engine. All parser/mapping methods retain their existing synchronous
 * API; only the application's first access is asynchronous. Cache the import so
 * changing instruments or re-opening a score does not create duplicate loads. */
import type * as AbcEngine from "../../tools/abcPlayerTools";
let pending: Promise<typeof AbcEngine> | undefined;

export function loadAbcEngine(): Promise<typeof AbcEngine> {
  return pending ??= import("../../tools/abcPlayerTools").catch(error => {
    pending = undefined; // A transient download failure may be retried.
    throw error;
  });
}
