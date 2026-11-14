/** The design tokens: no colour literal outside the token files, every token a
 * rule uses is defined, and the drawing colours used from TypeScript equal
 * the diagram tokens of the same name. */
import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { DIAGRAM_COLORS } from "../../../src/diagram/diagramColors";

const STYLES = "src/styles";
const TOKEN_FILES = ["tokens.css", "diagram-tokens.css"];
const read = (file: string) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const stylesheets = [
  ...readdirSync(STYLES)
    .filter((file) => file.endsWith(".css"))
    .map((file) => `${STYLES}/${file}`),
  "src/app/settingsSections/DocumentationViewer.css",
];
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|(?<![\w-])(white|black)(?![\w-])/;

test("colours appear only in the token files", () => {
  const offending = stylesheets
    .filter((file) => !TOKEN_FILES.some((token) => file.endsWith(`/${token}`)))
    .flatMap((file) =>
      read(file)
        .split("\n")
        .filter((line) => COLOR.test(line))
        .map((line) => `${file}: ${line.trim()}`),
    );
  expect(offending).toEqual([]);
});

test("every token a rule uses is defined", () => {
  const defined = new Set(
    stylesheets.flatMap((file) => [...read(file).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])),
  );
  // Set from TypeScript at run time: the density sizes are in CSS, these are not.
  const runtime = ["--mobile-diagram-readable-width"];
  const used = stylesheets.flatMap((file) =>
    [...read(file).matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]),
  );
  expect(
    [...new Set(used)].filter((name) => !defined.has(name) && !runtime.includes(name)),
  ).toEqual([]);
});

test("drawing colours used from TypeScript equal the diagram tokens", () => {
  const css = read(`${STYLES}/diagram-tokens.css`);
  for (const [name, value] of Object.entries(DIAGRAM_COLORS))
    expect(css, name).toContain(`--diagram-${name}: ${value};`);
});
