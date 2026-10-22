/* Static regression checks for two-state controls. These checks complement,
   but do not replace, manual browser and keyboard-accessibility testing. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(path, "utf8");
const app = source("src/App.tsx");
const panel = source("src/components/tools/StradellaChordFinderPanel.tsx");
const component = source("src/components/ui/BinaryChoiceButton.tsx");

assert.match(app, /whenEnabled="Hide Stradella row labels" whenDisabled="Show Stradella row labels"/);
assert.match(panel, /whenEnabled="Hide root bass reference"/);
assert.match(panel, /whenDisabled="Show root bass reference"/);
assert.match(component, /aria-pressed=\{enabled\}/, "Binary buttons should expose their selected state");
assert.match(component, /onClick=\{onToggle\}/, "Binary buttons should invoke the shared state callback");
assert.match(app, /<SegmentedChoice label="Download format"/);
for (const label of ["Bass/counterbass grouping", "Preset chord grouping", "Sound source", "Stradella sample pitch mapping", "Interface density"]) {
  assert.ok(app.includes(`<SegmentedChoice label="${label}"`) || app.includes(`<SegmentedChoice label={<>${label} `), `Missing persistent choice: ${label}`);
}
const segmented = source("src/components/ui/SegmentedChoice.tsx");
assert.match(segmented, /aria-pressed=\{value === option.value\}/);
assert.match(segmented, /onClick=\{\(\) => onChange\(option.value\)\}/);


function tsxFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const full = join(folder, entry.name);
    return entry.isDirectory() ? tsxFiles(full) : entry.name.endsWith(".tsx") ? [full] : [];
  });
}

const literalTwoOptionSelects: string[] = [];
for (const filename of tsxFiles("src")) {
  const text = source(filename);
  for (const match of text.matchAll(/<select\b[^>]*>([\s\S]*?)<\/select>/g)) {
    const body = match[1];
    const options = [...body.matchAll(/<option\b/g)];
    if (options.length === 2 && !body.includes(".map(")) literalTwoOptionSelects.push(filename);
  }
}
assert.deepEqual(literalTwoOptionSelects, [], "Two-literal-option dropdowns should use a binary action button");

console.log("✓ Binary control static regression checks passed");
