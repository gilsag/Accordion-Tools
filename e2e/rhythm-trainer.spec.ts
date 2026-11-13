import { test, expect, openApp, openTool, openToolsSheet, closeToolsSheet,
  isPhone, sectionTitles, recordAudioStarts } from "./fixtures";

/** Regression coverage for the Rhythm Trainer.
 * These browser tests complement the timing/ABC unit tests; they exercise the
 * shared progression selector, tool navigation, notation inspector and audio transport.
 */
test("Rhythm Trainer is above ABC Player and reuses the shared progression catalog", async ({ page }) => {
  await openApp(page);
  await openToolsSheet(page);
  const titles = await sectionTitles(page);
  const trainerIndex = titles.indexOf("Bass–Treble Rhythm Trainer");
  expect(trainerIndex, "trainer exists in the Tools menu").toBeGreaterThanOrEqual(0);
  expect(titles[trainerIndex + 1], "trainer directly precedes ABC Player").toBe("ABC Player");

  await openTool(page, "Bass–Treble Rhythm Trainer");
  const progression = page.locator(".rhythm-trainer-controls label")
    .filter({ hasText: "Chord progression" }).locator("select");
  await expect(progression.locator("option")).toHaveCount(30);
  await expect(progression).toHaveValue("i-iv-v-i");
  await expect(page.locator(".rhythm-trainer-controls select").first()).toHaveValue("3/4");
  const bassStyle = page.locator(".rhythm-trainer-controls label")
    .filter({ hasText: "Bass accompaniment" }).locator("select");
  await expect(bassStyle).toHaveValue("oom-pah-pah");
  const trebleRhythm = page.locator(".rhythm-trainer-controls label")
    .filter({ hasText: "Treble rhythm" }).locator("select");
  await expect(trebleRhythm).toHaveValue("T302");
  for (const [meter,first,second] of [["2/4","T201","T202"],["3/4","T301","T302"],
    ["4/4","T400","T401"],["6/8","T601","T602"]] as const) {
    await page.locator(".rhythm-trainer-controls select").first().selectOption(meter);
    await expect(trebleRhythm).toHaveValue(second);
    const values=await trebleRhythm.locator("option").evaluateAll(nodes=>nodes.slice(0,2).map(node=>(node as HTMLOptionElement).value));
    expect(values).toEqual([first,second]);
  }
  await page.locator(".rhythm-trainer-controls select").first().selectOption("3/4");
  await expect(page.locator(".rhythm-timeline-bar")).toHaveCount(4);
  if (!isPhone(page)) {
    const coords=await page.locator(".rhythm-timeline-bar").evaluateAll(nodes=>nodes.slice(0,4).map(node=>Math.round(node.getBoundingClientRect().top)));
    expect(new Set(coords).size,"all four initial bars fit on one desktop row").toBe(1);
  }
  const firstBar = page.locator(".rhythm-timeline-bar").first();
  await expect(firstBar.locator(".rhythm-lane").first().locator(".rhythm-event"),
    "default Waltz has three bass/chord attacks").toHaveCount(3);
  await expect(firstBar.locator(".rhythm-lane").nth(1).locator(".rhythm-event"),
    "default treble attacks with every waltz beat").toHaveCount(3);

  // The original Cueca remains available, but is no longer the default.
  await page.locator(".rhythm-trainer-controls select").first().selectOption("6/8");
  await bassStyle.selectOption("cueca-abc-bass");
  await trebleRhythm.selectOption("T602");
  await progression.selectOption("i-v-v-i");
  await expect(firstBar.locator(".rhythm-lane").first().locator(".rhythm-event"),
    "Cueca bass attacks on eighth slots 2, 3, 5, and 6").toHaveCount(4);

  await progression.selectOption("twelve-bar-blues");
  await expect(page.locator(".rhythm-timeline-bar")).toHaveCount(12);
});

