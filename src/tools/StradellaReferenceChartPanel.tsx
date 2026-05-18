/**
 * StradellaReferenceChartPanel.tsx
 *
 * "Functional Reference" — a tone-independent Stradella chart with two views:
 *   1. Layout view  — interval / Roman-numeral labels for every button
 *   2. Progression view — highlights the buttons used by a chosen chord progression
 *
 * STYLING
 * -------
 * This component uses only classes already present in App.css:
 *   label, select, .hint, .small-button, .active-tool, .button-row
 * The chart buttons are plain <div> elements styled inline, using the same
 * fill/stroke values as the SVG diagram buttons so they feel native.
 * No separate CSS file is needed.
 *
 * INTEGRATION STEPS
 * -----------------
 * 1. Copy this file to:
 *      src/components/tools/StradellaReferenceChartPanel.tsx
 *
 * 2. In App.tsx, add "functionalReference" to the ToolSection union (around line 419):
 *      | "functionalReference"
 *
 * 3. Import the component near the other tool-panel imports:
 *      import { StradellaReferenceChartPanel } from "./components/tools/StradellaReferenceChartPanel";
 *
 * 4. At the END of the tools panel block in App.tsx (just before the closing </>
 *    of the leftPanelMode === "tools" section, around line 5060), add:
 *
 *      {side === "stradella" && (
 *        <CollapsibleSection
 *          title="Functional Reference"
 *          isOpen={activeToolSection === "functionalReference"}
 *          onToggle={() => toggleToolSection("functionalReference")}
 *        >
 *          <StradellaReferenceChartPanel basses={basses} />
 *        </CollapsibleSection>
 *      )}
 */

import { useState, useMemo, useEffect } from "react";
import type { BassCount } from "../../types";

// ── Music helpers ──────────────────────────────────────────────────────────────

const COF_FULL = [
  "Bbb","Fb","Cb","Gb","Db","Ab","Eb","Bb",
  "F","C","G","D","A","E","B",
  "F#","C#","G#","D#","A#",
];

const STRADELLA_NORMALIZED: Record<string, string> = {
  Bbb:"A", Fb:"E", Cb:"B", Gb:"F#", Db:"C#", Ab:"G#",
  Eb:"D#", Bb:"A#", F:"F", C:"C", G:"G", D:"D",
  A:"A", E:"E", B:"B",
  "F#":"F#", "C#":"C#", "G#":"G#", "D#":"D#", "A#":"A#",
};

const PITCH_IDX: Record<string, number> = {
  C:0, "C#":1, D:2, "D#":3, E:4, F:5,
  "F#":6, G:7, "G#":8, A:9, "A#":10, B:11,
};
const IDX_TO_PITCH = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function transpose(pitch: string, semitones: number): string {
  return IDX_TO_PITCH[(PITCH_IDX[pitch] + semitones + 120) % 12];
}

function semiAboveC(pitch: string): number {
  return (PITCH_IDX[pitch] - PITCH_IDX["C"] + 12) % 12;
}

// ── Interval label tables ──────────────────────────────────────────────────────

const INTERVAL_SHORT: Record<number, string> = {
  0:"1",  1:"b2", 2:"2",  3:"b3", 4:"3",
  5:"4",  6:"b5", 7:"5",  8:"b6", 9:"6",
  10:"b7", 11:"7",
};

const INTERVAL_QUALITY: Record<number, string> = {
  0:"P1", 1:"m2", 2:"M2", 3:"m3", 4:"M3",
  5:"P4", 6:"d5", 7:"P5", 8:"m6", 9:"M6",
  10:"m7", 11:"M7",
};

// ── Preset definitions ─────────────────────────────────────────────────────────

type RowKind =
  | "bass-counterbass"
  | "bass-root"
  | "chord-major"
  | "chord-minor"
  | "chord-dom7"
  | "chord-dim7";

