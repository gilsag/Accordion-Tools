import { useEffect, useMemo, useRef, useState } from "react";
import type { BassPatternChordVoicing, DiagramButton, Side } from "../../types";
import { bassPatternMissingItems, makeBassPatternEvents, totalBassPatternBeats,
  validateBassPatternLibrary, type BassPatternDefinition,
  type BassPatternLibrary, type BassPatternPlaybackEvent,
  type ChordProgressionDefinition } from "../../tools/bassPatternPlayerTools";
import type { translate } from "../../i18n/catalog";

type Translator = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => string;

/** Owns user-editable and bundled pattern libraries, including the historical
 * localStorage key. Shared audio scheduling, download/notation rendering and
 * exclusive tool activation remain application-level responsibilities.
 */
export function useBassPatternState(t: Translator) {

  const [builtInBassPatternDefinitions, setBuiltInBassPatternDefinitions] =
    useState<BassPatternDefinition[]>([]);
  const [customBassPatternDefinitions, setCustomBassPatternDefinitions] =
    useState<BassPatternDefinition[]>(() => {
      try {
        const stored = window.localStorage.getItem("accordionTools.customBassPatterns.v2");
        if (!stored) return [];
        const parsed: unknown = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed as BassPatternDefinition[] : [];
      } catch {
        // Ignore malformed local custom pattern data.
        return [];
      }
    });
  const bassPatternDefinitions = useMemo(
    () => [...builtInBassPatternDefinitions, ...customBassPatternDefinitions],
    [builtInBassPatternDefinitions, customBassPatternDefinitions],
  );
  const [chordProgressionDefinitions, setChordProgressionDefinitions] =
    useState<ChordProgressionDefinition[]>([]);
  const [bassPatternId, setBassPatternId] = useState("polka");
  const [chordProgressionId, setChordProgressionId] = useState("i-iv-v-i");
  const [bassPatternRoot, setBassPatternRoot] = useState("C");
  const [bassPatternTempoBpm, setBassPatternTempoBpm] = useState(80);
  const [bassPatternChordVoicing, setBassPatternChordVoicing] =
    useState<BassPatternChordVoicing>("simple");
  const [bassPatternBarsPerChord, setBassPatternBarsPerChord] = useState(2);
  const [bassPatternLoopMode, setBassPatternLoopMode] = useState<
    "once" | "fixed" | "infinite"
  >("fixed");
  const [bassPatternLoopCount, setBassPatternLoopCount] = useState(2);
  const [bassPatternExportFormat, setBassPatternExportFormat] = useState<
    "abc" | "midi" | "lilypond"
  >("abc");
  const [bassPatternEditorExpanded, setBassPatternEditorExpanded] =
    useState(false);
  const [
    bassPatternRenderedNotationVisible,
    setBassPatternRenderedNotationVisible,
  ] = useState(false);
  const [bassPatternValidationErrors, setBassPatternValidationErrors] =
    useState<string[]>([]);
  const [bassPatternEditorText, setBassPatternEditorText] = useState(() =>
    JSON.stringify(
      {
        id: "custom-oom-pah",
        name: "Custom Oom-pah",
        meter: "4/4",
        tags: ["custom"],
        pattern: ">B C A C",
      },
      null,
      2,
    ),
  );
  const [bassPatternEditorMessage, setBassPatternEditorMessage] = useState("");
  const [bassPatternPlaybackState, setBassPatternPlaybackState] = useState<
    "stopped" | "playing"
  >("stopped");
  const [bassPatternActiveButtonIds, setBassPatternActiveButtonIds] = useState<
    string[]
  >([]);
  const bassPatternTimeoutsRef = useRef<number[]>([]);
  const bassPatternPlaybackRunRef = useRef(0);
  const bassPatternNotationRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let cancelled = false;

    async function loadBassPatternData() {
      try {
        const [patternsResponse, progressionsResponse] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}bass-patterns/bass-patterns.json`),
          fetch(
            `${import.meta.env.BASE_URL}chord-progressions/chord-progressions.json`,
          ),
        ]);

        if (!patternsResponse.ok || !progressionsResponse.ok) return;

        const patternLibrary =
          (await patternsResponse.json()) as BassPatternLibrary;
        const progressions =
          (await progressionsResponse.json()) as ChordProgressionDefinition[];
        if (cancelled) return;

        const validationErrors = validateBassPatternLibrary(patternLibrary);
        setBassPatternValidationErrors(validationErrors);

        if (
          validationErrors.length === 0 &&
          patternLibrary.version === 2 &&
          Array.isArray(patternLibrary.patterns) &&
          patternLibrary.patterns.length > 0
        ) {
          const patternsWithLegend = patternLibrary.patterns.map((pattern) => ({
            ...pattern,
            legend: pattern.legend ?? patternLibrary.legend,
          }));
          setBuiltInBassPatternDefinitions(patternsWithLegend);
          setBassPatternId((current) =>
            patternsWithLegend.some((pattern) => pattern.id === current)
              ? current
              : patternsWithLegend[0].id,
          );
        }

        if (Array.isArray(progressions) && progressions.length > 0) {
          setChordProgressionDefinitions(progressions);
          setChordProgressionId((current) =>
            progressions.some((progression) => progression.id === current)
              ? current
              : progressions[0].id,
          );
        }
      } catch (error) {
        setBassPatternValidationErrors([
          error instanceof Error
            ? error.message
            : "Could not load bass pattern files.",
        ]);
        /* Bass pattern files are optional; the rest of the app still works without them. */
      }
    }

    loadBassPatternData();
    return () => {
      cancelled = true;
    };
  }, []);
  const selectedBassPattern = useMemo(
    () => bassPatternDefinitions.find((pattern) => pattern.id === bassPatternId) ?? bassPatternDefinitions[0],
    [bassPatternDefinitions, bassPatternId],
  );
  const bassPatternEditorErrors = useMemo(() => {
    try {
      const candidate = JSON.parse(
        bassPatternEditorText,
      ) as BassPatternDefinition;
      return validateBassPatternLibrary({ version: 2, patterns: [candidate] });
    } catch (error) {
      return [error instanceof Error ? error.message : t("ui.invalidJSON")];
    }
  }, [bassPatternEditorText, t]);

  function saveCustomBassPattern() {
    try {
      const candidate = JSON.parse(
        bassPatternEditorText,
      ) as BassPatternDefinition;
      const errors = validateBassPatternLibrary({
        version: 2,
        patterns: [candidate],
      });
      if (errors.length > 0) {
        setBassPatternEditorMessage(t("ui.cannotSave", { reason: errors[0] }));
        return;
      }
      const nextPatterns = [
        candidate,
        ...customBassPatternDefinitions.filter(
          (pattern) => pattern.id !== candidate.id,
        ),
      ];
      setCustomBassPatternDefinitions(nextPatterns);
      window.localStorage.setItem(
        "accordionTools.customBassPatterns.v2",
        JSON.stringify(nextPatterns),
      );
      setBassPatternId(candidate.id);
      setBassPatternEditorMessage(t("ui.savedCustomPattern", { name: candidate.name }));
    } catch (error) {
      setBassPatternEditorMessage(
        error instanceof Error ? error.message : t("ui.invalidJSON"),
      );
    }
  }

  function removeSelectedCustomBassPattern() {
    if (
      !customBassPatternDefinitions.some(
        (pattern) => pattern.id === bassPatternId,
      )
    )
      return;
    const nextPatterns = customBassPatternDefinitions.filter(
      (pattern) => pattern.id !== bassPatternId,
    );
    setCustomBassPatternDefinitions(nextPatterns);
    window.localStorage.setItem(
      "accordionTools.customBassPatterns.v2",
      JSON.stringify(nextPatterns),
    );
    setBassPatternId(
      (builtInBassPatternDefinitions[0] ?? nextPatterns[0])?.id ?? "",
    );
    setBassPatternEditorMessage(t("ui.removedCustomPattern"));
  }

  function loadSelectedPatternIntoEditor() {
    if (!selectedBassPattern) return;
    setBassPatternEditorText(JSON.stringify(selectedBassPattern, null, 2));
    setBassPatternEditorMessage(t("ui.loadedPatternIntoEditor"));
  }
  return {
    builtInBassPatternDefinitions, setBuiltInBassPatternDefinitions,
    customBassPatternDefinitions, setCustomBassPatternDefinitions,
    bassPatternDefinitions,
    chordProgressionDefinitions, setChordProgressionDefinitions,
    bassPatternId, setBassPatternId,
    chordProgressionId, setChordProgressionId,
    bassPatternRoot, setBassPatternRoot,
    bassPatternTempoBpm, setBassPatternTempoBpm,
    bassPatternChordVoicing, setBassPatternChordVoicing,
    bassPatternBarsPerChord, setBassPatternBarsPerChord,
    bassPatternLoopMode, setBassPatternLoopMode,
    bassPatternLoopCount, setBassPatternLoopCount,
    bassPatternExportFormat, setBassPatternExportFormat,
    bassPatternEditorExpanded, setBassPatternEditorExpanded,
    bassPatternRenderedNotationVisible, setBassPatternRenderedNotationVisible,
    bassPatternValidationErrors, setBassPatternValidationErrors,
    bassPatternEditorText, setBassPatternEditorText,
    bassPatternEditorMessage, setBassPatternEditorMessage,
    bassPatternPlaybackState, setBassPatternPlaybackState,
    bassPatternActiveButtonIds, setBassPatternActiveButtonIds,
    bassPatternTimeoutsRef, bassPatternPlaybackRunRef, bassPatternNotationRef,
    bassPatternEditorErrors, saveCustomBassPattern, removeSelectedCustomBassPattern,
    loadSelectedPatternIntoEditor,
  };
}

/** These selectors use the original engine with original DiagramButton objects.
 * The view may show pattern editor state on any manual, but accompaniment events
 * are generated only for the physical Stradella manual.
 */
export function useBassPatternResults({
  bassPatternDefinitions, bassPatternId, chordProgressionDefinitions, chordProgressionId,
  buttons, side, bassPatternRoot, bassPatternChordVoicing, bassPatternBarsPerChord,
  bassPatternActiveButtonIds,
}: {
  bassPatternDefinitions: BassPatternDefinition[];
  bassPatternId: string;
  chordProgressionDefinitions: ChordProgressionDefinition[];
  chordProgressionId: string;
  buttons: DiagramButton[];
  side: Side;
  bassPatternRoot: string;
  bassPatternChordVoicing: BassPatternChordVoicing;
  bassPatternBarsPerChord: number;
  bassPatternActiveButtonIds: string[];
}) {
  const selectedBassPattern = useMemo(
    () =>
      bassPatternDefinitions.find((pattern) => pattern.id === bassPatternId) ??
      bassPatternDefinitions[0],
    [bassPatternDefinitions, bassPatternId],
  );
  const selectedChordProgression = useMemo(
    () =>
      chordProgressionDefinitions.find(
        (progression) => progression.id === chordProgressionId,
      ) ?? chordProgressionDefinitions[0],
    [chordProgressionDefinitions, chordProgressionId],
  );
  const bassPatternEvents = useMemo<BassPatternPlaybackEvent[]>(() => {
    if (
      side !== "stradella" ||
      !selectedBassPattern ||
      !selectedChordProgression
    )
      return [];
    return makeBassPatternEvents(
      buttons,
      selectedBassPattern,
      selectedChordProgression,
      bassPatternRoot,
      bassPatternChordVoicing,
      bassPatternBarsPerChord,
    );
  }, [
    bassPatternBarsPerChord,
    bassPatternChordVoicing,
    bassPatternRoot,
    buttons,
    selectedBassPattern,
    selectedChordProgression,
    side,
  ]);
  const bassPatternTotalBeats = useMemo(
    () => totalBassPatternBeats(bassPatternEvents),
    [bassPatternEvents],
  );
  const bassPatternMissingText = useMemo(
    () => bassPatternMissingItems(bassPatternEvents).join(", "),
    [bassPatternEvents],
  );
  const bassPatternActiveButtonIdSet = useMemo(
    () => new Set(bassPatternActiveButtonIds), [bassPatternActiveButtonIds],
  );
  return { selectedBassPattern, selectedChordProgression, bassPatternEvents,
    bassPatternTotalBeats, bassPatternMissingText, bassPatternActiveButtonIdSet };
}
