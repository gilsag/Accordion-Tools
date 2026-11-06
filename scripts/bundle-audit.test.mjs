import assert from 'node:assert/strict';
import { auditBundleManifest } from './bundle-audit-lib.mjs';

const paths = [
  'src/components/tools/TrebleChordFinderPanel.tsx',
  'src/components/tools/StradellaChordFinderPanel.tsx',
  'src/components/tools/HarmonyExplorerPanel.tsx',
  'src/components/tools/ProgressionAssistantPanel.tsx',
  'src/tools/harmonyExplorer/components/HarmonicCircle.tsx',
  'src/tools/abcPlayerTools.ts',
  'src/components/settings/DocumentationViewer.tsx',
  'src/i18n/es.ts',
  'src/i18n/fr.ts',
  'src/i18n/pt.ts',
  'src/i18n/it.ts',
  'src/i18n/de.ts',
];
const manifest = {
  'index.html': { file: 'assets/main.js', isEntry: true, imports: ['_shared.js'], dynamicImports: paths },
  '_shared.js': { file: 'assets/shared.js' },
  'node_modules/abcjs/dist/abcjs-basic-min.js': { file: 'assets/abcjs.js', isDynamicEntry: true },
};
for (const [index, path] of paths.entries()) manifest[path] = {
  file: `assets/lazy-${index}.js`, src: path, isDynamicEntry: true,
};
const result = auditBundleManifest(manifest);
assert.equal(result.deferred.length, paths.length);
assert.deepEqual(result.eagerKeys.sort(), ['_shared.js', 'index.html'].sort());
assert.equal(result.abcjsKeys.length, 1);

const eagerAccident = structuredClone(manifest);
eagerAccident['index.html'].imports.push(paths[0]);
assert.throws(() => auditBundleManifest(eagerAccident), /initial import graph/);
const missingChunk = structuredClone(manifest);
delete missingChunk[paths[1]];
assert.throws(() => auditBundleManifest(missingChunk), /missing from build manifest/);
const missingSource = structuredClone(manifest);
missingSource[paths[2]].isDynamicEntry = false;
assert.throws(() => auditBundleManifest(missingSource), /not a dynamic entry/);
console.log('✓ Production manifest audit: split, eager-leak, missing-chunk and accidental-eager fixtures passed');
