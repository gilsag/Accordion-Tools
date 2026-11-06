/** Run after `vite build --manifest`. Logs measurable split sizes using the
 * generated manifest; refuses to certify a build with eager heavy-tool entrypoints. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { auditBundleManifest, INITIAL_GZIP_BUDGET_KIB, STARTUP_ASSET_BUDGET_KIB } from './bundle-audit-lib.mjs';

const dist = resolve('dist');
const manifestPath = resolve(process.argv[2] ?? 'dist/.vite/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const result = auditBundleManifest(manifest);
const assetBytes = name => statSync(resolve(dist, name)).size;
const size = bytes => `${(bytes / 1024).toFixed(1)} KiB`;
const eagerFiles = [...new Set(result.eagerKeys.map(key => manifest[key].file).filter(Boolean))];
console.log(`Production entrypoint: ${result.entryKey}`);
console.log(`Initial static JS chunks: ${eagerFiles.length}; ${size(eagerFiles.reduce((sum, file) => sum + assetBytes(file), 0))} (uncompressed)`);
for (const item of result.deferred) console.log(`Lazy: ${item.source} => ${item.file} (${size(assetBytes(item.file))})`);
console.log(result.abcjsKeys.length
  ? `abcjs manifest entries not statically reached: ${result.abcjsKeys.join(', ')}`
  : 'abcjs is not separately named in the manifest; inspect the emitted dynamic chunks when validating first use.');
console.log('✓ No required heavy-tool entrypoint is part of the initial static import graph.');

// Size budget: what a first visit downloads before the diagram can render.
const eagerCss = [...new Set(result.eagerKeys.flatMap(key => manifest[key].css ?? []))];
const gzipKiB = files => files.reduce((sum, file) => sum + gzipSync(readFileSync(resolve(dist, file)), { level: 9 }).length, 0) / 1024;
const initialGzip = gzipKiB([...eagerFiles, ...eagerCss]);
console.log(`Initial JS + CSS: ${initialGzip.toFixed(1)} KiB gzip (budget ${INITIAL_GZIP_BUDGET_KIB} KiB)`);
assert.ok(initialGzip <= INITIAL_GZIP_BUDGET_KIB,
  `Initial download ${initialGzip.toFixed(1)} KiB gzip exceeds the ${INITIAL_GZIP_BUDGET_KIB} KiB budget; defer the new code or raise the budget deliberately.`);
const favicon = resolve(dist, 'favicon.svg');
if (existsSync(favicon)) {
  const faviconKiB = statSync(favicon).size / 1024;
  assert.ok(faviconKiB <= STARTUP_ASSET_BUDGET_KIB, `favicon.svg is ${faviconKiB.toFixed(1)} KiB; keep it under ${STARTUP_ASSET_BUDGET_KIB} KiB.`);
}
console.log('✓ Initial download and startup assets are within budget.');
console.log('NOTE: manifest checks do not replace first-use browser and network testing.');
