import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Exercise the exact production filter code, with type-only imports erased.
// No test-only reimplementation of its predicates or ranking.
const source = readFileSync("src/app/inspector/stradellaInspectorRows.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { filterRealizationRows } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(compiled)}`);
const bass = (pitchClass, id = `bass-${pitchClass}`) => ({id, kind: "bass-root", pitchClass});
const chord = (name) => ({id: `chord-${name}`, kind: "chord-major", chordRoot: name});
const make = (playbackButtons, other = {}) => ({
  playable: true, exact: false, missingPitches: ["D"],
  buttons: playbackButtons, playbackButtons, ...other,
});
const candidates = [
  make([bass("A"), chord("C")], {recommended: true}),
  make([bass("C"), bass("D"), chord("F")]),
  make([chord("C")], {buttons: [bass("C", "visual-guide"), chord("C")], exact: true, missingPitches: []}),
  make([bass("C"), chord("C")], {exact: true, missingPitches: []}),
  make([bass("C"), chord("F"), chord("G")]),
];
const original = candidates.map((candidate) => candidate.playbackButtons.map((b) => b.id));
const all = filterRealizationRows(candidates, "C", {rootInBass: false, exactOnly: false, atMostTwo: false});
assert.deepEqual(all.map((row) => row.originalIndex), [0, 1, 2, 3, 4]);
const root = filterRealizationRows(candidates, "C", {rootInBass: true, exactOnly: false, atMostTwo: false});
assert.deepEqual(root.map((row) => row.originalIndex), [1, 3, 4], "root filter includes played root in multi-bass recipes, never reference markers");
const combined = filterRealizationRows(candidates, "C", {rootInBass: true, exactOnly: true, atMostTwo: true});
assert.deepEqual(combined.map((row) => row.originalIndex), [3]);
assert.strictEqual(combined[0].candidate, candidates[3], "inspector does not copy/reconstruct musical results");
const small = filterRealizationRows(candidates, "C", {rootInBass: false, exactOnly: false, atMostTwo: true});
assert.deepEqual(small.map((row) => row.originalIndex), [0, 2, 3], "three played buttons are excluded");
assert.deepEqual(candidates.map((candidate) => candidate.playbackButtons.map((b) => b.id)), original, "filter is read-only");
assert.deepEqual(filterRealizationRows([], "C", {rootInBass: true, exactOnly: true, atMostTwo: true}), []);

// Exercise shared, tool-neutral inspector activation (without React or test-only predicates).
const selectionSource = readFileSync("src/app/inspector/inspectorSelection.ts", "utf8");
const selectionCompiled = ts.transpileModule(selectionSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { resolveWorkspaceInspector } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(selectionCompiled)}`);
const context = {leftPanelMode: "tools", workspaceMode: "accordion", side: "stradella", stradellaChordFinderActive: true};
assert.equal(resolveWorkspaceInspector(context), "stradellaChordFinder", "current tool activates the shared slot");
assert.equal(resolveWorkspaceInspector({...context, stradellaChordFinderActive: false}), null, "inactive Finder leaves no inspector");
assert.equal(resolveWorkspaceInspector({...context, side: "treble"}), null, "other manuals remain unchanged");
assert.equal(resolveWorkspaceInspector({...context, workspaceMode: "harmony"}), null, "other workspaces remain unchanged");
assert.equal(resolveWorkspaceInspector({...context, leftPanelMode: "settings"}), null, "settings keep original layout");
assert.equal(resolveWorkspaceInspector({...context, leftPanelMode: "hidden"}), null, "focus mode remains inspector-free");

const app = readFileSync("src/App.tsx", "utf8");
const slot = readFileSync("src/app/inspector/WorkspaceInspectorSlot.tsx", "utf8");
const frame = readFileSync("src/app/inspector/WorkspaceInspectorFrame.tsx", "utf8");
const inspector = readFileSync("src/app/inspector/StradellaResultsInspector.tsx", "utf8");
const css = readFileSync("src/App.css", "utf8");
assert.match(app, /resolveWorkspaceInspector\(/, "layout asks shared resolver for active content");
assert.match(app, /<WorkspaceInspectorSlot inspector=\{inspector\}/, "layout composes generic inspector slot");
assert.doesNotMatch(app, /StradellaResultsInspector|stradellaChordFinderRealizationIndex/, "layout does not own tool-specific inspector props");
assert.match(slot, /onSelect=\{tools\.setStradellaChordFinderRealizationIndex\}/, "reuse existing Finder selected-index owner");
assert.match(slot, /lazy\(\(\) => import\("\.\/StradellaResultsInspector"\)/, "tool content stays lazy-loaded");
assert.match(frame, /className="workspace-inspector"/, "tool-neutral inspector frame is reusable");
assert.match(inspector, /<WorkspaceInspectorFrame title=\{t\("inspector.title"\)\} blocked=\{blocked\}>/, "Stradella content uses shared frame and inherits modal inertness");
assert.match(css, /\.app:has\(> \.workspace-inspector\)/, "responsive layout is independent of tool name");
assert.doesNotMatch(css, /\.finder-inspector/, "no Stradella-only shell CSS remains");
assert.match(inspector, /onSelect\(originalIndex\)/, "rows select original engine index, not filtered row index");
assert.match(inspector, /aria-pressed=\{originalIndex === selectedIndex\}/, "focusable selection button exposes selected state");
assert.match(inspector, /selectedHidden/, "a hidden selection is disclosed, not replaced");
assert.doesNotMatch(inspector, /setSelectedIndex\(/, "no independent selection owner");
for (const lang of ["en", "es", "fr", "pt", "it", "de"]) {
  const locale = readFileSync(`src/i18n/${lang}.ts`, "utf8");
  for (const key of ["rootInBass", "exactOnly", "atMostTwo", "hiddenSelection", "selectRank"]) {
    assert.ok(locale.includes(`"inspector.${key}"`), `${lang} has ${key} label`);
  }
}
console.log("✓ Shared inspector activation plus Stradella filters, original ranks, identities, lazy loading and six locales passed");