interface Preset {
  start: number;
  count: number;
  rows: RowKind[];
}

const PRESETS: Record<BassCount, Preset> = {
  "8":       { start:8,  count:4,  rows:["bass-root","chord-major"] },
  "12":      { start:7,  count:6,  rows:["bass-root","chord-major"] },
  "24":      { start:6,  count:8,  rows:["bass-root","chord-major","chord-minor"] },
  "32":      { start:6,  count:8,  rows:["bass-root","chord-major","chord-minor","chord-dom7"] },
  "40":      { start:6,  count:8,  rows:["bass-counterbass","bass-root","chord-major","chord-minor","chord-dom7"] },
  "48-8x6":  { start:6,  count:8,  rows:["bass-counterbass","bass-root","chord-major","chord-minor","chord-dom7","chord-dim7"] },
  "48-12x4": { start:4,  count:12, rows:["bass-counterbass","bass-root","chord-major","chord-minor"] },
  "60":      { start:4,  count:12, rows:["bass-counterbass","bass-root","chord-major","chord-minor","chord-dom7"] },
  "72":      { start:4,  count:12, rows:["bass-counterbass","bass-root","chord-major","chord-minor","chord-dom7","chord-dim7"] },
  "80":      { start:2,  count:16, rows:["bass-counterbass","bass-root","chord-major","chord-minor","chord-dom7"] },
  "96":      { start:2,  count:16, rows:["bass-counterbass","bass-root","chord-major","chord-minor","chord-dom7","chord-dim7"] },
  "100":     { start:0,  count:20, rows:["bass-counterbass","bass-root","chord-major","chord-minor","chord-dom7"] },
  "120":     { start:0,  count:20, rows:["bass-counterbass","bass-root","chord-major","chord-minor","chord-dom7","chord-dim7"] },
};

// ── Button appearance ─────────────────────────────────────────────────────────
//
// Mirrors the SVG diagram's own fill/stroke values from App.css so the small
// chart buttons feel like miniature versions of the real buttons.

interface ButtonStyle {
  background: string;
  border: string;
  color: string;
}

const BUTTON_STYLES: Record<RowKind, ButtonStyle> = {
  // Bass (note) buttons: white fill, blue stroke — same as .button in App.css
  "bass-root":        { background: "#ffffff", border: "2px solid #1746d0", color: "#172033" },
  "bass-counterbass": { background: "#ffffff", border: "2px solid #1746d0", color: "#172033" },
  // Chord buttons: light blue fill — same as .button.chord in App.css
  "chord-major":      { background: "#e6eef8", border: "2px solid #d7e2f0", color: "#172033" },
  "chord-minor":      { background: "#e6eef8", border: "2px solid #d7e2f0", color: "#172033" },
  "chord-dom7":       { background: "#e6eef8", border: "2px solid #d7e2f0", color: "#172033" },
  "chord-dim7":       { background: "#e6eef8", border: "2px solid #d7e2f0", color: "#172033" },
};

// Highlighted state mirrors .button.finder-match from App.css
const HL_STYLE: ButtonStyle = {
  background: "#fff0a8",
  border: "2px solid #2f8f46",
  color: "#172033",
};

// ── Roman numeral / chord-label helpers ───────────────────────────────────────

const MAJOR_ROMANS = ["I","bII","II","bIII","III","IV","bV","V","bVI","VI","bVII","VII"];
const MINOR_ROMANS = ["i","bii","ii","biii","iii","iv","bv","v","bvi","vi","bvii","vii"];

function romanForChordRow(kind: RowKind, rootPitch: string): string {
  const d = semiAboveC(rootPitch);
  if (kind === "chord-major") return MAJOR_ROMANS[d] ?? "I";
  if (kind === "chord-minor") return MINOR_ROMANS[d] ?? "i";
  if (kind === "chord-dom7")  return (MAJOR_ROMANS[d] ?? "I") + "7";
  if (kind === "chord-dim7")  return (MINOR_ROMANS[d] ?? "i") + "°7";
  return "";
}