test("Rhythm Trainer displays optional notation in the correct workspace region", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Bass–Treble Rhythm Trainer");
  // The Tools sidebar no longer duplicates the global Show notation action.
  await expect(page.locator(".rhythm-notation-toggle")).toHaveCount(0);
  await closeToolsSheet(page);
  if (isPhone(page)) {
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu button").filter({hasText:"Show notation"}).click();
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu button").filter({hasText:"Hide notation"}).click();
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu button").filter({hasText:"Show notation"}).click();
  } else {
    const show=page.locator(".topbar-secondary button[title='Show notation']");
    await expect(show).toBeVisible();
    await show.click();
    await expect(page.locator(".topbar-secondary button[title='Hide notation']")).toBeVisible();
    await page.locator(".topbar-secondary button[title='Hide notation']").click();
    await page.locator(".topbar-secondary button[title='Show notation']").click();
  }

  const notation = isPhone(page)
    ? page.locator(".rendered-notation-panel .rendered-abc svg")
    : page.locator(".workspace-inspector .rendered-abc svg");
  await expect(notation.first()).toBeVisible();
  if (!isPhone(page)) {
    const score = page.locator(".workspace-inspector .rendered-abc").first();
    const layout = await score.evaluate(el => ({
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
      svgWidth: el.querySelector("svg")?.getBoundingClientRect().width ?? 0,
    }));
    expect(layout.scrollWidth - layout.clientWidth,
      "four-bar right-panel notation must fit without horizontal scrolling").toBeLessThanOrEqual(1);
    expect(layout.svgWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  }
  await expect(page.locator("svg.abc-hands-diagram")).toHaveCount(1);
  if (!isPhone(page)) {
    const manualOrder=await page.locator("svg.abc-hands-diagram .abc-hand")
      .evaluateAll(groups=>groups.map(group=>group.getAttribute("data-hand")));
    expect(manualOrder,"Stradella above Treble in Rhythm Trainer").toEqual(["stradella","treble"]);
    await expect(page.locator(".rendered-notation-panel")).toHaveCount(0);
    const timeline = await page.locator(".rhythm-timeline").boundingBox();
    const diagram = await page.locator("svg.abc-hands-diagram").boundingBox();
    expect(timeline).toBeTruthy();
    expect(diagram).toBeTruthy();
    if (timeline && diagram) {
      expect(Math.abs(timeline.x + timeline.width/2 - diagram.x - diagram.width/2),
        "timeline and diagram are centered on the same axis").toBeLessThan(12);
    }
    // Settings must not move notation below the diagram: preserve the same inspector host.
    await page.locator(".topbar-secondary").getByRole("button",{name:"Settings",exact:true}).click();
    await expect(page.locator(".workspace-inspector .rendered-abc svg").first()).toBeVisible();
    await expect(page.locator(".rendered-notation-panel")).toHaveCount(0);
    await page.locator(".topbar-secondary").getByRole("button",{name:"Tools",exact:true}).click();
    // Focus mode hides the left controls but must NOT reparent or hide the score.
    await page.getByRole("button",{name:/Focus diagram/}).first().click();
    await expect(page.locator(".workspace-inspector .rendered-abc svg").first()).toBeVisible();
    await expect(page.locator(".rendered-notation-panel")).toHaveCount(0);
    await page.getByRole("button",{name:/Show controls/}).first().click();
    // The regular Waltz score should have one Stradella staff and no ghost rests.
    await expect(notation.first().locator(".abcjs-rest")).toHaveCount(0);
  }
});

test("Rhythm Trainer schedules audio for both hands and stops cleanly", async ({ page }) => {
  const audioStarts = await recordAudioStarts(page);
  await openApp(page);
  await openTool(page, "Bass–Treble Rhythm Trainer");
  await closeToolsSheet(page);
  const bar = page.locator(".playback-bar");
  const play = bar.locator(".playback-bar-play");
  await expect(play).toBeEnabled();
  const before = await audioStarts();
  await play.click();
  await expect.poll(audioStarts, { timeout: 15_000 }).toBeGreaterThan(before + 1);
  await expect.poll(async()=>page.locator(".rhythm-event[data-active='true']").count(),{timeout:10000}).toBeGreaterThan(0);
  await bar.getByRole("button", { name: "Stop" }).click();
  await expect(play).toBeEnabled();
  await expect(page.locator(".rhythm-event[data-active='true']")).toHaveCount(0);
  await page.waitForTimeout(200);
  const afterStop = await audioStarts();
  await page.waitForTimeout(800);
  expect(await audioStarts(), "no new events after Stop").toBe(afterStop);
});


