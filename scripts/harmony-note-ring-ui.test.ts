import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDiagramExplanation } from "../src/tools/harmonyExplorer/explanation";
import { SUPPORTED_LANGUAGES, EN, ES, FR, PT, IT, DE } from "../src/i18n/catalog";

const inputs = {
  referenceFamilyName: "Major",
  relatedFamilyName: "minor",
  scaleName: "Ionian",
  diatonicOnly: false,
  highlightDiatonic: true,
  allFamiliesMode: false,
  counts: [2, 1],
  availableCounts: [2, 1],
  allCounts: [2, 1],
};
const catalogs = { en: EN, es: ES, fr: FR, pt: PT, it: IT, de: DE };
for (const { code } of SUPPORTED_LANGUAGES) {
  const on = buildDiagramExplanation({ ...inputs, language: code, showNoteRing: true });
  const off = buildDiagramExplanation({ ...inputs, language: code, showNoteRing: false });
  const defaultText = buildDiagramExplanation({ ...inputs, language: code });
  assert.ok(on.includes(catalogs[code]["analysis.harmonyNoteRing"]), `${code}: missing note-ring explanation`);
  assert.ok(!off.includes(catalogs[code]["analysis.harmonyNoteRing"]), `${code}: explanation present when hidden`);
  assert.equal(defaultText, off, `${code}: legacy API should keep unchanged behavior`);
  assert.ok(catalogs[code]["ui.noteRingLegendTitle"]);
  assert.ok(catalogs[code]["ui.noteRingLegendDetail"]);
  assert.ok(catalogs[code]["ui.referenceChordRing"]);
  const allFamilies = buildDiagramExplanation({ ...inputs, language: code, allFamiliesMode: true, showNoteRing: true });
  assert.ok(allFamilies.includes(catalogs[code]["analysis.harmonyNoteRing"]), `${code}: all families`);
}

const app = [readFileSync("src/App.tsx", "utf8"), readFileSync("src/app/useAppController.ts", "utf8"), readFileSync("src/app/views/SettingsView.tsx", "utf8"), readFileSync("src/app/views/ToolsView.tsx", "utf8"), readFileSync("src/app/views/WorkspaceView.tsx", "utf8")].join("\n");
const explorer = readFileSync("src/features/harmonyExplorer/useHarmonyExplorer.ts", "utf8");
// Settings import/serialization contracts live in the Phase 2 settings controller.
const settingsController = readFileSync("src/settings/settingsController.ts", "utf8");
const circle = readFileSync("src/tools/harmonyExplorer/components/HarmonicCircle.tsx", "utf8");
const panel = readFileSync("src/components/tools/HarmonyExplorerPanel.tsx", "utf8");
const css = readFileSync("src/App.css", "utf8");
const settings = JSON.parse(readFileSync("public/default-settings.json", "utf8"));
assert.equal(settings.harmonyShowNoteRing, true);
assert.equal(settings.stradellaShowNominalNoteSpacing, true);
assert.match(explorer, /\[harmonyShowNoteRing, setHarmonyShowNoteRing\] = useState\(true\)/);
assert.match(app, /setHarmonyShowNoteRing\(true\)/);
assert.match(explorer, /showNoteRing: harmonyShowNoteRing/);
assert.match(explorer, /harmonyAllFamiliesMode,\s+harmonyShowNoteRing,\s+harmonyCounts/);
assert.match(app, /\[showStradellaVoicingIntervals, setShowStradellaVoicingIntervals\] = useState\(true\)/);
assert.match(settingsController, /typeof settings\.stradellaShowNominalNoteSpacing === "boolean"/);
assert.match(settingsController, /stradellaShowNominalNoteSpacing: showStradellaVoicingIntervals/);
assert.match(circle, /\.\.\.\(showNoteRing \? \[\{/);
assert.match(circle, /ui\.noteRingLegendTitle/);
assert.match(circle, /ui\.referenceChordRing/);
assert.match(panel, /<HelpTip text=\{allFamiliesMode \? t\("ui\.allFamiliesDiatonicHint"\) : t\("ui\.diatonicContext"\)\}/);
assert.doesNotMatch(panel, /<p className="hint">\s*\{allFamiliesMode/);
assert.match(css, /\.finder-note-level-options \{[^}]*padding-left: 0;/);
assert.match(css, /\.finder-voicing-spacing-option \{[^}]*margin-left: 1\.45rem;/);
console.log("Harmony note ring, default settings, and control alignment tests passed.");