function functionLabel(kind: RowKind, rootPitch: string): string {
  const d = semiAboveC(rootPitch);
  const group =
    d === 0                   ? "T"  :
    [5, 9].includes(d)        ? "SD" :
    [7,2,4,11,10].includes(d) ? "D"  : "chr";
  const suffix =
    kind === "chord-minor" ? "m" :
    kind === "chord-dom7"  ? "7" :
    kind === "chord-dim7"  ? "°" : "";
  return group + suffix;
}

function intervalContent(kind: RowKind): string {
  if (kind === "chord-major") return "1-3-5";
  if (kind === "chord-minor") return "1-b3-5";
  if (kind === "chord-dom7")  return "1-3-b7";
  if (kind === "chord-dim7")  return "1-b3-b7";
  return "";
}

// ── Row metadata ───────────────────────────────────────────────────────────────

const ROW_LABELS: Record<RowKind, string> = {
  "bass-counterbass": "Counterbass",
  "bass-root":        "Root bass",
  "chord-major":      "Major",
  "chord-minor":      "Minor",
  "chord-dom7":       "Dom. 7th",
  "chord-dim7":       "Dim. 7th",
};

// ── Chord progression parser ───────────────────────────────────────────────────

const ROMAN_ROOT_SEMIS: Record<string, number> = {
  I:0, II:2, III:4, IV:5, V:7, VI:9, VII:11,
};

type ChordQuality = "major" | "minor" | "dom7" | "dim7";

interface ParsedChord {
  semis: number;
  quality: ChordQuality;
  token: string;
}

function parseChordToken(token: string): ParsedChord | null {
  const base = token.split("/")[0];
  let rest = base;
  let acc = 0;
  if (rest.startsWith("#")) { acc =  1; rest = rest.slice(1); }
  if (rest.startsWith("b")) { acc = -1; rest = rest.slice(1); }

  let quality: ChordQuality = "major";
  let rootStr = rest;

  if (rest.endsWith("dim")) {
    quality = "dim7"; rootStr = rest.slice(0, -3);
  } else if (rest.endsWith("ø")) {
    quality = "dim7"; rootStr = rest.slice(0, -1);
  } else if (rest.endsWith("maj7")) {
    quality = "major"; rootStr = rest.slice(0, -4);
  } else if (rest.endsWith("7")) {
    const r = rest.slice(0, -1);
    quality = r === r.toUpperCase() ? "dom7" : "minor";
    rootStr = r;
  }

  if (quality === "major" && rootStr === rootStr.toLowerCase() && rootStr.length > 0) {
    quality = "minor";
  }

  const baseSemis = ROMAN_ROOT_SEMIS[rootStr.toUpperCase()];
  if (baseSemis === undefined) return null;

  return { semis: (baseSemis + acc + 12) % 12, quality, token };
}

function qualityToRowKind(q: ChordQuality): RowKind {
  if (q === "minor") return "chord-minor";
  if (q === "dom7")  return "chord-dom7";
  if (q === "dim7")  return "chord-dim7";
  return "chord-major";
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProgressionEntry {
  id: string;
  name: string;
  progression: string;
  description: string;
}

type BassLabelMode  = "interval" | "quality" | "semitones";
type ChordLabelMode = "roman" | "function" | "interval";
type ViewMode       = "layout" | "progression";

// ── Inline styles (shared constants) ─────────────────────────────────────────

const BTN_BASE: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 10,
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
  flexShrink: 0,
  transition: "opacity 0.15s",
  padding: 0,
  lineHeight: 1.1,
  textAlign: "center" as const,
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  basses: BassCount;
}