test("Rhythm Trainer 2/4 Polka and Tango use valid patterns and notation", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Bass–Treble Rhythm Trainer");
  const meter=page.locator(".rhythm-trainer-controls select").first();
  await meter.selectOption("2/4");
  const bassStyle=page.locator(".rhythm-trainer-controls label").filter({hasText:"Bass accompaniment"}).locator("select");
  await expect(bassStyle).toHaveValue("polka");
  const bassOptions=await bassStyle.locator("option").allTextContents();
  expect(bassOptions.some(option=>option.includes("Tango"))).toBe(true);
  const treble=page.locator(".rhythm-trainer-controls label").filter({hasText:"Treble rhythm"}).locator("select");
  await treble.selectOption("T202");
  await expect(page.locator(".rhythm-timeline-bar").first().locator(".rhythm-lane").nth(1).locator(".rhythm-event")).toHaveCount(2);
  await bassStyle.selectOption("tango-habanera");
  await expect(page.locator(".rhythm-timeline-bar").first().locator(".rhythm-lane").first().locator(".rhythm-event")).toHaveCount(4);
  await closeToolsSheet(page);
  if (isPhone(page)) {
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu button").filter({hasText:"Show notation"}).click();
  } else {
    await page.locator(".topbar-secondary button[title='Show notation']").click();
  }
  const notation=isPhone(page)?page.locator(".rendered-notation-panel .rendered-abc svg"):page.locator(".workspace-inspector .rendered-abc svg");
  await expect(notation.first()).toBeVisible();
});


test("Rhythm Trainer exposes shared March and two-bar Son/Rumba clave accompaniments", async ({ page }) => {
  await openApp(page);
  await openTool(page, "Bass–Treble Rhythm Trainer");
  const meter=page.locator(".rhythm-trainer-controls select").first();
  const bassStyle=page.locator(".rhythm-trainer-controls label")
    .filter({hasText:"Bass accompaniment"}).locator("select");
  const progression=page.locator(".rhythm-trainer-controls label")
    .filter({hasText:"Chord progression"}).locator("select");
  await meter.selectOption("2/4");
  await bassStyle.selectOption("march-2-4");
  await expect(page.locator(".rhythm-timeline-bar").first().locator(".rhythm-lane").first()
    .locator(".rhythm-event"),"2/4 March has four eighth attacks").toHaveCount(4);
  await meter.selectOption("4/4");
  await bassStyle.selectOption("march-4-4");
  await expect(page.locator(".rhythm-timeline-bar").first().locator(".rhythm-lane").first()
    .locator(".rhythm-event"),"4/4 March has four quarter attacks").toHaveCount(4);
  for (const id of ["son-clave-3-2","son-clave-2-3","rumba-clave-3-2","rumba-clave-2-3"]) {
    await bassStyle.selectOption(id);
    await expect(page.locator(".rhythm-timeline-bar")).toHaveCount(4);
    const counts = await page.locator(".rhythm-timeline-bar").evaluateAll(nodes=>nodes.slice(0,2)
      .map(node=>node.querySelector(".rhythm-lane")?.querySelectorAll(".rhythm-event").length ?? 0));
    expect(counts.reduce((a,b)=>a+b,0),`${id} has exactly five attacks over two measures`).toBe(5);
  }
  await bassStyle.selectOption("son-clave-3-2");
  await progression.selectOption("twelve-bar-blues");
  await expect(page.locator(".rhythm-timeline-bar")).toHaveCount(12);
});

test("Rhythm Trainer arpeggios preserve rhythm and highlight playing notes in the score", async ({page})=>{
  await openApp(page);
  await openTool(page,"Bass–Treble Rhythm Trainer");
  const rhythm=page.locator(".rhythm-trainer-controls label")
    .filter({hasText:"Treble rhythm"}).locator("select");
  const pitches=page.locator(".rhythm-trainer-controls label")
    .filter({hasText:"Treble notes"}).locator("select");
  await expect(pitches).toHaveValue("root");
  await rhythm.selectOption("T302");
  await pitches.selectOption("triad-up");
  const firstTreble=page.locator(".rhythm-timeline-bar").first().locator(".rhythm-event-treble");
  await expect(firstTreble).toHaveCount(3);
  expect(await firstTreble.evaluateAll(nodes=>nodes.map(el=>el.getAttribute("title")?.split(" · ")[0])))
    .toEqual(["C","E","G"]);
  await closeToolsSheet(page);
  if (isPhone(page)) {
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu button").filter({hasText:"Show notation"}).click();
  } else {
    await page.locator(".topbar-secondary button[title='Show notation']").click();
  }
  const notation=isPhone(page)
    ? page.locator(".rendered-notation-panel .rendered-abc")
    : page.locator(".workspace-inspector .rendered-abc");
  await expect(notation.locator("svg .abcjs-note[data-rhythm-key]").first()).toBeVisible();
  const firstScoreNotes=notation.locator("svg .abcjs-note.abcjs-v0").first();
  await expect(firstScoreNotes).toHaveAttribute("data-rhythm-key",/^treble:0:0:1$/);
  const play=page.locator(".playback-bar .playback-bar-play");
  await play.click();
  await expect.poll(()=>notation.locator("svg .rhythm-score-active").count(),{timeout:10000}).toBeGreaterThan(0);
  await page.locator(".playback-bar").getByRole("button",{name:"Stop"}).click();
  await expect(notation.locator("svg .rhythm-score-active")).toHaveCount(0);
});


