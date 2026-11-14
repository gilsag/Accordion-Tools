/** Shareable links: the instrument and the open Finder's choice, written as a
 * query string such as `?side=stradella&basses=72&tool=stradella-chords&root=E&chord=minor7`.
 *
 * Settings keys (instrument, the treble Chord Finder, the Scale Finder, the
 * Stradella Chord Finder's search mode and gap filter) go into a settings
 * document, which the settings controller validates like an imported file.
 * The Stradella Chord Finder's chord, bass, button limits and realization are
 * tool state, not settings, so they are validated here. Unknown or invalid
 * values are dropped; a link never fails to open. */
import type { DefaultSettingsFile } from "../../settings/settingsSchema";
import type { FinderChordPattern, Side } from "../../types";
import { CHORD_FINDER_OPTIONS } from "../../music/chordDefinitions";
import { FINDER_ROOT_OPTIONS } from "../../features/scaleFinder/scaleFinderTools";
import {
  ROOT_POSITION_BASS,
  permittedRequestedBasses,
} from "../../features/stradellaChordFinder/engine/harmonicIdentity";

/** The Finders a link can open, with their names in the URL. */
export const SHARED_TOOLS = {
  stradellaChordFinder: "stradella-chords",
  chordFinder: "treble-chords",
  scaleFinder: "scales",
} as const;
export type SharedTool = keyof typeof SHARED_TOOLS;

/** URL parameter → settings key, for every link. */
const INSTRUMENT_PARAMS = [
  ["side", "side"],
  ["basses", "basses"],
  ["layout", "trebleLayout"],
  ["rows", "trebleRows"],
  ["size", "trebleSize"],
  ["range", "pianoTrebleRange"],
] as const;

/** URL parameter → settings key, for the Finder the link opens. */
const TOOL_SETTING_PARAMS = {
  stradellaChordFinder: [
    ["mode", "stradellaChordFinderMode"],
    ["gap", "stradellaMinimumNominalGap"],
  ],
  chordFinder: [
    ["root", "chordFinderRoot"],
    ["chord", "chordFinderPattern"],
    ["inversion", "chordFinderInversion"],
    ["octave", "chordFinderOctave"],
  ],
  scaleFinder: [
    ["root", "scaleFinderRoot"],
    ["scale", "scaleFinderPattern"],
    ["limit", "scaleFinderRowLimit"],
  ],
} as const;

/** Settings stored as numbers; every other value is a string. */
const NUMERIC_SETTINGS = new Set<string>([
  "trebleRows",
  "scaleFinderRowLimit",
  "stradellaMinimumNominalGap",
  "chordFinderOctave",
]);
const MAX_BUTTONS = [1, 2, 3, 4];
const SPAN_COLUMNS = [3.2, 4.3, 5.5];

/** The Stradella Chord Finder's part of a link. `bass` is a requested-bass
 * choice: null for any bass, `ROOT_POSITION_BASS`, or a chord tone. */
export type SharedStradellaChord = {
  root: string;
  pattern: FinderChordPattern;
  bass: string | null;
  /** 1-based, as players count. */
  realization: number;
  maxButtons?: number;
  spanColumns?: number;
};

export type SharedView = {
  settings: DefaultSettingsFile;
  tool: SharedTool | null;
  stradella: SharedStradellaChord | null;
};

const isRoot = (value: string | null): value is string =>
  FINDER_ROOT_OPTIONS.some((option) => option.value === value);
const isChord = (value: string | null): value is FinderChordPattern =>
  CHORD_FINDER_OPTIONS.some((option) => option.value === value);
const numberIn = (value: string | null, allowed: number[]) => {
  const parsed = Number(value);
  return value !== null && allowed.includes(parsed) ? parsed : undefined;
};

