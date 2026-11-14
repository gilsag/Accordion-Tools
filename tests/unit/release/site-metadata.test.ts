/** A shared link shows a title, a description and an image: index.html
 * carries the description, theme colours and Open Graph tags, and the image
 * it names is in public/ at the size the tags declare. */
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const html = readFileSync("index.html", "utf8");
const meta = (attribute: "name" | "property", key: string) =>
  [...html.matchAll(/<meta\s+([^>]*?)\/?>/g)]
    .map((match) => match[1].replace(/\s+/g, " "))
    .filter((attributes) => attributes.includes(`${attribute}="${key}"`))
    .map((attributes) => /content="([^"]*)"/.exec(attributes)?.[1] ?? "");
const SITE = "https://gilsag.github.io/Accordion-Tools/";

test("the page has a description and a theme colour for each scheme", () => {
  expect(meta("name", "description")[0].length).toBeGreaterThan(50);
  expect(meta("name", "theme-color")).toEqual(["#f6f7fb", "#10141c"]);
});

test("Open Graph tags give a title, a description and an absolute image URL", () => {
  expect(meta("property", "og:title")).toEqual(["Accordion Tools"]);
  expect(meta("property", "og:description")[0].length).toBeGreaterThan(50);
  expect(meta("property", "og:url")).toEqual([SITE]);
  expect(meta("property", "og:image")).toEqual([`${SITE}social-preview.png`]);
  expect(meta("property", "og:image:alt")[0]).not.toBe("");
  expect(meta("name", "twitter:card")).toEqual(["summary_large_image"]);
});

test("the site URL matches the build's base path", () => {
  const base = /base:\s*"([^"]+)"/.exec(readFileSync("vite.config.ts", "utf8"))?.[1];
  expect(new URL(SITE).pathname).toBe(base);
});

test("the preview image exists at the declared 1200 × 630", () => {
  const png = readFileSync("public/social-preview.png");
  expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
  const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  expect([width, height]).toEqual([
    Number(meta("property", "og:image:width")[0]),
    Number(meta("property", "og:image:height")[0]),
  ]);
  expect([width, height]).toEqual([1200, 630]);
});
