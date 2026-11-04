/** Source contracts for the responsive presentation-only redesign.
 * Actual touch/keyboard browser acceptance remains a separate release gate. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const app = read("src/App.tsx");
const phone = read("src/app/usePhonePanel.ts");
const workspace = read("src/app/views/WorkspaceView.tsx");
const toolbar = read("src/app/components/WorkspaceToolbar.tsx");
const css = read("src/App.css");
const controller = read("src/app/useAppController.ts");
const inspectorSlot = read("src/app/inspector/WorkspaceInspectorSlot.tsx");
const inspectorFrame = read("src/app/inspector/WorkspaceInspectorFrame.tsx");

assert.match(phone, /max-width: 620px/);
assert.match(phone, /matchMedia\(PHONE_QUERY\)/);
assert.match(phone, /addEventListener\("change", update\)/);
assert.match(phone, /setOpen\(false\).*\[activeTool, workspaceMode\]/s);
assert.match(phone, /event\.key === "Escape"/);
assert.match(phone, /event\.key !== "Tab"/);
assert.match(phone, /first\.focus\(\)/);
assert.match(phone, /last\.focus\(\)/);
assert.match(phone, /openerRef\.current\?\.focus\(\)/);
assert.match(app, /phone-sheet-backdrop/);
assert.match(app, /role=\{isPhone \? "dialog"/);
assert.match(app, /aria-modal=\{isPhone && sheetOpen/);
assert.match(app, /inert=\{isPhone && !sheetOpen\}/);
assert.match(app, /ref=\{panelRef\}/);
assert.match(app, /ref=\{closeRef\}/);
assert.match(app, /leftPanelMode !== mode/); // Avoid historical toggle-to-hidden when already selected.
assert.match(app, /resolveWorkspaceInspector/); // Shared inspector stays in place.
assert.match(app, /blocked=\{isPhone && sheetOpen\}/);
assert.match(inspectorSlot, /blocked=\{blocked\}/);
assert.match(inspectorFrame, /inert=\{blocked\}/);
assert.match(workspace, /phoneSheetOpen/);
assert.match(workspace, /onOpenPhonePanel\?\.\("tools"\)/);
assert.match(workspace, /onOpenPhonePanel\?\.\("settings"\)/);
assert.match(workspace, /className="diagram-mobile-frame"/);
assert.match(workspace, /className="mobile-diagram-toggle"/);
assert.match(workspace, /aria-pressed=\{mobileDiagramView === "fit"\}/);
assert.match(workspace, /setMobileDiagramView\(current => current === "readable"/);
assert.match(toolbar, /topbar-primary/);
assert.match(toolbar, /phone-tools-button/);
assert.match(toolbar, /phone-overflow-menu/);
assert.match(toolbar, /onToggleSound/);
assert.match(toolbar, /onDownloadDiagram/);
assert.match(toolbar, /onClearWork/);
assert.match(toolbar, /onRestoreToolDefaults/);
assert.match(toolbar, /onToggleFocus/);
assert.match(toolbar, /notationAction\.toggle\(\)/);
assert.match(css, /\.topbar-secondary \{ display: contents; \}/);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /\.app > \.left-panel\.phone-sheet-open \{ display: block; \}/);
assert.match(css, /env\(safe-area-inset-bottom\)/);
assert.match(css, /\.topbar \{ flex-wrap: nowrap;/);
assert.match(css, /\.mobile-diagram-view-control \{[\s\S]*?position: absolute/);
assert.match(css, /\.diagram-mobile-frame > \.canvas-wrap \{ width: 100%; \}/);
assert.doesNotMatch(controller, /phoneSheetOpen|phoneOverflowOpen/); // Transient UI only, no settings/schema additions.
for (const locale of ["en", "es", "fr", "pt", "it", "de"]) {
  assert.match(read(`src/i18n/${locale}.ts`), /["']ui\.moreActions["']/);
}
console.log("Phone sheet, toolbar overflow, diagram toggle, focus and six-locale source contracts passed.");