/** Reads a link's query string; null when it carries no shared view. */
export function decodeShareLink(search: string): SharedView | null {
  const params = new URLSearchParams(search);
  const toolName = params.get("tool");
  const tool =
    (Object.entries(SHARED_TOOLS).find(([, name]) => name === toolName)?.[0] as
      SharedTool | undefined) ?? null;
  if (!params.has("side") && tool === null) return null;

  const settings: Record<string, unknown> = {};
  const copy = (pairs: readonly (readonly [string, string])[]) => {
    for (const [param, key] of pairs) {
      const value = params.get(param);
      if (value === null || value === "") continue;
      settings[key] = NUMERIC_SETTINGS.has(key) ? Number(value) : value;
    }
  };
  copy(INSTRUMENT_PARAMS);
  if (tool) copy(TOOL_SETTING_PARAMS[tool]);
  // Each chord Finder exists on one side only.
  if (tool === "stradellaChordFinder") settings.side = "stradella";
  if (tool === "chordFinder") settings.side = "treble";

  let stradella: SharedStradellaChord | null = null;
  if (tool === "stradellaChordFinder") {
    const root = params.get("root");
    const chord = params.get("chord");
    if (isRoot(root) && isChord(chord)) {
      const bass = params.get("bass");
      const realization = Math.floor(Number(params.get("n")));
      stradella = {
        root,
        pattern: chord,
        bass:
          bass === "any"
            ? null
            : bass !== null && permittedRequestedBasses(root, chord).includes(bass)
              ? bass
              : ROOT_POSITION_BASS,
        realization: Number.isFinite(realization) && realization >= 1 ? realization : 1,
        maxButtons: numberIn(params.get("max"), MAX_BUTTONS),
        spanColumns: numberIn(params.get("span"), SPAN_COLUMNS),
      };
    }
  }
  return { settings: settings as DefaultSettingsFile, tool, stradella };
}

/** What a link is built from: the instrument, and the open Finder if any. */
export type ShareableState = {
  side: Side;
  basses: string;
  trebleLayout: string;
  trebleRows: number;
  trebleSize: string;
  pianoTrebleRange: string;
  tool: SharedTool | null;
  stradella?: SharedStradellaChord & { mode: string; minimumNominalGap: number };
  treble?: { root: string; pattern: string; inversion: string; octave: number };
  scale?: { root: string; pattern: string; rowLimit: number };
};

/** Writes the query string for a view, leaving out what does not apply. */
export function encodeShareLink(state: ShareableState): string {
  const params = new URLSearchParams({ side: state.side });
  if (state.side === "stradella") params.set("basses", state.basses);
  else {
    params.set("layout", state.trebleLayout);
    if (state.trebleLayout === "piano") params.set("range", state.pianoTrebleRange);
    else {
      params.set("rows", String(state.trebleRows));
      params.set("size", state.trebleSize);
    }
  }
  if (state.tool === "stradellaChordFinder" && state.stradella) {
    const chord = state.stradella;
    params.set("tool", SHARED_TOOLS.stradellaChordFinder);
    params.set("root", chord.root);
    params.set("chord", chord.pattern);
    params.set("bass", chord.bass === null ? "any" : chord.bass);
    params.set("mode", chord.mode);
    if (chord.maxButtons !== undefined) params.set("max", String(chord.maxButtons));
    if (chord.spanColumns !== undefined) params.set("span", String(chord.spanColumns));
    params.set("gap", String(chord.minimumNominalGap));
    if (chord.realization > 1) params.set("n", String(chord.realization));
  } else if (state.tool === "chordFinder" && state.treble) {
    params.set("tool", SHARED_TOOLS.chordFinder);
    params.set("root", state.treble.root);
    params.set("chord", state.treble.pattern);
    params.set("inversion", state.treble.inversion);
    params.set("octave", String(state.treble.octave));
  } else if (state.tool === "scaleFinder" && state.scale) {
    params.set("tool", SHARED_TOOLS.scaleFinder);
    params.set("root", state.scale.root);
    params.set("scale", state.scale.pattern);
    params.set("limit", String(state.scale.rowLimit));
  }
  return `?${params}`;
}
