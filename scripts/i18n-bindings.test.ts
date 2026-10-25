import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EN } from "../src/i18n/catalog";

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}
const keys = new Set(Object.keys(EN));
const unknown: string[] = [];
for (const file of files("src")) {
  const contents = readFileSync(file, "utf8");
  for (const binding of contents.matchAll(/\bt\(\s*["']([A-Za-z0-9.]+)["']/g)) {
    if (!keys.has(binding[1])) unknown.push(`${file}: ${binding[1]}`);
  }
}
assert.deepEqual(unknown, [], "Translated UI components must use valid catalog keys");
console.log("✓ Interface translation bindings reference known catalog keys");
