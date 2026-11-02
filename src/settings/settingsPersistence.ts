import type { DefaultSettingsFile } from "./settingsSchema";

/** Fetch editable defaults on each load, keeping the previous no-store policy.
 * A missing/unavailable file is allowed: App retains its built-in defaults.
 */
export async function fetchDefaultSettingsDocument(url: string): Promise<DefaultSettingsFile | null> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const value: unknown = await response.json();
  return value && typeof value === "object" ? value as DefaultSettingsFile : null;
}

/** The imported JSON remains a partial, backward-compatible settings object.
 * Runtime validation is performed by the existing application setters.
 */
export async function parseSettingsDocumentFile(file: File): Promise<DefaultSettingsFile> {
  return JSON.parse(await file.text()) as DefaultSettingsFile;
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
