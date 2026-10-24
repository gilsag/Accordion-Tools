/** Dependency-free source regression checks for responsive viewer invariants. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/App.css", import.meta.url), "utf8");
const help = readFileSync(new URL("../src/components/ui/HelpTip.tsx", import.meta.url), "utf8");
const docs = readFileSync(new URL("../src/components/settings/DocumentationViewer.css", import.meta.url), "utf8");
assert.match(app, /mobileDiagramView.*useState/);
assert.match(app, /className=\{`canvas-wrap .*diagram-readable.*diagram-fit/);
assert.match(app, /--mobile-diagram-readable-width/);
assert.match(app, /viewBox=\{`0 0 \$\{viewWidth\} \$\{viewHeight\}`\}/);
assert.match(css, /\.canvas-wrap\.diagram-readable > \.diagram/);
assert.match(css, /\.canvas-wrap\.diagram-fit > \.diagram/);
assert.match(css, /\.topbar \{[\s\S]*?flex-wrap: wrap/);
assert.doesNotMatch(css, /height: calc\(100dvh - 49px\)/);
assert.match(help, /role="button"/);
assert.match(help, /onKeyDown=/);
assert.match(docs, /@media \(max-width: 620px\)/);
assert.match(docs, /grid-template-columns: minmax\(0, 1fr\)/);
console.log("Responsive viewer source invariants passed.");