export function StradellaReferenceChartPanel({ basses }: Props) {
  const [view,        setView]        = useState<ViewMode>("layout");
  const [bassMode,    setBassMode]    = useState<BassLabelMode>("interval");
  const [chordMode,   setChordMode]   = useState<ChordLabelMode>("roman");
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  const [progressions,   setProgressions]   = useState<ProgressionEntry[]>([]);
  const [selectedProgId, setSelectedProgId] = useState<string>("");
  const [progStep,       setProgStep]       = useState<number | null>(null);

  const preset = PRESETS[basses];
  const cols = useMemo(
    () => COF_FULL.slice(preset.start, preset.start + preset.count),
    [preset],
  );
  const tonicColIndex = useMemo(
    () => cols.findIndex(c => STRADELLA_NORMALIZED[c] === "C"),
    [cols],
  );

  useEffect(() => {
    fetch("/chord-progressions/chord-progressions.json")
      .then(r => r.json())
      .then((data: ProgressionEntry[]) => {
        setProgressions(data);
        if (data.length > 0) setSelectedProgId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const parsedSteps = useMemo<ParsedChord[]>(() => {
    const prog = progressions.find(p => p.id === selectedProgId);
    if (!prog) return [];
    return prog.progression
      .split(/\s+/)
      .map(parseChordToken)
      .filter((c): c is ParsedChord => c !== null);
  }, [progressions, selectedProgId]);

  const progressionHighlightIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    const stepsToShow = progStep !== null ? [parsedSteps[progStep]] : parsedSteps;
    stepsToShow.forEach(chord => {
      if (!chord) return;
      const rowKind = qualityToRowKind(chord.quality);
      cols.forEach((colName, ci) => {
        const rootPitch = STRADELLA_NORMALIZED[colName];
        if (semiAboveC(rootPitch) === chord.semis) {
          if (preset.rows.includes(rowKind))     ids.add(`${rowKind}-${ci}`);
          if (preset.rows.includes("bass-root")) ids.add(`bass-root-${ci}`);
        }
      });
    });
    return ids;
  }, [parsedSteps, progStep, cols, preset.rows]);

  function toggleHighlight(id: string) {
    setHighlighted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function mainLabel(kind: RowKind, colIndex: number): string {
    if (kind.startsWith("bass-")) {
      const rootPitch = STRADELLA_NORMALIZED[cols[colIndex]];
      const pitch = kind === "bass-counterbass" ? transpose(rootPitch, 4) : rootPitch;
      const semis = semiAboveC(pitch);
      if (bassMode === "quality")   return INTERVAL_QUALITY[semis] ?? String(semis);
      if (bassMode === "semitones") return String(semis);
      return INTERVAL_SHORT[semis] ?? String(semis);
    }
    const rootPitch = STRADELLA_NORMALIZED[cols[colIndex]];
    if (chordMode === "roman")    return romanForChordRow(kind, rootPitch);
    if (chordMode === "function") return functionLabel(kind, rootPitch);
    return intervalContent(kind);
  }

  function colOffsetLabel(ci: number): string {
    if (tonicColIndex < 0) return "";
    const off = ci - tonicColIndex;
    return off === 0 ? "0" : off > 0 ? `+${off}` : String(off);
  }

  function buttonStyle(kind: RowKind, id: string): React.CSSProperties {
    const isManualHl = view === "layout"      && highlighted.has(id);
    const isProgHl   = view === "progression" && progressionHighlightIds.has(id);
    const isHl       = isManualHl || isProgHl;
    const isDimmed   = view === "progression" && !isProgHl;
    const s = isHl ? HL_STYLE : BUTTON_STYLES[kind];
    return {
      ...BTN_BASE,
      background: s.background,
      border: s.border,
      color: s.color,
      opacity: isDimmed ? 0.2 : 1,
      cursor: view === "layout" ? "pointer" : "default",
    };
  }

  const selectedProg = progressions.find(p => p.id === selectedProgId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── View tabs — reuse small-button / active-tool ── */}
      <div className="button-row">
        <button
          type="button"
          className={`small-button${view === "layout" ? " active-tool" : ""}`}
          style={{ flex: 1 }}
          onClick={() => setView("layout")}
        >
          Layout
        </button>
        <button
          type="button"
          className={`small-button${view === "progression" ? " active-tool" : ""}`}
          style={{ flex: 1 }}
          onClick={() => setView("progression")}
        >
          Progressions
        </button>
      </div>

      {/* ── Layout controls ── */}
      {view === "layout" && (
        <>
          <label>
            Bass rows
            <select value={bassMode} onChange={e => setBassMode(e.target.value as BassLabelMode)}>
              <option value="interval">Shorthand (1, b3, 3, 5…)</option>
              <option value="quality">Quality (P1, m3, M3, P5…)</option>
              <option value="semitones">Semitones (0, 1, 2…)</option>
            </select>
          </label>
          <label>
            Chord rows
            <select value={chordMode} onChange={e => setChordMode(e.target.value as ChordLabelMode)}>
              <option value="roman">Roman numeral (I, ii, V7…)</option>
              <option value="function">Tonal function (T, D, SD…)</option>
              <option value="interval">Interval content (1-3-5…)</option>
            </select>
          </label>
          {highlighted.size > 0 && (
            <button
              type="button"
              className="small-button"
              onClick={() => setHighlighted(new Set())}
            >
              Clear highlights ({highlighted.size})
            </button>
          )}
        </>
      )}

      {/* ── Progression controls ── */}
      {view === "progression" && (
        <>
          <label>
            Progression
            <select
              value={selectedProgId}
              onChange={e => { setSelectedProgId(e.target.value); setProgStep(null); }}
            >
              {progressions.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.progression}</option>
              ))}
            </select>
          </label>

          {selectedProg && (
            <p className="hint">{selectedProg.description}</p>
          )}

          {parsedSteps.length > 0 && (
            <div className="button-row" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className={`small-button${progStep === null ? " active-tool" : ""}`}
                onClick={() => setProgStep(null)}
              >
                All
              </button>
              {parsedSteps.map((chord, i) => (
                <button
                  key={i}
                  type="button"
                  className={`small-button${progStep === i ? " active-tool" : ""}`}
                  onClick={() => setProgStep(progStep === i ? null : i)}
                >
                  {chord.token}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Chart ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "3px 3px" }}>
          <thead>
            <tr>
              <th style={{ minWidth: 62, textAlign: "right", paddingRight: 6 }} />
              {cols.map((_, ci) => (
                <th
                  key={ci}
                  style={{
                    fontSize: 10,
                    fontWeight: 400,
                    color: "#8a94aa",
                    textAlign: "center",
                    paddingBottom: 2,
                    minWidth: 38,
                  }}
                >
                  {colOffsetLabel(ci)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preset.rows.map(kind => (
              <tr key={kind}>
                <td
                  style={{
                    fontSize: 10,
                    fontStyle: "italic",
                    color: "#526078",
                    textAlign: "right",
                    paddingRight: 6,
                    verticalAlign: "middle",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ROW_LABELS[kind]}
                </td>
                {cols.map((_, ci) => {
                  const id = `${kind}-${ci}`;
                  return (
                    <td key={ci} style={{ textAlign: "center", verticalAlign: "middle" }}>
                      <div
                        role={view === "layout" ? "button" : undefined}
                        tabIndex={view === "layout" ? 0 : undefined}
                        style={buttonStyle(kind, id)}
                        onClick={() => { if (view === "layout") toggleHighlight(id); }}
                        onKeyDown={e => {
                          if (view === "layout" && (e.key === "Enter" || e.key === " ")) {
                            toggleHighlight(id);
                          }
                        }}
                        title={`${ROW_LABELS[kind]}, column ${colOffsetLabel(ci)}`}
                      >
                        {mainLabel(kind, ci)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

