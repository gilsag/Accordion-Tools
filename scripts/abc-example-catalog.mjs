/** Build/dev-time discovery of public ABC files for GitHub Pages (static hosting). */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, parse } from "node:path";

const isAbcFile = (name) => !name.startsWith(".") && /\.abc$/i.test(name);

/** Discover every root-level .abc file; no manually maintained manifest. */
export async function discoverAbcExamples(directory) {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && isAbcFile(entry.name))
    .map((entry) => entry.name)
    // Prefer existing kebab-case filenames if duplicate files have identical content.
    .sort((a, b) => {
      const preferred = (name) => /^[a-z0-9-]+\.abc$/i.test(name) && name === name.toLowerCase() ? 0 : 1;
      return preferred(a) - preferred(b) || a.localeCompare(b, "en");
    });

  const seenContent = new Set();
  const seenIds = new Set();
  const examples = [];
  for (const name of entries) {
    const source = await readFile(join(directory, name), "utf8");
    const digest = createHash("sha256").update(source.replace(/\r\n/g, "\n")).digest("hex");
    if (seenContent.has(digest)) continue;
    seenContent.add(digest);
    const stem = parse(name).name;
    const id = stem;
    if (seenIds.has(id.toLowerCase())) {
      throw new Error(`ABC example ID collision: ${name}`);
    }
    seenIds.add(id.toLowerCase());
    const declaredTitle = source.match(/^\ufeff?T:[ \t]*(.*)$/m)?.[1]?.trim();
    const label = declaredTitle || stem.replace(/[-_]+/g, " ");
    examples.push({ value: id, label, file: `abc/${encodeURIComponent(name)}` });
  }
  return examples.sort((a, b) =>
    a.label.localeCompare(b.label, "en", { numeric: true, sensitivity: "base" }) ||
    a.value.localeCompare(b.value, "en"),
  );
}
