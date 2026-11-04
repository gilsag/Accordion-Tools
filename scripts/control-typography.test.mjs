/** Presentation contract regression: shared density typography and adjacent help icons.
 * Full wrapping/focus/tooltip behavior must also be checked in an actual browser. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const css = source("src/App.css");
const section = source("src/components/ui/CollapsibleSection.tsx");
const tools = source("src/app/views/ToolsView.tsx");
const harmony = source("src/components/tools/HarmonyExplorerPanel.tsx");
const progression = source("src/components/tools/ProgressionAssistantPanel.tsx");
const stradella = source("src/components/tools/StradellaChordFinderPanel.tsx");

// One density-aware text hierarchy is shared by tool navigation, controls and inspector.
for (const density of ["compact", "comfortable"]) {
  assert.match(css, new RegExp(`\\.density-${density} \\{[\\s\\S]*?--ui-control-font:`));
  assert.match(css, new RegExp(`\\.density-${density} \\{[\\s\\S]*?--ui-section-font:`));
}
assert.match(css, /\.section-title\s*\{[^}]*font-size:\s*var\(--ui-section-font\)/);
assert.match(css, /\.left-panel\s+\.tool-fieldset\s*>\s*legend\s*\{[^}]*font-size:\s*var\(--ui-control-font\)/);
assert.match(css, /\.workspace-inspector h2\s*\{[^}]*var\(--ui-heading-font\)/);
assert.match(css, /\.inspector-table\s*\{[^}]*var\(--ui-dense-font\)/);
assert.match(css, /\.label-line\s*\{[^}]*white-space:\s*normal/);
assert.match(css, /\.stradella-register-intro-help\s*\{[^}]*justify-content:\s*flex-start/);

// Expansion state is announced and the glyph stays decorative.
assert.match(section, /aria-expanded=\{isOpen\}/);
assert.match(section, /span aria-hidden="true"/);
assert.match(tools, /aria-expanded=\{activeToolSection === "scaleFinder"\}/);

// Assistive text belongs to its title, not a separate checkbox-grid column.
assert.match(harmony, /<span className="label-line">\{t\("settings\.noteRing"\)\}\s*<HelpTip text=\{t\("tools\.noteRingHelp"\)\}/);
assert.match(harmony, /<span className="label-line">\{t\("tools\.diatonicOnly"\)\}\s*<HelpTip text=\{t\("ui\.diatonicOnlyHelp"\)\}/);
assert.doesNotMatch(progression, /ui\.allowConservativeFifthOmissionApproximations/, "Deprecated approximation toggle is no longer shown");
assert.match(progression, /<HelpTip text=\{t\("ui\.progressionHandHelp"\)\}/);
assert.match(progression, /<HelpTip text=\{t\("ui\.progressionVoiceLeadingHelp"\)\}/);
assert.match(stradella, /<span className="label-line">\{t\("tools\.showExplanationBelow"\)\}\s*<HelpTip text=\{t\("ui\.diagramNoteHelp"\)\}/);
assert.match(stradella, /<span className="label-line">\{t\("ui\.showVoicingIntervals"\)\}\s*<HelpTip text=\{t\("ui\.voicingIntervalsHelp"\)\}/);

// The desktop styling must not overwrite user-specified diagram font sizes.
const workspace = source("src/app/views/WorkspaceView.tsx");
assert.match(workspace, /fontSize: `\$\{trebleFooterEnabled \? trebleFooterFontSize : finderExplanationFontSize\}px`/);
assert.match(workspace, /fontSize=\{finderExplanationFontSize\}/);
assert.doesNotMatch(css, /\.diagram\s+\.finder-annotation-block[^\{]*\{[^}]*font-size:/);
console.log("✓ Density typography, section semantics, help adjacency and unchanged diagram-font ownership passed");
