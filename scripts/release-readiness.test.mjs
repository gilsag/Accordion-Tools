/** Build-independent release preflight. Behavioral tests are the separate
 * authoritative gate: this checks metadata and file references only. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const read = path => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const info = read('src/config/appInfo.ts');
const readme = read('README.md');
assert.equal(pkg.version, lock.version, 'package.json and package-lock.json disagree');
assert.equal(pkg.version, lock.packages?.['']?.version, 'root package-lock version differs');
assert.match(info, new RegExp(`version: ["']${pkg.version.replace(/\./g, '\\.')}["']`));
assert.ok(readme.includes(`**Version:** ${pkg.version}`), 'README version differs');
assert.match(read('vite.config.ts'), /base:\s*["']\/Accordion-Tools\/["']/,
  'GitHub Pages base path changed');
assert.ok(existsSync('docs/internal/release-v0.16.0-validation.md'), 'Release acceptance checklist missing');

const docs = ['README.md', 'VERSION_HISTORY.md'];
function scan(dir) {
 for (const item of readdirSync(dir, { withFileTypes: true })) {
  const path = `${dir}/${item.name}`;
  if (item.isDirectory()) scan(path);
  else if (item.name.endsWith('.md')) docs.push(path);
 }
}
scan('docs');
let links = 0;
for (const file of docs) {
  // Local Markdown links only; headings and external URLs are out of scope.
  for (const match of read(file).matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/\s+"[^"]*"$/, '').split('#')[0].split('?')[0].trim();
    if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;
    links++;
    assert.ok(existsSync(resolve(dirname(file), decodeURIComponent(target))),
      `Broken documentation link in ${file}: ${target}`);
  }
}
console.log(`✓ Release metadata and GitHub Pages base aligned at ${pkg.version}; ${links} local documentation links valid`);
