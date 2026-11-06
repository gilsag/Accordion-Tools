import type { DefaultSettingsFile } from "./settingsSchema";
import { migrateSettingsDocument } from "./settingsMigrations";

/** Fetch editable defaults on each load, keeping the previous no-store policy.
 * A missing/unavailable file is allowed: App retains its built-in defaults.
 */
export async function fetchDefaultSettingsDocument(url: string): Promise<DefaultSettingsFile | null> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const value: unknown = await response.json();
  return value && typeof value === "object" ? migrateSettingsDocument(value) : null;
}

/** Imported JSON is brought up to the current settings version first; any
 * older file still imports. Runtime validation is done by the app setters.
 */
export async function parseSettingsDocumentFile(file: File): Promise<DefaultSettingsFile> {
  return migrateSettingsDocument(JSON.parse(await file.text()));
}

/** Serialize with the same ordering/indentation and filename as older releases. */
export function downloadSettingsDocument(settings: DefaultSettingsFile): void {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "accordion-tools-settings.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