test("Rhythm Trainer resolves dominant sevenths and keeps synchronized default attacks", async ({page})=>{
  await openApp(page);
  await openTool(page,"Bass–Treble Rhythm Trainer");
  const notes=page.locator(".rhythm-trainer-controls label").filter({hasText:"Treble notes"}).locator("select");
  await expect(notes.locator("option")).toHaveCount(15);
  await notes.selectOption("seventh-up");
  const rhythm=page.locator(".rhythm-trainer-controls label").filter({hasText:"Treble rhythm"}).locator("select");
  await expect(rhythm).toHaveValue("T302");
  await rhythm.selectOption("T306");
  const progression=page.locator(".rhythm-trainer-controls label").filter({hasText:"Chord progression"}).locator("select");
  await progression.selectOption("twelve-bar-blues");
  await expect(page.locator(".rhythm-timeline-bar")).toHaveCount(12);
  await expect(page.locator(".rhythm-trainer-controls [role=alert]")).toHaveCount(0);
});


test("Generated notation displays full chord names and optional native labels below notes", async ({page}) => {
  await openApp(page);
  await openTool(page, "Bass–Treble Rhythm Trainer");
  await closeToolsSheet(page);
  if (isPhone(page)) {
    await page.locator(".phone-overflow-toggle").click();
    await page.locator(".phone-overflow-menu button").filter({hasText:"Show notation"}).click();
  } else {
    await page.locator(".topbar-secondary button[title='Show notation']").click();
  }
  const notation = isPhone(page)
    ? page.locator(".rendered-notation-panel .rendered-abc")
    : page.locator(".workspace-inspector .rendered-abc");
  await expect(notation.locator("svg .abcjs-note.abcjs-v1 text").filter({hasText:/^CM$/}).first()).toBeVisible();
  await expect(notation.locator("svg .abcjs-note.abcjs-v0 text").filter({hasText:/^CM$/})).toHaveCount(0);
  await expect(notation.locator(".notation-note-name")).toHaveCount(0);
  if (!isPhone(page)) {
    await page.locator(".topbar-secondary").getByRole("button",{name:"Settings",exact:true}).click();
    await page.getByRole("button",{name:"Music notation",exact:false}).click();
    await page.getByLabel("Show note names below notes").check();
    await expect(notation.locator("svg .abcjs-annotation").first()).toBeVisible();
    await expect(notation.locator("svg")).toContainText("C");
    await expect(notation.locator(".notation-note-name")).toHaveCount(0);
  }
});


test("Global notation position moves the score without duplicating rendering", async ({page}) => {
  test.skip(isPhone(page), "Phones always show notation below the diagram");
  await openApp(page);
  await openTool(page, "Bass–Treble Rhythm Trainer");
  await page.locator(".topbar-secondary button[title='Show notation']").click();
  await expect(page.locator(".workspace-inspector .shared-notation-score")).toBeVisible();
  await page.locator(".topbar-secondary").getByRole("button",{name:"Settings",exact:true}).click();
  await page.getByRole("button",{name:"Music notation",exact:false}).click();
  const position = page.getByRole("group", { name: "Notation position" });
  await position.getByRole("button", { name: "Below diagram" }).click();
  await expect(position.getByRole("button", { name: "Below diagram" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".rendered-notation-panel .shared-notation-score")).toBeVisible();
  await expect(page.locator(".workspace-inspector .shared-notation-score")).toHaveCount(0);
  await position.getByRole("button", { name: "Right panel" }).click();
  await expect(position.getByRole("button", { name: "Right panel" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".workspace-inspector .shared-notation-score")).toBeVisible();
  await expect(page.locator(".rendered-notation-panel .shared-notation-score")).toHaveCount(0);
});
