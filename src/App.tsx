/*
  Main application component.

  This file owns the user interface state, connects the layout generators to the
  SVG renderer, and coordinates tools such as fingering, sequences, and text
  notes. Music and layout calculations live in separate modules.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import "./App.css";

import type {
  AccidentalMode,
  AccidentalStyle,
  BassCount,
  ChordLabelMode,
  ColorTheme,
  DiagramButton,
  FinderChordInversion,
  FinderChordPattern,
  FinderScalePattern,
  FontFamily,
  LeftPanelMode,
  NotationMode,
  Overlay,
  NumberPosition,
  SequenceColorPreset,
  SequenceDisplayMode,
  SequenceStep,
  Side,
  SoundVoicePreset,
  SoundWaveform,
  TrebleSizePreset,
  TextNote,
  TextNoteAnchor,
  TitleMode,
} from "./types";

import {
  chordSuffix,
  chordTones,
  fontClass,
  formatPitch,
  isAccidentalPitch,
  isChordKind,
  renderMusicLabel,
  rowFunction,
} from "./music";

import {
  generateStradella,
  stradellaRowLabel,
  stradellaVisibleRoots,
  stradellaVisibleRows,
} from "./stradella";

import { generateTreble } from "./treble";
import { downloadSvg } from "./download";
import {
  getSequenceLabelsForButton,
  getSequenceStepsWithButtons,
  makeSequenceArrowPath,
  sequenceArrowStyleFromMode,
  sequenceModeShowsArrows,
  sequenceModeShowsNumbers,
} from "./tools/sequenceTools";
import { makeTextNote, splitMultilineText } from "./tools/textNoteTools";
import {
  FINDER_ROOT_OPTIONS,
  SCALE_FINDER_OPTIONS,
  SCALE_FINDER_ROW_LIMIT_OPTIONS,
  getScaleFinderTrebleButtons,
} from "./tools/scaleFinderTools";
import {
  CHORD_FINDER_INVERSION_OPTIONS,
  CHORD_FINDER_OPTIONS,
  getChordFinderTrebleButtons,
} from "./tools/chordFinderTools";
import {
  playButtonArpeggioThenChord,
  playButtonSequence,
  playButtonSound,
  stopAllSound,
} from "./sound";

/** Dropdown options for the supported Stradella bass presets. */
const BASS_OPTIONS: Array<{ value: BassCount; label: string }> = [
  { value: "8", label: "8" },
  { value: "12", label: "12" },
  { value: "24", label: "24" },
  { value: "32", label: "32" },
  { value: "40", label: "40" },
  { value: "48-8x6", label: "48, 8×6" },
  { value: "48-12x4", label: "48, 12×4" },
  { value: "60", label: "60" },
  { value: "72", label: "72" },
  { value: "80", label: "80" },
  { value: "96", label: "96" },
  { value: "100", label: "100" },
  { value: "120", label: "120" },
];

/** Dropdown options for treble instrument range presets. */
const TREBLE_SIZE_OPTIONS: Array<{ value: TrebleSizePreset; label: string }> = [
  { value: "small", label: "Small CBA, about 3 octaves" },
  { value: "full", label: "Full-size CBA, about 3¾–4 octaves" },
  { value: "large", label: "Large CBA, about 5+ octaves" },
];

/** SVG viewBox widths chosen so each treble size has enough horizontal space. */
const TREBLE_SIZE_VIEW_WIDTH: Record<TrebleSizePreset, number> = {
  small: 1080,
  full: 1220,
  large: 1460,
};

/** Default button sizes applied when a treble size preset is selected. */
const TREBLE_PRESET_BUTTON_SIZE: Record<TrebleSizePreset, number> = {
  small: 28,
  full: 24,
  large: 20,
};

/** Named colors used by sequence arrows and sequence numbers. */
const COLOR_PRESETS: Record<SequenceColorPreset, string> = {
  red: "#d4553f",
  blue: "#1746d0",
  black: "#111111",
  grey: "#666666",
  theme: "#1746d0",
};

/** Calculates the y-coordinate for a sequence number relative to a button. */
function numberY(
  buttonY: number,
  buttonSize: number,
  position: NumberPosition,
) {
  if (position === "above") return buttonY - buttonSize * 0.72;
  if (position === "inside-top") return buttonY - buttonSize * 0.48;
  return buttonY + buttonSize * 0.58;
}

/** Calculates the y-coordinate for a fingering label relative to a button. */
function fingeringY(
  buttonY: number,
  buttonSize: number,
  position: NumberPosition,
) {
  if (position === "above") return buttonY - buttonSize * 0.72;
  if (position === "inside-top") return buttonY - buttonSize * 0.48;
  return buttonY + buttonSize * 0.58;
}

