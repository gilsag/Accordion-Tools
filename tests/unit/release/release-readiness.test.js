/** Build-independent release preflight. Behavioral tests are the separate
 * authoritative gate: this checks metadata and file references only. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { APP_INFO } from '../../../src/config/appInfo';
import { test } from "vitest";

const read = path => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const readme = read('README.md');

test("Version files, the About panel and the Pages base path agree", () => {
  assert.equal(pkg.version, lock.version, 'package.json and package-lock.json disagree');
  assert.equal(pkg.version, lock.packages?.['']?.version, 'root package-lock version differs');
  assert.ok(readme.includes(`**Version:** ${pkg.version}`), 'README version differs');
  assert.equal(APP_INFO.version, pkg.version, 'About panel version differs from package.json');
  assert.match(read('vite.config.ts'), /base:\s*["']\/Accordion-Tools\/["']/,
    'GitHub Pages base path changed');
});

test("The package version must never fall behind a published tag (v0.20.0 was tagged while the files still read…", () => {
  // The package version must never fall behind a published tag (v0.20.0 was
  // tagged while the files still read 0.19.0). Skipped outside a git checkout
  // or when tags were not fetched.
  const versionParts = text => text.replace(/^v/, '').split('.').map(Number);
  const compareVersions = (a, b) => {
    const [x, y] = [versionParts(a), versionParts(b)];
    for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
    return 0;
  };
  let tags = [];
  try {
    tags = execFileSync('git', ['tag', '--list', 'v[0-9]*'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/).filter(tag => /^v\d+\.\d+\.\d+$/.test(tag));
  } catch { /* not a git checkout */ }
  const newestTag = tags.sort(compareVersions).at(-1);
  if (newestTag) {
    assert.ok(compareVersions(pkg.version, newestTag) >= 0,
      `package.json is at ${pkg.version} but tag ${newestTag} already exists; bump the version files`);
  }
  assert.ok(read('VERSION_HISTORY.md').startsWith(`## v${pkg.version} `),
    'VERSION_HISTORY.md does not start with the current version');
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
});
