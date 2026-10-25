/* Guard against untranslated visible text creeping back into application tools.
 * Musical symbols, technical formats and the intentionally English-only guides
 * are excluded. This is a static guard, not a substitute for browser review.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const sources = [
  'src/App.tsx',
  'src/components/tools/StradellaChordFinderPanel.tsx',
  'src/components/tools/TrebleChordFinderPanel.tsx',
  'src/components/tools/HarmonyExplorerPanel.tsx',
  'src/components/tools/ProgressionAssistantPanel.tsx',
  'src/tools/harmonyExplorer/components/HarmonicCircle.tsx',
];
const allowed = /^(?:English|Español|ABC|MIDI|LilyPond|La Melodiosa|public\/default-settings\.json|CC BY-NC 4\.0|BPM|px|ms|cents|maj7|st\s*·|Do Re Mi Fa|C(?:\sD\sE\sF(?:\sG\sA\sH)?)?|C, Cm, Cmaj7|CM, Cm, CM7|Cmaj, Cmin, Cmaj7)$/;
const problems = [];
for (const file of sources) {
  const text = fs.readFileSync(file, 'utf8');
  const parsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(parsed.parseDiagnostics.length, 0, `${file} must parse`);
  const walk = (node) => {
    if (ts.isJsxText(node)) {
      const value = node.getText(parsed).replace(/\s+/g, ' ').trim();
      // Ignore markup whitespace, numbers, musical chord symbols, and units.
      if (/[a-zA-Z]{3}/.test(value) && !allowed.test(value)) {
        const {line} = parsed.getLineAndCharacterOfPosition(node.getStart(parsed));
        problems.push(`${file}:${line + 1} untranslated JSX text: ${value.slice(0, 110)}`);
      }
    }
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)
        && ['title', 'aria-label', 'placeholder'].includes(node.name.text)
        && /[A-Za-z]{3}/.test(node.initializer.text)
        && !allowed.test(node.initializer.text)
        && !/^\d/.test(node.initializer.text)) {
      const {line} = parsed.getLineAndCharacterOfPosition(node.getStart(parsed));
      problems.push(`${file}:${line + 1} hard-coded ${node.name.text}: ${node.initializer.text.slice(0, 100)}`);
    }
    ts.forEachChild(node, walk);
  };
  walk(parsed);
}
assert.deepEqual(problems, [], `UI controls must use localized resources:\n${problems.join('\n')}`);

const app = fs.readFileSync('src/App.tsx', 'utf8');
for (const legacy of ['Selection on click', 'Hide scale', 'Stop click-to-label', 'Record sequence',
  'Loads a simple ABC tune.', 'Edit one pattern object', 'Delete annotation ${index',
  'Target notes:', 'Arrow thickness:', 'Number font size:', 'No ABC loaded']) {
  assert.ok(!app.includes(legacy), `Untranslated string still in App.tsx: ${legacy}`);
}
console.log('✓ Tool panels, Harmony diagram and key UI controls have no untranslated hard-coded labels');
