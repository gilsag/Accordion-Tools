/** Build-independent evidence that expensive ABC and feature modules
 * are reached only through dynamic boundaries, not initial static imports. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import ts from "typescript";

const read = path => readFileSync(path, "utf8");
const tools = read("src/app/views/ToolsView.tsx");
const workspace = read("src/app/views/WorkspaceView.tsx");
const abc = read("src/features/abcPlayer/useAbcPlayer.ts");
const loader = read("src/features/abcPlayer/abcEngineLoader.ts");
const notation = read("src/notation/notationService.ts");
const optionModule = read("src/app/controllerOptions.ts");
const notationSettings = read("src/notation/useNotationSettings.ts");

for (const name of ["TrebleChordFinderPanel", "StradellaChordFinderPanel", "HarmonyExplorerPanel", "ProgressionAssistantPanel"]) {
  assert.match(tools, new RegExp(`lazy\\(\\(\\) => import\\("\\.\\./\\.\\./components/tools/${name}"\\)`), `${name} deferred`);
  assert.doesNotMatch(tools, new RegExp(`^import.*${name}`, "m"), `${name} not eagerly imported`);
}
assert.match(workspace, /lazy\(\(\) => import\("\.\.\/\.\.\/tools\/harmonyExplorer\/components\/HarmonicCircle"\)/);
assert.match(loader, /import\("\.\.\/\.\.\/tools\/abcPlayerTools"\)/);
assert.match(notation, /import\("abcjs"\)/);
assert.doesNotMatch(notation, /^import .*from "abcjs";/m);
assert.match(abc, /import type \{ AbcParseResult, MappedAbcEvent \} from "\.\.\/\.\.\/tools\/abcPlayerTools";/);
assert.match(abc, /tempoBpm: 180/, "Empty-score tempo remains the original parser value");
assert.match(optionModule, /export const BASS_OPTIONS/, "Display constants remain outside the controller");
assert.match(notationSettings, /useNotationSettings\(\)/, "Notation state has an independent owner");

// Traverse static runtime imports starting at the application entrypoint.
// Type-only imports and lazy import() edges are intentionally excluded.
const seen = new Set();
const stack = [resolve("src/main.tsx")];
let abcjsEager = false;
while (stack.length) {
  const file = stack.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  const src = readFileSync(file, "utf8");
  const parsed = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true,
    extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  for (const node of parsed.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
    if (node.isTypeOnly || node.importClause?.isTypeOnly) continue;
    // An import containing only type specifiers produces no runtime dependency.
    if (ts.isImportDeclaration(node) && node.importClause &&
        !node.importClause.name && node.importClause.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings) &&
        node.importClause.namedBindings.elements.every(spec => spec.isTypeOnly)) continue;
    const spec = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
      ? node.moduleSpecifier.text : null;
    if (!spec) continue;
    if (spec === "abcjs") abcjsEager = true;
    if (!spec.startsWith(".")) continue;
    const base = resolve(dirname(file), spec);
    for (const candidate of [base, base + ".ts", base + ".tsx", base + ".js", base + ".mjs", resolve(base, "index.ts"), resolve(base, "index.tsx")]) {
      if (existsSync(candidate)) { if (/\.[jt]sx?$/.test(candidate)) stack.push(candidate); break; }
    }
  }
}
assert.equal(abcjsEager, false, "abcjs must not be reached from the initial static import graph");
console.log(`✓ Lazy panel and abcjs boundaries; ${seen.size} static entrypoint modules inspected`);
