/** Validate that every checked-in automated test has a discoverable npm entry.
 * Keep this test agnostic about module ownership and source file layout. */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
const allScripts = Object.values(scripts).join("\n");
const references = new Set(Array.from(
  allScripts.matchAll(/\bscripts\/([\w./-]+\.test\.(?:ts|mjs|cjs))\b/g),
  match => join("scripts", match[1]),
));
const testFiles = readdirSync("scripts").filter(name => /\.test\.(?:ts|mjs|cjs)$/.test(name))
  .map(name => join("scripts", name));
const unlisted = testFiles.filter(path => !references.has(path));
const missing = [...references].filter(path => !existsSync(path));
assert.deepEqual(unlisted, [], `Automated tests missing from npm scripts: ${unlisted.join(", ")}`);
assert.deepEqual(missing, [], `npm scripts reference missing tests: ${missing.join(", ")}`);
// Browser tests need a browser download, so they run on their own.
assert.ok(scripts["test:e2e"], "The browser suite needs its own npm entry");
assert.doesNotMatch(scripts["test:all"], /test:e2e/, "test:all must run without a browser");
const specs = readdirSync("e2e").filter(name => name.endsWith(".spec.ts"));
assert.ok(specs.length > 0, "Browser specs missing from e2e/");
assert.match(scripts["verify:release"], /npm run test:all/,
  "Release verification must include the complete regression suite");
console.log(`Test-suite integrity passed: ${testFiles.length} discoverable tests, no missing paths, ${specs.length} browser specs under test:e2e.`);
