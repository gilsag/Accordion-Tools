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
assert.match(scripts["test:all"], /npm run test:responsive/,
  "Responsive regressions must run as part of the full test suite");
assert.match(scripts["verify:release"], /npm run test:all/,
  "Release verification must include the complete regression suite");
console.log(`Test-suite integrity passed: ${testFiles.length} discoverable tests, no missing paths, responsive checks included.`);
