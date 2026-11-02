import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverAbcExamples } from "./abc-example-catalog.mjs";

const project = fileURLToPath(new URL("../", import.meta.url));
const sourceDir = join(project, "public", "abc");
const original = await discoverAbcExamples(sourceDir);
assert(original.length >= 14, "All existing examples should be discovered");
assert.equal(original.filter((x) => x.label === "Bella Ciao").length, 1, "Duplicate files should not create duplicate examples");
for (let n = 1; n <= 5; n++) {
  assert(original.some((x) => x.label === `Cueca floreo ${n}`), `Cueca floreo ${n} is discoverable`);
}
assert(original.some((x) => x.value === "katyusha" && x.label === "Katyusha"));
assert(original.some((x) => x.value === "easy-polka" && x.label === "Easy Polka"));
assert(original.some((x) => x.value === "bella-ciao"), "Stable existing example ID must be retained");

const sandbox = await mkdtemp(join(tmpdir(), "accordion-abc-test-"));
try {
  await writeFile(join(sandbox, "new-file.abc"), "X:1\nT:New Song\nM:2/4\nK:C\nC2|\n");
  await writeFile(join(sandbox, "a space.abc"), "X:1\nT:My Special Tune\nK:C\nC|\n");
  await writeFile(join(sandbox, "same-notes.abc"), "X:1\nT:New Song\nM:2/4\nK:C\nC2|\n");
  await writeFile(join(sandbox, "untitled.abc"), "X:1\nK:C\nE|\n");
  await writeFile(join(sandbox, "ignore.txt"), "X:1\nT:Not an ABC example\n");
  let found = await discoverAbcExamples(sandbox);
  assert.deepEqual(found.map((x) => x.label), ["My Special Tune", "New Song", "untitled"]);
  assert.equal(found.find((x) => x.label === "My Special Tune")?.file, "abc/a%20space.abc");
  await writeFile(join(sandbox, "added-later.abc"), "X:1\nT:Added later\nK:C\nD|\n");
  found = await discoverAbcExamples(sandbox);
  assert(found.some((x) => x.label === "Added later"), "Files added after startup should be discovered");
  await rm(join(sandbox, "added-later.abc"));
  assert(!(await discoverAbcExamples(sandbox)).some((x) => x.label === "Added later"));
} finally {
  await rm(sandbox, { recursive: true, force: true });
}
console.log("ABC example automatic discovery and deduplication passed.");
