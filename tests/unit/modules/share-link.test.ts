/** Shareable links: what a link carries, and that bad values are dropped
 * rather than breaking the page. The browser tests open real links. */
import { expect, test } from "vitest";
import { decodeShareLink, encodeShareLink } from "../../../src/app/shareLink/shareLink";

const stradellaState = {
  side: "stradella" as const,
  basses: "72",
  trebleLayout: "c-system",
  trebleRows: 5,
  trebleSize: "small",
  pianoTrebleRange: "three-octave",
  tool: "stradellaChordFinder" as const,
  stradella: {
    root: "E",
    pattern: "minor7" as const,
    bass: "root",
    realization: 2,
    maxButtons: 3,
    spanColumns: 4.3,
    mode: "bass-and-chords",
    minimumNominalGap: 0,
  },
};

test("a Stradella Chord Finder link round-trips", () => {
  const query = encodeShareLink(stradellaState);
  expect(query).toBe(
    "?side=stradella&basses=72&tool=stradella-chords&root=E&chord=minor7&bass=root&mode=bass-and-chords&max=3&span=4.3&gap=0&n=2",
  );
  expect(decodeShareLink(query)).toEqual({
    settings: {
      side: "stradella",
      basses: "72",
      stradellaChordFinderMode: "bass-and-chords",
      stradellaMinimumNominalGap: 0,
    },
    tool: "stradellaChordFinder",
    stradella: {
      root: "E",
      pattern: "minor7",
      bass: "root",
      realization: 2,
      maxButtons: 3,
      spanColumns: 4.3,
    },
  });
});

test("the first realization and any bass are written plainly", () => {
  const query = encodeShareLink({
    ...stradellaState,
    stradella: { ...stradellaState.stradella, bass: null, realization: 1 },
  });
  expect(query).toContain("bass=any");
  expect(query).not.toMatch(/[?&]n=/);
  expect(decodeShareLink(query)?.stradella?.bass).toBeNull();
});

test("a treble link carries the layout and the treble Chord Finder's chord", () => {
  const query = encodeShareLink({
    ...stradellaState,
    side: "treble",
    trebleLayout: "b-system",
    tool: "chordFinder",
    treble: { root: "D", pattern: "minor-triad", inversion: "first", octave: 4 },
  });
  expect(query).toBe(
    "?side=treble&layout=b-system&rows=5&size=small&tool=treble-chords&root=D&chord=minor-triad&inversion=first&octave=4",
  );
  expect(decodeShareLink(query)?.settings).toEqual({
    side: "treble",
    trebleLayout: "b-system",
    trebleRows: 5,
    trebleSize: "small",
    chordFinderRoot: "D",
    chordFinderPattern: "minor-triad",
    chordFinderInversion: "first",
    chordFinderOctave: 4,
  });
});

test("a piano link carries the range instead of rows and size", () => {
  const query = encodeShareLink({
    ...stradellaState,
    side: "treble",
    trebleLayout: "piano",
    tool: null,
  });
  expect(query).toBe("?side=treble&layout=piano&range=three-octave");
});

test("a Scale Finder link", () => {
  const query = encodeShareLink({
    ...stradellaState,
    tool: "scaleFinder",
    scale: { root: "G", pattern: "natural-minor-scale", rowLimit: 4 },
  });
  expect(decodeShareLink(query)).toMatchObject({
    tool: "scaleFinder",
    settings: {
      scaleFinderRoot: "G",
      scaleFinderPattern: "natural-minor-scale",
      scaleFinderRowLimit: 4,
    },
    stradella: null,
  });
});

test("a chord Finder link puts the instrument on its side", () => {
  expect(decodeShareLink("?tool=treble-chords&root=C&chord=major-triad")?.settings.side).toBe(
    "treble",
  );
  expect(decodeShareLink("?side=treble&tool=stradella-chords")?.settings.side).toBe("stradella");
});

test("a page address without a shared view is ignored", () => {
  expect(decodeShareLink("")).toBeNull();
  expect(decodeShareLink("?utm_source=newsletter")).toBeNull();
});

test("invalid Stradella values fall back instead of failing", () => {
  expect(decodeShareLink("?tool=stradella-chords&root=H&chord=minor7")?.stradella).toBeNull();
  const view = decodeShareLink(
    "?tool=stradella-chords&root=C&chord=major-triad&bass=F&n=-3&max=9&span=2",
  );
  expect(view?.stradella).toEqual({
    root: "C",
    pattern: "major-triad",
    bass: "root",
    realization: 1,
    maxButtons: undefined,
    spanColumns: undefined,
  });
});
