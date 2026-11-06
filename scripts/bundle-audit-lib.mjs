/** Inspect Vite's production manifest without depending on chunk hash names.
 * It is a release gate for feature splitting; the size budgets below are
 * enforced by audit-production-bundle.mjs. */
import assert from 'node:assert/strict';

const LAZY_MODULES = [
  'src/components/tools/TrebleChordFinderPanel.tsx',
  'src/components/tools/StradellaChordFinderPanel.tsx',
  'src/components/tools/HarmonyExplorerPanel.tsx',
  'src/components/tools/ProgressionAssistantPanel.tsx',
  'src/tools/harmonyExplorer/components/HarmonicCircle.tsx',
  'src/tools/abcPlayerTools.ts',
  // Opened only from Settings -> About; carries every guide as raw Markdown.
  'src/components/settings/DocumentationViewer.tsx',
  // Only English is bundled at startup; the other catalogs load on demand.
  'src/i18n/es.ts',
  'src/i18n/fr.ts',
  'src/i18n/pt.ts',
  'src/i18n/it.ts',
  'src/i18n/de.ts',
];

/** Gzip budget for the JavaScript and CSS a first visit must download before
 * the diagram appears. Measured at 177 KiB after deferring the guides and five
 * language catalogs (317 KiB in v0.17.0); the headroom is for ordinary growth,
 * not for another eager catalog or guide bundle. */
export const INITIAL_GZIP_BUDGET_KIB = 200;
/** Startup public assets (favicon) should stay icon-sized. */
export const STARTUP_ASSET_BUDGET_KIB = 16;

export function auditBundleManifest(manifest) {
  assert.ok(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Invalid Vite manifest');
  const entries = Object.entries(manifest);
  const entry = entries.find(([key, value]) => value.isEntry && (key === 'index.html' || key.endsWith('/main.tsx')));
  assert.ok(entry, 'Missing application entrypoint in Vite manifest');
  const [entryKey] = entry;
  const eager = new Set();
  const visit = key => {
    if (eager.has(key)) return;
    assert.ok(manifest[key], `Missing manifest import: ${key}`);
    eager.add(key);
    for (const imported of manifest[key].imports ?? []) visit(imported);
  };
  visit(entryKey);

  const deferred = LAZY_MODULES.map(source => {
    // Vite manifests use original module paths for dynamically imported entrypoints.
    const match = entries.find(([key, value]) => key === source || value.src === source);
    assert.ok(match, `Expected lazy module missing from build manifest: ${source}`);
    const [key, chunk] = match;
    assert.equal(chunk.isDynamicEntry, true, `Lazy module is not a dynamic entry: ${source}`);
    assert.equal(eager.has(key), false, `Lazy module entered the initial import graph: ${source}`);
    return { source, key, file: chunk.file };
  });

  const abcjs = entries.filter(([key, chunk]) => /(^|\/)abcjs(\/|$)/i.test(key) || /(^|\/)abcjs(\/|$)/i.test(chunk.src ?? ''));
  for (const [key] of abcjs) {
    assert.equal(eager.has(key), false, `abcjs entered the initial static bundle: ${key}`);
  }
  return { entryKey, eagerKeys: [...eager], deferred, abcjsKeys: abcjs.map(([key]) => key) };
}
