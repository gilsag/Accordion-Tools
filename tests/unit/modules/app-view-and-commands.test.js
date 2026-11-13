/** Layout-only App contracts, typed view boundaries and cross-tool
 * command ordering. Independent of React DOM and platform-native bundlers. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadIsolated } from "../../support/isolatedModule.js";
import { test } from "vitest";

const read = path => readFileSync(path, "utf8");
const { enterProgressionAssistant, enterStradellaFinder, enterHarmonyExplorer } = loadIsolated("src/app/crossToolCommands.ts");
function recorder(names) {
  const trace=[]; const ports={};
  for(const name of names) ports[name]=()=>trace.push(name);
  return {trace, ports};
}
const progression = ["navigate","clearPreview","disableStradellaFinder","disableScaleFinder","disableTrebleChordFinder","stopAbc","stopBassPattern"];

test("Layout/view contracts and 5 cross-tool command traces", () => {
  {
    const {trace,ports}=recorder(progression);
    enterProgressionAssistant(ports, "transfer");
    assert.deepEqual(trace,progression,"Transfer preserves navigation/reset/stop ordering");
  }
  {
    const {trace,ports}=recorder(progression);
    enterProgressionAssistant(ports, "preview");
    assert.deepEqual(trace, progression.filter(s=>s!=="clearPreview"&&s!=="stopBassPattern"),"Preview preserves current index and historical Bass Pattern behavior");
  }
  const finder = ["navigate","assignChord","resetRealization","enableFinder","disableScaleFinder","disableTrebleChordFinder","stopAbc"];
  {
    const {trace,ports}=recorder(finder);
    enterStradellaFinder(ports,"harmony-selection");
    assert.deepEqual(trace,finder,"Harmony selection resets realization before activation");
  }
  {
    const {trace,ports}=recorder(finder);
    enterStradellaFinder(ports,"progression-step");
    assert.deepEqual(trace,finder.filter(s=>s!=="resetRealization"),"Progression step preserves pending realization");
  }
  {
    const names=["navigate","stopAllSound","stopAbc","stopBassPattern"];
    const {trace,ports}=recorder(names);
    enterHarmonyExplorer(ports);
    assert.deepEqual(trace,names,"Harmony transfer preserves audio-stop order");
  }
});