/** Renders the full accordion diagram generator application. */
function App() {
  /* Reference to the SVG element, used for downloads and click-coordinate conversion. */
  const svgRef = useRef<SVGSVGElement | null>(null);
  const previousLayoutSignatureRef = useRef<string | null>(null);

  /* Core layout and notation state. */
  const [side, setSide] = useState<Side>("stradella");
  const [notation, setNotation] = useState<NotationMode>("english");
  const [accidental, setAccidental] = useState<AccidentalMode>("natural");
  const [chordLabelMode, setChordLabelMode] =
    useState<ChordLabelMode>("chord-name");
  const [basses, setBasses] = useState<BassCount>("96");
  const [trebleSystem, setTrebleSystem] = useState<"c-system" | "b-system">(
    "c-system",
  );
  const [trebleRows, setTrebleRows] = useState<3 | 4 | 5>(5);
  const [trebleSize, setTrebleSize] = useState<TrebleSizePreset>("small");
  const [showTrebleOctaves, setShowTrebleOctaves] = useState(false);

  /* Appearance state shared by Stradella and treble diagrams. */
  const [buttonSize, setButtonSize] = useState(TREBLE_PRESET_BUTTON_SIZE.small);
  const [spacing, setSpacing] = useState(2.3);
  const [trebleAngle, setTrebleAngle] = useState(30);
  const [buttonStrokeWidth, setButtonStrokeWidth] = useState(3);
  const [referenceStrokeWidth, setReferenceStrokeWidth] = useState(6);
  const [chordFillStrength, setChordFillStrength] = useState(100);
  const [accidentalStyle, setAccidentalStyle] =
    useState<AccidentalStyle>("grey");
  const [labelFontSize, setLabelFontSize] = useState(13);
  const [showButtonLabels, setShowButtonLabels] = useState(true);
  const [showBellowsGuide, setShowBellowsGuide] = useState(true);
  const [showStradellaRowLabels, setShowStradellaRowLabels] = useState(true);

  /* Title and label font state. */
  const [titleMode, setTitleMode] = useState<TitleMode>("auto");
  const [customTitle, setCustomTitle] = useState("My accordion diagram");
  const [titleFont, setTitleFont] = useState<FontFamily>("system");
  const [titleSize, setTitleSize] = useState(24);
  const [labelFont, setLabelFont] = useState<FontFamily>("system");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("default");

  /* Left panel visibility and accordion-section state. */
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("settings");

  type SettingsSection =
    | "layout"
    | "title"
    | "appearance"
    | "notation"
    | "sound"
    | null;
  type ToolSection =
    | "scaleFinder"
    | "chordFinder"
    | "fingering"
    | "selection"
    | "sequences"
    | "textNotes"
    | null;

  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSection>("layout");

  const [activeToolSection, setActiveToolSection] =
    useState<ToolSection>("scaleFinder");

  /* Tool state for selections, fingerings, note sequences, and free text notes. */
  const [overlays, setOverlays] = useState<Record<string, Overlay>>({});
  const [isRecordingSequence, setIsRecordingSequence] = useState(false);
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([]);
  const [sequenceDisplayMode, setSequenceDisplayMode] =
    useState<SequenceDisplayMode>("numbers-and-curved-arrows");
  const [sequenceColorPreset, setSequenceColorPreset] =
    useState<SequenceColorPreset>("red");
  const [sequenceThickness, setSequenceThickness] = useState(3.2);
  const [sequenceArrowheadSize, setSequenceArrowheadSize] = useState(4);
  const [sequenceNumberFontSize, setSequenceNumberFontSize] = useState(10);
  const [sequenceNumberColorPreset, setSequenceNumberColorPreset] =
    useState<SequenceColorPreset>("red");
  const [sequenceNumberPosition, setSequenceNumberPosition] =
    useState<NumberPosition>("above");
  const [fingeringPosition, setFingeringPosition] =
    useState<NumberPosition>("inside-bottom");
  const [fingeringDraft, setFingeringDraft] = useState("1");
  const [isApplyingFingering, setIsApplyingFingering] = useState(false);
  const [selectionOnClick, setSelectionOnClick] = useState(true);

  /* Scale Finder state for temporary treble-only scale highlights. */
  const [scaleFinderActive, setScaleFinderActive] = useState(false);
  const [scaleFinderRoot, setScaleFinderRoot] = useState("C");
  const [scaleFinderPattern, setScaleFinderPattern] =
    useState<FinderScalePattern>("major-scale");
  const [scaleFinderRowLimit, setScaleFinderRowLimit] = useState<3 | 4 | 5>(5);

  /* Chord Finder state for temporary treble-only chord highlights. */
  const [chordFinderActive, setChordFinderActive] = useState(false);
  const [chordFinderRoot, setChordFinderRoot] = useState("C");
  const [chordFinderPattern, setChordFinderPattern] =
    useState<FinderChordPattern>("major-triad");
  const [chordFinderInversion, setChordFinderInversion] =
    useState<FinderChordInversion>("root");

  const [noteDraft, setNoteDraft] = useState("Remember\nbellows direction");
  const [isPlacingTextNote, setIsPlacingTextNote] = useState(false);
  const [textNotes, setTextNotes] = useState<TextNote[]>([]);
  const [textNoteFontSize, setTextNoteFontSize] = useState(15);
  const [textNoteColor, setTextNoteColor] = useState("#172033");
  const [textNoteFont, setTextNoteFont] = useState<FontFamily>("system");
  const [textNoteAnchor, setTextNoteAnchor] = useState<TextNoteAnchor>("start");

  /* Sound tool state for synthesized button and sequence playback. */
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.2);
  const [soundVoicePreset, setSoundVoicePreset] =
    useState<SoundVoicePreset>("soft-reed");
  const [soundWaveform, setSoundWaveform] = useState<SoundWaveform>("triangle");
  const [soundMusetteDetuneCents, setSoundMusetteDetuneCents] = useState(9);
  const [soundAttackMs, setSoundAttackMs] = useState(14);
  const [soundReleaseMs, setSoundReleaseMs] = useState(120);
  const [soundNoteDurationMs, setSoundNoteDurationMs] = useState(420);
  const [soundSequenceTempoBpm, setSoundSequenceTempoBpm] = useState(90);

  /** Applies a treble size preset and its matching default button size. */
  function changeTrebleSize(nextSize: TrebleSizePreset) {
    setTrebleSize(nextSize);
    setButtonSize(TREBLE_PRESET_BUTTON_SIZE[nextSize]);
  }

  /* Generated button list for the current side and layout settings. */
  const buttons = useMemo(() => {
    return side === "stradella"
      ? generateStradella(basses, buttonSize, spacing, accidental)
      : generateTreble(
          trebleSystem,
          trebleRows,
          trebleSize,
          buttonSize,
          spacing,
          trebleAngle,
          showTrebleOctaves,
        );
  }, [
    side,
    basses,
    trebleSystem,
    trebleRows,
    trebleSize,
    buttonSize,
    spacing,
    trebleAngle,
    accidental,
    showTrebleOctaves,
  ]);

  /* Signature of layout-changing options used to clear stale tool markings. */
  const layoutSignature = [
    side,
    basses,
    trebleSystem,
    trebleRows,
    trebleSize,
    buttonSize,
    spacing,
    trebleAngle,
    showTrebleOctaves,
  ].join("|");

  /* Clears tool-created marks whenever the physical layout changes. */
  useEffect(() => {
    if (previousLayoutSignatureRef.current === null) {
      previousLayoutSignatureRef.current = layoutSignature;
      return;
    }

    if (previousLayoutSignatureRef.current !== layoutSignature) {
      setOverlays({});
      setSequenceSteps([]);
      setIsRecordingSequence(false);
      setIsApplyingFingering(false);
      setTextNotes([]);
      setIsPlacingTextNote(false);
      setScaleFinderActive(false);
      setChordFinderActive(false);
      previousLayoutSignatureRef.current = layoutSignature;
    }
  }, [layoutSignature]);

  /* Button IDs currently selected through the selection/fingering tool. */
  const selectedButtonIds = Object.entries(overlays)
    .filter(([, overlay]) => overlay.selected)
    .map(([id]) => id);

  const selectedButtons = selectedButtonIds
    .map((id) => buttons.find((button) => button.id === id))
    .filter(Boolean) as DiagramButton[];

  /* Sequence steps enriched with current button geometry for arrow rendering. */
  const sequenceStepsWithButtons = getSequenceStepsWithButtons(
    sequenceSteps,
    buttons,
  );

  /* Exact treble buttons currently highlighted by the Scale Finder tool. */
  const scaleFinderButtons = useMemo(() => {
    if (!scaleFinderActive || side !== "treble") return [];

    return getScaleFinderTrebleButtons(
      buttons,
      scaleFinderRoot,
      scaleFinderPattern,
      scaleFinderRowLimit,
    );
  }, [
    buttons,
    scaleFinderActive,
    scaleFinderRoot,
    scaleFinderPattern,
    scaleFinderRowLimit,
    side,
  ]);

  /* Exact treble buttons currently highlighted by the Chord Finder tool. */
  const chordFinderButtons = useMemo(() => {
    if (!chordFinderActive || side !== "treble") return [];

    return getChordFinderTrebleButtons(
      buttons,
      chordFinderRoot,
      chordFinderPattern,
      chordFinderInversion,
    );
  }, [
    buttons,
    chordFinderActive,
    chordFinderRoot,
    chordFinderPattern,
    chordFinderInversion,
    side,
  ]);

  const finderButtons = scaleFinderActive ? scaleFinderButtons : chordFinderButtons;

  const finderButtonIds = useMemo(
    () => new Set(finderButtons.map((button) => button.id)),
    [finderButtons],
  );

  /* Consolidated sound options passed to the Web Audio helper functions. */
  const soundOptions = {
    enabled: soundEnabled,
    volume: soundVolume,
    voicePreset: soundVoicePreset,
    waveform: soundWaveform,
    musetteDetuneCents: soundMusetteDetuneCents,
    attackMs: soundAttackMs,
    releaseMs: soundReleaseMs,
    noteDurationMs: soundNoteDurationMs,
    sequenceTempoBpm: soundSequenceTempoBpm,
  };

  /** Opens one settings group, or closes it if it is already open. */
  function toggleSettingsSection(section: Exclude<SettingsSection, null>) {
    setActiveSettingsSection((current) =>
      current === section ? null : section,
    );
  }

  /** Opens one tool group, or closes it if it is already open. */
  function toggleToolSection(section: Exclude<ToolSection, null>) {
    setActiveToolSection((current) => (current === section ? null : section));
  }

  /**
   * Handles button clicks.
   *
   * A click can optionally toggle selection, write a fingering label, append a
   * sequence step, and/or trigger sound depending on the active tool settings.
   */
  function toggleButton(button: DiagramButton) {
    const id = button.id;
    const trimmedFinger = fingeringDraft.trim();

    setOverlays((current) => {
      const existing = current[id] ?? {};

      return {
        ...current,
        [id]: {
          ...existing,
          selected: selectionOnClick ? !existing.selected : existing.selected,
          finger:
            isApplyingFingering && trimmedFinger
              ? trimmedFinger
              : existing.finger,
        },
      };
    });

    if (isRecordingSequence) {
      setSequenceSteps((current) => [
        ...current,
        { id, step: current.length + 1 },
      ]);
    }

    playButtonSound(button, soundOptions);
  }

  /** Applies the current fingering value to every selected button. */
  function applyFingerToSelected() {
    const trimmedFinger = fingeringDraft.trim();
    if (!trimmedFinger || selectedButtonIds.length === 0) return;

    setOverlays((current) => {
      const next = { ...current };

      selectedButtonIds.forEach((id) => {
        next[id] = { ...next[id], finger: trimmedFinger };
      });

      return next;
    });
  }

  /** Removes fingering numbers from all currently selected buttons. */
  function clearFingerForSelected() {
    if (selectedButtonIds.length === 0) return;

    setOverlays((current) => {
      const next = { ...current };

      selectedButtonIds.forEach((id) => {
        next[id] = { ...next[id], finger: "" };
      });

      return next;
    });
  }
  /** Removes all fingering numbers while preserving other overlay state. */
  function clearAllFingerings() {
    setOverlays((current) => {
      const next = { ...current };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], finger: "" };
      });
      return next;
    });
  }

  /** Clears selected-button highlights while preserving fingerings. */
  function clearSelection() {
    setOverlays((current) => {
      const next = { ...current };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], selected: false };
      });
      return next;
    });
  }

  /** Removes selected-button highlighting from one button in the selection list. */
  function deselectButton(id: string) {
    setOverlays((current) => ({
      ...current,
      [id]: {
        ...current[id],
        selected: false,
      },
    }));
  }

  /** Removes all recorded sequence steps. */
  function clearSequence() {
    setSequenceSteps([]);
  }

  /** Clears the Scale Finder highlight without changing its selected root or pattern. */
  function clearScaleFinder() {
    setScaleFinderActive(false);
  }

  /** Clears the Chord Finder highlight without changing its selected root or pattern. */
  function clearChordFinder() {
    setChordFinderActive(false);
  }

  /** Plays the currently highlighted Scale Finder path. */
  function playScaleFinder() {
    playButtonSequence(scaleFinderButtons, soundOptions);
  }

  /** Plays the currently highlighted Chord Finder path as an arpeggio, then as a chord. */
  function playChordFinder() {
    playButtonArpeggioThenChord(chordFinderButtons, soundOptions);
  }

  /**
   * Plays selected buttons first as an arpeggio and then together as a chord.
   * The selected-buttons order follows the current rendered diagram/list order.
   */
  function playSelectedButtons() {
    playButtonArpeggioThenChord(selectedButtons, soundOptions);
  }

  /** Plays the current recorded sequence using the sound settings. */
  function playRecordedSequence() {
    playButtonSequence(
      sequenceStepsWithButtons.map((step) => step.button),
      soundOptions,
    );
  }

  /** Stops currently playing notes and any scheduled sequence playback. */
  function stopSoundPlayback() {
    stopAllSound();
  }

  /** Removes all free text notes and exits note-placement mode. */
  function clearTextNotes() {
    setTextNotes([]);
    setIsPlacingTextNote(false);
  }

  /** Clears selections, fingerings, sequences, text notes, and active tool modes. */
  function resetDiagramWork() {
    setOverlays({});
    setSequenceSteps([]);
    setIsRecordingSequence(false);
    setIsApplyingFingering(false);
    setTextNotes([]);
    setIsPlacingTextNote(false);
    setScaleFinderActive(false);
      setChordFinderActive(false);
    stopAllSound();
  }

  /** Computes the visible label for one button using notation and chord-label settings. */
  function getMainLabel(button: DiagramButton) {
    if (side === "stradella" && isChordKind(button.kind)) {
      if (chordLabelMode === "none") return "";

      const root = formatPitch(
        button.chordRoot,
        notation,
        accidental,
        button.chordDisplayName ?? button.chordNaturalName,
      );

      if (chordLabelMode === "root-only") return root;
      if (chordLabelMode === "row-function") return rowFunction(button.kind);
      if (chordLabelMode === "chord-tones") {
        return chordTones(
          button.chordRoot ?? "C",
          button.kind,
          notation,
          accidental,
        );
      }

      return `${root}${chordSuffix(button.kind)}`;
    }

    return formatPitch(
      button.pitchClass,
      notation,
      accidental,
      button.displayName ?? button.naturalName,
      button.octave,
    );
  }

  /** Builds the automatic title for the current diagram side and preset. */
  function autoTitle() {
    if (side === "stradella") return `${basses}-Bass Stradella`;
    return `${trebleSystem === "c-system" ? "C-system" : "B-system / Bayan"} Treble`;
  }

  /** Toggles the requested left panel; clicking the active panel hides it. */
  function setPanel(mode: Exclude<LeftPanelMode, "hidden">) {
    setLeftPanelMode((current) => (current === mode ? "hidden" : mode));
  }

  /** Downloads the currently rendered diagram as an SVG file. */
  function downloadCurrentDiagram() {
    if (!svgRef.current) return;
    downloadSvg(svgRef.current, `${side}-accordion-diagram.svg`);
  }

  /** Converts a browser mouse click into SVG viewBox coordinates. */
  function svgPointFromMouse(event: ReactMouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const screenMatrix = svg?.getScreenCTM();
    if (!svg || !screenMatrix) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(screenMatrix.inverse());
  }

  /** Places a free text note at the clicked SVG coordinate when note placement is active. */
  function handleSvgClick(event: ReactMouseEvent<SVGSVGElement>) {
    if (!isPlacingTextNote || !noteDraft.trim()) return;

    const point = svgPointFromMouse(event);
    if (!point) return;

    setTextNotes((current) => [
      ...current,
      makeTextNote({
        x: point.x,
        y: point.y,
        text: noteDraft,
        fontSize: textNoteFontSize,
        color: textNoteColor,
        font: textNoteFont,
        anchor: textNoteAnchor,
      }),
    ]);
    setIsPlacingTextNote(false);
  }

  /* Derived values used by rendering. */
  const finalTitle =
    titleMode === "auto"
      ? autoTitle()
      : titleMode === "custom"
        ? customTitle
        : "";

  const visibleRoots =
    side === "stradella" ? stradellaVisibleRoots(basses) : [];
  const visibleRows = side === "stradella" ? stradellaVisibleRows(basses) : [];

  const viewWidth =
    side === "stradella"
      ? Math.max(1040, 275 + visibleRoots.length * buttonSize * spacing * 1.15)
      : TREBLE_SIZE_VIEW_WIDTH[trebleSize];

  const viewHeight =
    side === "stradella"
      ? Math.max(320, 220 + visibleRows.length * buttonSize * spacing * 0.88)
      : 450;

  const appGridColumns = `${leftPanelMode === "hidden" ? "" : "320px "}minmax(0, 1fr)`;

  const showSequenceNumbers = sequenceModeShowsNumbers(sequenceDisplayMode);
  const showSequenceArrows = sequenceModeShowsArrows(sequenceDisplayMode);
  const sequenceArrowStyle = sequenceArrowStyleFromMode(sequenceDisplayMode);
  const sequenceArrowheadMarkerId = "sequence-arrowhead";
  const finderArrowheadMarkerId = "finder-arrowhead";
  const sequenceColor = COLOR_PRESETS[sequenceColorPreset];
  const sequenceNumberColor = COLOR_PRESETS[sequenceNumberColorPreset];

  /* CSS variables passed into the SVG so sliders can affect styling. */
  const svgStyle = {
    "--button-stroke-width": buttonStrokeWidth,
    "--reference-stroke-width": referenceStrokeWidth,
    "--chord-fill-strength": chordFillStrength / 100,
    "--sequence-color": sequenceColor,
    "--sequence-thickness": sequenceThickness,
    "--sequence-number-color": sequenceNumberColor,
    "--sequence-number-size": `${sequenceNumberFontSize}px`,
  } as CSSProperties;

  return (
    <main className="app" style={{ gridTemplateColumns: appGridColumns }}>
      {leftPanelMode !== "hidden" && (
        <aside className="left-panel">
          <h1>{leftPanelMode === "settings" ? "Settings" : "Tools"}</h1>

          {leftPanelMode === "settings" && (
            <>
              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("layout")}
                >
                  Layout{" "}
                  <span>{activeSettingsSection === "layout" ? "−" : "+"}</span>
                </button>

                {activeSettingsSection === "layout" && (
                  <div className="section-content">
                    {side === "stradella" && (
                      <>
                        <label>
                          Basses
                          <select
                            value={basses}
                            onChange={(event) =>
                              setBasses(event.target.value as BassCount)
                            }
                          >
                            {BASS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Chord labels
                          <select
                            value={chordLabelMode}
                            onChange={(event) =>
                              setChordLabelMode(
                                event.target.value as ChordLabelMode,
                              )
                            }
                          >
                            <option value="none">None</option>
                            <option value="chord-name">
                              Chord name: C, Cm, C7
                            </option>
                            <option value="root-only">Root only</option>
                            <option value="chord-tones">Chord tones</option>
                            <option value="row-function">
                              Row function: M, m, 7
                            </option>
                          </select>
                        </label>
                      </>
                    )}

                    {side === "treble" && (
                      <>
                        <label>
                          Treble system
                          <select
                            value={trebleSystem}
                            onChange={(event) =>
                              setTrebleSystem(
                                event.target.value as "c-system" | "b-system",
                              )
                            }
                          >
                            <option value="c-system">C-system</option>
                            <option value="b-system">B-system / Bayan</option>
                          </select>
                        </label>

                        <label>
                          Rows
                          <select
                            value={trebleRows}
                            onChange={(event) =>
                              setTrebleRows(
                                Number(event.target.value) as 3 | 4 | 5,
                              )
                            }
                          >
                            <option value={3}>3 rows</option>
                            <option value={4}>4 rows</option>
                            <option value={5}>5 rows</option>
                          </select>
                        </label>

                        <label>
                          Treble size
                          <select
                            value={trebleSize}
                            onChange={(event) =>
                              changeTrebleSize(
                                event.target.value as TrebleSizePreset,
                              )
                            }
                          >
                            {TREBLE_SIZE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Octave numbers
                          <select
                            value={showTrebleOctaves ? "on" : "off"}
                            onChange={(event) =>
                              setShowTrebleOctaves(event.target.value === "on")
                            }
                          >
                            <option value="off">Off</option>
                            <option value="on">On</option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("title")}
                >
                  Title{" "}
                  <span>{activeSettingsSection === "title" ? "−" : "+"}</span>
                </button>

                {activeSettingsSection === "title" && (
                  <div className="section-content">
                    <label>
                      Title
                      <select
                        value={titleMode}
                        onChange={(event) =>
                          setTitleMode(event.target.value as TitleMode)
                        }
                      >
                        <option value="auto">Auto</option>
                        <option value="custom">Custom</option>
                        <option value="none">None</option>
                      </select>
                    </label>

                    {titleMode === "custom" && (
                      <label>
                        Custom title
                        <input
                          value={customTitle}
                          onChange={(event) =>
                            setCustomTitle(event.target.value)
                          }
                        />
                      </label>
                    )}

                    {titleMode !== "none" && (
                      <>
                        <label>
                          Title font
                          <select
                            value={titleFont}
                            onChange={(event) =>
                              setTitleFont(event.target.value as FontFamily)
                            }
                          >
                            <option value="system">System</option>
                            <option value="serif">Serif</option>
                            <option value="mono">Mono</option>
                            <option value="rounded">Rounded</option>
                          </select>
                        </label>

                        <label>
                          Title size: {titleSize}px
                          <input
                            type="range"
                            min={14}
                            max={42}
                            value={titleSize}
                            onChange={(event) =>
                              setTitleSize(Number(event.target.value))
                            }
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("appearance")}
                >
                  Appearance{" "}
                  <span>
                    {activeSettingsSection === "appearance" ? "−" : "+"}
                  </span>
                </button>

                {activeSettingsSection === "appearance" && (
                  <div className="section-content">
                    <label>
                      Color theme
                      <select
                        value={colorTheme}
                        onChange={(event) =>
                          setColorTheme(event.target.value as ColorTheme)
                        }
                      >
                        <option value="default">Default blue</option>
                        <option value="classic">Classic ink</option>
                        <option value="pastel">Pastel</option>
                        <option value="warm">Warm cream</option>
                        <option value="contrast">High contrast</option>
                        <option value="print">Print / grayscale</option>
                      </select>
                    </label>

                    <label>
                      Accidental buttons
                      <select
                        value={accidentalStyle}
                        onChange={(event) =>
                          setAccidentalStyle(
                            event.target.value as AccidentalStyle,
                          )
                        }
                      >
                        <option value="grey">Grey</option>
                        <option value="dark">Dark</option>
                        <option value="outline">Outline only</option>
                        <option value="theme">Theme color</option>
                      </select>
                    </label>

                    <label>
                      Label font
                      <select
                        value={labelFont}
                        onChange={(event) =>
                          setLabelFont(event.target.value as FontFamily)
                        }
                      >
                        <option value="system">System</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Mono</option>
                        <option value="rounded">Rounded</option>
                      </select>
                    </label>

                    <label>
                      Label font size: {labelFontSize}px
                      <input
                        type="range"
                        min={8}
                        max={24}
                        value={labelFontSize}
                        onChange={(event) =>
                          setLabelFontSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <button
                      type="button"
                      className={`small-button ${showButtonLabels ? "active-tool" : ""}`}
                      onClick={() => setShowButtonLabels((current) => !current)}
                    >
                      {showButtonLabels
                        ? "Hide button labels"
                        : "Show button labels"}
                    </button>

                    <button
                      type="button"
                      className={`small-button ${showBellowsGuide ? "active-tool" : ""}`}
                      onClick={() => setShowBellowsGuide((current) => !current)}
                    >
                      {showBellowsGuide
                        ? "Hide bellows guide"
                        : "Show bellows guide"}
                    </button>

                    {side === "stradella" && (
                      <label>
                        Show Stradella row labels
                        <select
                          value={showStradellaRowLabels ? "on" : "off"}
                          onChange={(event) =>
                            setShowStradellaRowLabels(
                              event.target.value === "on",
                            )
                          }
                        >
                          <option value="on">On</option>
                          <option value="off">Off</option>
                        </select>
                      </label>
                    )}

                    <label>
                      Button size: {buttonSize}
                      <input
                        type="range"
                        min={12}
                        max={28}
                        value={buttonSize}
                        onChange={(event) =>
                          setButtonSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Spacing: {spacing.toFixed(2)}
                      <input
                        type="range"
                        min={1.7}
                        max={3.2}
                        step={0.05}
                        value={spacing}
                        onChange={(event) =>
                          setSpacing(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Button line: {buttonStrokeWidth.toFixed(1)}
                      <input
                        type="range"
                        min={1}
                        max={6}
                        step={0.25}
                        value={buttonStrokeWidth}
                        onChange={(event) =>
                          setButtonStrokeWidth(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Reference line: {referenceStrokeWidth.toFixed(1)}
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={0.25}
                        value={referenceStrokeWidth}
                        onChange={(event) =>
                          setReferenceStrokeWidth(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Chord fill: {chordFillStrength}%
                      <input
                        type="range"
                        min={20}
                        max={100}
                        step={5}
                        value={chordFillStrength}
                        onChange={(event) =>
                          setChordFillStrength(Number(event.target.value))
                        }
                      />
                    </label>

                    {side === "treble" && (
                      <label>
                        Treble angle: {trebleAngle}°
                        <input
                          type="range"
                          min={-35}
                          max={35}
                          value={trebleAngle}
                          onChange={(event) =>
                            setTrebleAngle(Number(event.target.value))
                          }
                        />
                      </label>
                    )}
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("notation")}
                >
                  Notation{" "}
                  <span>
                    {activeSettingsSection === "notation" ? "−" : "+"}
                  </span>
                </button>

                {activeSettingsSection === "notation" && (
                  <div className="section-content">
                    <label>
                      Notation
                      <select
                        value={notation}
                        onChange={(event) =>
                          setNotation(event.target.value as NotationMode)
                        }
                      >
                        <option value="english">C D E F</option>
                        <option value="solfege">Do Re Mi Fa</option>
                        <option value="intervals">Intervals</option>
                        <option value="blank">Blank</option>
                      </select>
                    </label>

                    <label>
                      Accidentals
                      <select
                        value={accidental}
                        onChange={(event) =>
                          setAccidental(event.target.value as AccidentalMode)
                        }
                      >
                        <option value="natural">Default spelling</option>
                        <option value="flats">Prefer flats</option>
                        <option value="sharps">Prefer sharps</option>
                      </select>
                    </label>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleSettingsSection("sound")}
                >
                  Sound{" "}
                  <span>{activeSettingsSection === "sound" ? "−" : "+"}</span>
                </button>

                {activeSettingsSection === "sound" && (
                  <div className="section-content">
                    <p className="hint">
                      Choose the synthesized voice used by button clicks and
                      sequence playback. Use the top Sound button to turn
                      playback on or off.
                    </p>

                    <label>
                      Voice
                      <select
                        value={soundVoicePreset}
                        onChange={(event) =>
                          setSoundVoicePreset(
                            event.target.value as SoundVoicePreset,
                          )
                        }
                      >
                        <option value="soft-reed">Soft reed</option>
                        <option value="bright-reed">Bright reed</option>
                        <option value="musette">Musette detuned reeds</option>
                        <option value="organ">Organ-like</option>
                        <option value="bass-reed">Bass reed</option>
                        <option value="single">Single oscillator</option>
                      </select>
                    </label>

                    {soundVoicePreset === "single" && (
                      <label>
                        Waveform
                        <select
                          value={soundWaveform}
                          onChange={(event) =>
                            setSoundWaveform(
                              event.target.value as SoundWaveform,
                            )
                          }
                        >
                          <option value="sine">Sine</option>
                          <option value="triangle">Triangle</option>
                          <option value="sawtooth">Sawtooth</option>
                          <option value="square">Square</option>
                        </select>
                      </label>
                    )}

                    {soundVoicePreset === "musette" && (
                      <label>
                        Reed detune: {soundMusetteDetuneCents} cents
                        <input
                          type="range"
                          min={0}
                          max={24}
                          step={1}
                          value={soundMusetteDetuneCents}
                          onChange={(event) =>
                            setSoundMusetteDetuneCents(
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>
                    )}

                    <label>
                      Volume: {Math.round(soundVolume * 100)}%
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={soundVolume}
                        onChange={(event) =>
                          setSoundVolume(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Attack: {soundAttackMs} ms
                      <input
                        type="range"
                        min={1}
                        max={120}
                        step={1}
                        value={soundAttackMs}
                        onChange={(event) =>
                          setSoundAttackMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Release: {soundReleaseMs} ms
                      <input
                        type="range"
                        min={20}
                        max={500}
                        step={10}
                        value={soundReleaseMs}
                        onChange={(event) =>
                          setSoundReleaseMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Note duration: {soundNoteDurationMs} ms
                      <input
                        type="range"
                        min={80}
                        max={1500}
                        step={20}
                        value={soundNoteDurationMs}
                        onChange={(event) =>
                          setSoundNoteDurationMs(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Sequence tempo: {soundSequenceTempoBpm} BPM
                      <input
                        type="range"
                        min={40}
                        max={200}
                        step={5}
                        value={soundSequenceTempoBpm}
                        onChange={(event) =>
                          setSoundSequenceTempoBpm(Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                )}
              </section>
            </>
          )}

          {leftPanelMode === "tools" && (
            <>
              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("scaleFinder")}
                >
                  Scale Finder{" "}
                  <span>{activeToolSection === "scaleFinder" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "scaleFinder" && (
                  <div className="section-content">
                    <p className="hint">
                      Treble-only. Finds a single-octave scale path and can
                      restrict the path to the first 3, 4, or 5 rows.
                    </p>

                    {side !== "treble" && (
                      <p className="hint">
                        Scale Finder is disabled in Stradella mode. Switch to
                        the treble side to use it.
                      </p>
                    )}

                    <fieldset disabled={side !== "treble"} className="tool-fieldset">
                      <label>
                        Scale root
                        <select
                          value={scaleFinderRoot}
                          onChange={(event) => setScaleFinderRoot(event.target.value)}
                        >
                          {FINDER_ROOT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Scale type
                        <select
                          value={scaleFinderPattern}
                          onChange={(event) =>
                            setScaleFinderPattern(event.target.value as FinderScalePattern)
                          }
                        >
                          {SCALE_FINDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Rows used
                        <select
                          value={scaleFinderRowLimit}
                          onChange={(event) =>
                            setScaleFinderRowLimit(Number(event.target.value) as 3 | 4 | 5)
                          }
                        >
                          {SCALE_FINDER_ROW_LIMIT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <p className="hint">
                        Scale buttons: <strong>{scaleFinderButtons.length}</strong>
                      </p>

                      <div className="button-row">
                        <button
                          type="button"
                          className={`small-button ${scaleFinderActive ? "active-tool" : ""}`}
                          onClick={() => {
                            setScaleFinderActive((current) => !current);
                            setChordFinderActive(false);
                          }}
                          disabled={side !== "treble"}
                        >
                          {scaleFinderActive ? "Hide scale" : "Show scale"}
                        </button>

                        <button
                          className="small-button"
                          onClick={playScaleFinder}
                          disabled={side !== "treble" || scaleFinderButtons.length === 0}
                        >
                          Play scale
                        </button>

                        <button className="small-button" onClick={clearScaleFinder}>
                          Clear scale
                        </button>
                      </div>
                    </fieldset>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("chordFinder")}
                >
                  Chord Finder{" "}
                  <span>{activeToolSection === "chordFinder" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "chordFinder" && (
                  <div className="section-content">
                    <p className="hint">
                      Treble-only. Finds a compact chord shape around a root in
                      octave 4 and supports inversions.
                    </p>

                    {side !== "treble" && (
                      <p className="hint">
                        Chord Finder is disabled in Stradella mode. Switch to
                        the treble side to use it.
                      </p>
                    )}

                    <fieldset disabled={side !== "treble"} className="tool-fieldset">
                      <label>
                        Chord root
                        <select
                          value={chordFinderRoot}
                          onChange={(event) => setChordFinderRoot(event.target.value)}
                        >
                          {FINDER_ROOT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Chord type
                        <select
                          value={chordFinderPattern}
                          onChange={(event) =>
                            setChordFinderPattern(event.target.value as FinderChordPattern)
                          }
                        >
                          {CHORD_FINDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Inversion
                        <select
                          value={chordFinderInversion}
                          onChange={(event) =>
                            setChordFinderInversion(
                              event.target.value as FinderChordInversion,
                            )
                          }
                        >
                          {CHORD_FINDER_INVERSION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <p className="hint">
                        Chord buttons: <strong>{chordFinderButtons.length}</strong>
                      </p>

                      <div className="button-row">
                        <button
                          type="button"
                          className={`small-button ${chordFinderActive ? "active-tool" : ""}`}
                          onClick={() => {
                            setChordFinderActive((current) => !current);
                            setScaleFinderActive(false);
                          }}
                          disabled={side !== "treble"}
                        >
                          {chordFinderActive ? "Hide chord" : "Show chord"}
                        </button>

                        <button
                          className="small-button"
                          onClick={playChordFinder}
                          disabled={side !== "treble" || chordFinderButtons.length === 0}
                        >
                          Play chord
                        </button>

                        <button className="small-button" onClick={clearChordFinder}>
                          Clear chord
                        </button>
                      </div>
                    </fieldset>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("fingering")}
                >
                  Fingering{" "}
                  <span>{activeToolSection === "fingering" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "fingering" && (
                  <div className="section-content">
                    <p className="hint">
                      Enter a finger number, then either apply it to selected
                      buttons or turn on click-to-label mode and click buttons
                      directly.
                    </p>

                    <label>
                      Fingering value
                      <input
                        placeholder="1-5"
                        maxLength={3}
                        value={fingeringDraft}
                        onChange={(event) =>
                          setFingeringDraft(event.target.value)
                        }
                      />
                    </label>

                    <button
                      type="button"
                      className={`small-button ${isApplyingFingering ? "active-tool" : ""}`}
                      onClick={() =>
                        setIsApplyingFingering((current) => !current)
                      }
                    >
                      {isApplyingFingering
                        ? "Stop click-to-label"
                        : "Click buttons to label"}
                    </button>

                    <label>
                      Fingering position
                      <select
                        value={fingeringPosition}
                        onChange={(event) =>
                          setFingeringPosition(
                            event.target.value as NumberPosition,
                          )
                        }
                      >
                        <option value="inside-bottom">Inside bottom</option>
                        <option value="inside-top">Inside top</option>
                        <option value="above">Above button</option>
                      </select>
                    </label>

                    <div className="button-row">
                      <button
                        className="small-button"
                        onClick={applyFingerToSelected}
                      >
                        Apply to selected
                      </button>
                      <button
                        className="small-button"
                        onClick={clearFingerForSelected}
                      >
                        Clear selected
                      </button>
                      <button
                        className="small-button"
                        onClick={clearAllFingerings}
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("selection")}
                >
                  Selection{" "}
                  <span>{activeToolSection === "selection" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "selection" && (
                  <div className="section-content">
                    <p className="hint">
                      Selected buttons:{" "}
                      <strong>{selectedButtons.length}</strong>
                    </p>

                    <button
                      type="button"
                      className={`small-button ${selectionOnClick ? "active-tool" : ""}`}
                      onClick={() => setSelectionOnClick((current) => !current)}
                    >
                      {selectionOnClick
                        ? "Selection on click"
                        : "Selection off on click"}
                    </button>

                    <button
                      type="button"
                      className="small-button"
                      onClick={playSelectedButtons}
                      disabled={selectedButtons.length === 0}
                    >
                      Play selection
                    </button>

                    {selectedButtons.length > 0 ? (
                      <div className="selected-list">
                        {selectedButtons.map((button) => (
                          <div key={button.id} className="selected-item">
                            <span>{getMainLabel(button) || "Blank"}</span>
                            <span className="selected-meta">
                              {side === "stradella"
                                ? `${stradellaRowLabel(button.kind)}, col ${button.column + 1}`
                                : `row ${button.row + 1}, col ${button.column + 1}`}
                            </span>
                            <button
                              type="button"
                              className="selected-remove-button"
                              onClick={() => deselectButton(button.id)}
                              aria-label={`Deselect ${getMainLabel(button) || "button"}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="hint">No buttons selected.</p>
                    )}

                    <button className="small-button" onClick={clearSelection}>
                      Clear selection
                    </button>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("sequences")}
                >
                  Sequence{" "}
                  <span>{activeToolSection === "sequences" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "sequences" && (
                  <div className="section-content">
                    <p className="hint">
                      Turn recording on, then click buttons in order. Repeated
                      buttons are allowed.
                    </p>

                    <label>
                      Display
                      <select
                        value={sequenceDisplayMode}
                        onChange={(event) =>
                          setSequenceDisplayMode(
                            event.target.value as SequenceDisplayMode,
                          )
                        }
                      >
                        <option value="numbers">Numbers only</option>
                        <option value="straight-arrows">Straight arrows</option>
                        <option value="curved-arrows">Curved arrows</option>
                        <option value="numbers-and-straight-arrows">
                          Numbers + straight arrows
                        </option>
                        <option value="numbers-and-curved-arrows">
                          Numbers + curved arrows
                        </option>
                      </select>
                    </label>

                    <label>
                      Arrow color
                      <select
                        value={sequenceColorPreset}
                        onChange={(event) =>
                          setSequenceColorPreset(
                            event.target.value as SequenceColorPreset,
                          )
                        }
                      >
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="black">Black</option>
                        <option value="grey">Grey</option>
                        <option value="theme">Theme accent</option>
                      </select>
                    </label>

                    <label>
                      Arrow thickness: {sequenceThickness.toFixed(1)}
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={0.25}
                        value={sequenceThickness}
                        onChange={(event) =>
                          setSequenceThickness(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Arrowhead size: {sequenceArrowheadSize.toFixed(1)}
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={0.5}
                        value={sequenceArrowheadSize}
                        onChange={(event) =>
                          setSequenceArrowheadSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Number color
                      <select
                        value={sequenceNumberColorPreset}
                        onChange={(event) =>
                          setSequenceNumberColorPreset(
                            event.target.value as SequenceColorPreset,
                          )
                        }
                      >
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="black">Black</option>
                        <option value="grey">Grey</option>
                        <option value="theme">Theme accent</option>
                      </select>
                    </label>

                    <label>
                      Number position
                      <select
                        value={sequenceNumberPosition}
                        onChange={(event) =>
                          setSequenceNumberPosition(
                            event.target.value as NumberPosition,
                          )
                        }
                      >
                        <option value="above">Above button</option>
                        <option value="inside-top">Inside top</option>
                        <option value="inside-bottom">Inside bottom</option>
                      </select>
                    </label>

                    <label>
                      Number font size: {sequenceNumberFontSize}px
                      <input
                        type="range"
                        min={7}
                        max={18}
                        value={sequenceNumberFontSize}
                        onChange={(event) =>
                          setSequenceNumberFontSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <button
                      className={`small-button ${isRecordingSequence ? "active-tool" : ""}`}
                      onClick={() =>
                        setIsRecordingSequence((current) => !current)
                      }
                    >
                      {isRecordingSequence
                        ? "Stop recording"
                        : "Record sequence"}
                    </button>

                    <p className="hint">
                      Sequence length: <strong>{sequenceSteps.length}</strong>
                    </p>

                    <div className="button-row">
                      <button
                        className="small-button"
                        onClick={playRecordedSequence}
                        disabled={sequenceSteps.length === 0}
                      >
                        Play sequence
                      </button>
                      <button
                        className="small-button"
                        onClick={stopSoundPlayback}
                      >
                        Stop
                      </button>
                      <button className="small-button" onClick={clearSequence}>
                        Clear sequence
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="control-section">
                <button
                  className="section-title"
                  onClick={() => toggleToolSection("textNotes")}
                >
                  Text notes{" "}
                  <span>{activeToolSection === "textNotes" ? "−" : "+"}</span>
                </button>

                {activeToolSection === "textNotes" && (
                  <div className="section-content">
                    <p className="hint">
                      Type text, click “Place note”, then click on the diagram.
                      Multiple lines are supported.
                    </p>

                    <label>
                      Note text
                      <textarea
                        rows={4}
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Type a note"
                      />
                    </label>

                    <label>
                      Text size: {textNoteFontSize}px
                      <input
                        type="range"
                        min={8}
                        max={32}
                        value={textNoteFontSize}
                        onChange={(event) =>
                          setTextNoteFontSize(Number(event.target.value))
                        }
                      />
                    </label>

                    <label>
                      Text color
                      <input
                        type="color"
                        value={textNoteColor}
                        onChange={(event) =>
                          setTextNoteColor(event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Text font
                      <select
                        value={textNoteFont}
                        onChange={(event) =>
                          setTextNoteFont(event.target.value as FontFamily)
                        }
                      >
                        <option value="system">System</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Mono</option>
                        <option value="rounded">Rounded</option>
                      </select>
                    </label>

                    <label>
                      Text anchor
                      <select
                        value={textNoteAnchor}
                        onChange={(event) =>
                          setTextNoteAnchor(
                            event.target.value as TextNoteAnchor,
                          )
                        }
                      >
                        <option value="start">Left</option>
                        <option value="middle">Center</option>
                      </select>
                    </label>

                    <button
                      className={`small-button ${isPlacingTextNote ? "active-tool" : ""}`}
                      onClick={() =>
                        setIsPlacingTextNote((current) => !current)
                      }
                    >
                      {isPlacingTextNote ? "Click diagram..." : "Place note"}
                    </button>

                    <p className="hint">
                      Notes: <strong>{textNotes.length}</strong>
                    </p>

                    <button className="small-button" onClick={clearTextNotes}>
                      Clear notes
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </aside>
      )}

      <section className="workspace">
        <div className="topbar">
          <button
            className={`topbar-button ${side === "stradella" ? "active" : ""}`}
            onClick={() => setSide("stradella")}
          >
            Stradella
          </button>

          <button
            className={`topbar-button ${side === "treble" ? "active" : ""}`}
            onClick={() => setSide("treble")}
          >
            Treble
          </button>

          <span className="topbar-separator" />

          <button
            className={`topbar-button ${leftPanelMode === "settings" ? "active" : ""}`}
            onClick={() => setPanel("settings")}
          >
            Settings
          </button>

          <button
            className={`topbar-button ${leftPanelMode === "tools" ? "active" : ""}`}
            onClick={() => setPanel("tools")}
          >
            Tools
          </button>

          <span className="topbar-spacer" />

          <button
            className={`topbar-button ${soundEnabled ? "active" : ""}`}
            onClick={() => setSoundEnabled((current) => !current)}
          >
            {soundEnabled ? "Sound on" : "Sound off"}
          </button>

          <button
            className="topbar-button reset-button"
            onClick={resetDiagramWork}
          >
            Reset
          </button>

          <button
            className="topbar-button download-button"
            onClick={downloadCurrentDiagram}
          >
            Download SVG
          </button>
        </div>

        <div className="canvas-wrap">
          <svg
            ref={svgRef}
            className={`diagram diagram-theme-${colorTheme} accidental-style-${accidentalStyle} ${isPlacingTextNote ? "placing-note" : ""}`}
            viewBox={`0 0 ${viewWidth} ${viewHeight}`}
            role="img"
            onClick={handleSvgClick}
            style={svgStyle}
          >
            <defs>
              <marker
                id={sequenceArrowheadMarkerId}
                markerWidth={sequenceArrowheadSize + 1}
                markerHeight={sequenceArrowheadSize + 1}
                refX={sequenceArrowheadSize}
                refY={sequenceArrowheadSize / 2}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path
                  d={`M 0 0 L ${sequenceArrowheadSize} ${sequenceArrowheadSize / 2} L 0 ${sequenceArrowheadSize} z`}
                  className="sequence-arrowhead"
                />
              </marker>

              <marker
                id={finderArrowheadMarkerId}
                markerWidth="5"
                markerHeight="5"
                refX="4"
                refY="2.5"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 0 0 L 5 2.5 L 0 5 z" className="finder-arrowhead" />
              </marker>
            </defs>

            {titleMode !== "none" && (
              <text
                x={viewWidth / 2}
                y="34"
                textAnchor="middle"
                className={`title ${fontClass(titleFont)}`}
                style={{ fontSize: titleSize }}
              >
                {finalTitle}
              </text>
            )}

            {showBellowsGuide && (
              <>
                <text
                  x="76"
                  y="70"
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  Bottom
                </text>

                <text
                  x={viewWidth / 2}
                  y="70"
                  textAnchor="middle"
                  className="bellows-label"
                >
                  Bellows
                </text>

                <text
                  x={viewWidth - 76}
                  y="70"
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  Top
                </text>
              </>
            )}

            {showBellowsGuide && (
              <rect
                x="72"
                y="82"
                width={viewWidth - 150}
                height="12"
                rx="6"
                className="bellows-strip"
              />
            )}

            {side === "stradella" &&
              showStradellaRowLabels &&
              visibleRows.map((kind) => {
                const sample = buttons.find(
                  (button) => button.kind === kind && button.column === 0,
                );
                if (!sample) return null;

                return (
                  <text
                    key={kind}
                    x={sample.x - buttonSize - 10}
                    y={sample.y + 4}
                    textAnchor="end"
                    className="stradella-row-label"
                  >
                    {stradellaRowLabel(kind)}
                  </text>
                );
              })}

            {buttons.map((button) => {
              const overlay = overlays[button.id] ?? {};
              const mainLabel = getMainLabel(button);
              const isChord = isChordKind(button.kind);
              const isTreble = button.kind === "treble-note";
              const isTrebleAccidental =
                isTreble && isAccidentalPitch(button.pitchClass);
              const sequenceLabels = getSequenceLabelsForButton(
                sequenceSteps,
                button.id,
              );
              const finderMatch = finderButtonIds.has(button.id);

              const fontSize =
                chordLabelMode === "chord-tones" && isChord
                  ? Math.max(7, labelFontSize * 0.75)
                  : labelFontSize;

              return (
                <g
                  key={button.id}
                  className="button-group"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleButton(button);
                  }}
                >
                  <circle
                    cx={button.x}
                    cy={button.y}
                    r={buttonSize}
                    className={[
                      "button",
                      isChord ? "chord" : "note",
                      isTreble ? "treble-button" : "",
                      isTrebleAccidental ? "treble-accidental" : "",
                      overlay.selected ? "selected" : "",
                      button.isReference ? "reference" : "",
                      finderMatch ? "finder-match" : "",
                      sequenceLabels ? "in-sequence" : "",
                    ].join(" ")}
                  />

                  {showButtonLabels && (
                    <text
                      x={button.x}
                      y={button.y - (overlay.finger || sequenceLabels ? 2 : 0)}
                      textAnchor="middle"
                      className={[
                        "main-label",
                        fontClass(labelFont),
                        isTreble ? "treble-label" : "",
                        isTrebleAccidental ? "treble-accidental-label" : "",
                      ].join(" ")}
                      style={{ fontSize }}
                    >
                      {renderMusicLabel(mainLabel)}
                    </text>
                  )}
                  {showSequenceNumbers && sequenceLabels && (
                    <text
                      x={button.x}
                      y={numberY(button.y, buttonSize, sequenceNumberPosition)}
                      textAnchor="middle"
                      className="sequence-number"
                    >
                      {sequenceLabels}
                    </text>
                  )}

                  {overlay.finger && (
                    <text
                      x={button.x}
                      y={fingeringY(button.y, buttonSize, fingeringPosition)}
                      textAnchor="middle"
                      className={[
                        "finger-label",
                        fontClass(labelFont),
                        isTrebleAccidental ? "treble-accidental-label" : "",
                      ].join(" ")}
                      style={{ fontSize: buttonSize * 0.44 }}
                    >
                      {overlay.finger}
                    </text>
                  )}
                </g>
              );
            })}

            {(scaleFinderActive || chordFinderActive) &&
              side === "treble" &&
              finderButtons.length > 1 &&
              finderButtons.slice(0, -1).map((fromButton, index) => {
                const toButton = finderButtons[index + 1];

                return (
                  <path
                    key={`finder-${fromButton.id}-${toButton.id}-${index}`}
                    d={makeSequenceArrowPath(
                      fromButton,
                      toButton,
                      index,
                      buttonSize,
                      "straight",
                    )}
                    className="finder-arrow"
                    markerEnd={`url(#${finderArrowheadMarkerId})`}
                  />
                );
              })}

            {showSequenceArrows &&
              sequenceStepsWithButtons.slice(0, -1).map((fromStep, index) => {
                const toStep = sequenceStepsWithButtons[index + 1];

                return (
                  <path
                    key={`${fromStep.id}-${toStep.id}-${fromStep.step}-${toStep.step}`}
                    d={makeSequenceArrowPath(
                      fromStep.button,
                      toStep.button,
                      index,
                      buttonSize,
                      sequenceArrowStyle,
                    )}
                    className="sequence-arrow"
                    markerEnd={`url(#${sequenceArrowheadMarkerId})`}
                  />
                );
              })}

            {textNotes.map((note) => (
              <text
                key={note.id}
                x={note.x}
                y={note.y}
                textAnchor={note.anchor}
                className={`free-text-note ${fontClass(note.font)}`}
                style={{ fontSize: note.fontSize, fill: note.color }}
              >
                {splitMultilineText(note.text).map((line, index) => (
                  <tspan
                    key={index}
                    x={note.x}
                    dy={index === 0 ? 0 : note.fontSize * 1.25}
                  >
                    {line || " "}
                  </tspan>
                ))}
              </text>
            ))}
          </svg>
        </div>
      </section>
    </main>
  );
}

export default App;
