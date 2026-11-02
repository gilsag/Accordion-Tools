/** Run after `vite build --manifest`. Logs measurable split sizes using the
 * generated manifest; refuses to certify a build with eager heavy-tool entrypoints. */
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { auditBundleManifest } from './bundle-audit-lib.mjs';

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
console.log('NOTE: manifest checks do not replace first-use browser and network testing.');
