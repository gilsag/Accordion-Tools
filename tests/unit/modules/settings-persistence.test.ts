/** Settings file I/O: fetching startup defaults, importing a saved file and
 * downloading the current settings, run against the real module. */
import assert from "node:assert/strict";
import { fetchDefaultSettingsDocument, parseSettingsDocumentFile, downloadSettingsDocument } from "../../../src/settings/settingsPersistence";
import { SETTINGS_VERSION } from "../../../src/settings/settingsMigrations";
import { test } from "vitest";

type FetchLike = typeof globalThis.fetch;
const originalFetch = globalThis.fetch;
let fetchCall: unknown;
const respond = (ok: boolean, body: unknown): FetchLike =>
  (async (url: unknown, options: unknown) => {
    fetchCall = { url, options };
    return { ok, json: async () => body } as Response;
  }) as FetchLike;

test("Settings I/O: fetch, migrate on import, malformed JSON and download", async () => {
  try {
    globalThis.fetch = respond(true, { side: "stradella", basses: "96", progressionAllowApproximations: true });
    const value = await fetchDefaultSettingsDocument("/base/default-settings.json");
    assert.deepEqual(fetchCall, { url: "/base/default-settings.json", options: { cache: "no-store" } });
    assert.equal(value?.basses, "96");
    assert.equal(value?.settingsVersion, SETTINGS_VERSION, "fetched defaults are migrated");
    assert.ok(value && !("progressionAllowApproximations" in value), "retired keys are dropped on fetch");
    globalThis.fetch = respond(false, null);
    assert.equal(await fetchDefaultSettingsDocument("/base/default-settings.json"), null);
    globalThis.fetch = respond(true, null);
    assert.equal(await fetchDefaultSettingsDocument("/base/default-settings.json"), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
  const fileWith = (text: string) => ({ text: async () => text }) as File;
  const partial = await parseSettingsDocumentFile(fileWith('{"basses":"72"}'));
  assert.deepEqual(partial, { basses: "72", settingsVersion: SETTINGS_VERSION }, "partial legacy imports keep their keys");
  await assert.rejects(parseSettingsDocumentFile(fileWith("{bad json")), SyntaxError);
  // Download name and DOM cleanup, without a browser.
  const globals = globalThis as unknown as { document?: unknown };
  const oldDocument = globals.document;
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  let downloaded: [string, string] | undefined;
  let revoked: string | undefined;
  const anchor = { href: "", download: "", click() { downloaded = [this.href, this.download]; }, remove() {} };
  globals.document = { createElement: () => anchor, body: { appendChild() {} } };
  URL.createObjectURL = () => "blob:settings";
  URL.revokeObjectURL = (url: string) => { revoked = url; };
  try {
    downloadSettingsDocument(partial);
    assert.deepEqual(downloaded, ["blob:settings", "accordion-tools-settings.json"]);
    assert.equal(revoked, "blob:settings");
  } finally {
    globals.document = oldDocument;
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
  }
});
