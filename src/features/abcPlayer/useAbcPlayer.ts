import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AbcStradellaMode, AbcTrebleChordSymbolsMode, DiagramButton, Side } from "../../types";
import type { AbcParseResult, MappedAbcEvent } from "../../tools/abcPlayerTools";
import { loadAbcEngine } from "./abcEngineLoader";

/** Exact parsed result of an empty ABC editor in the established abcjs engine.
 * The lightweight initial result avoids importing the parser on app startup. */
const EMPTY_ABC_RESULT: AbcParseResult = {
  events: [], voiceIds: ["1"], title: "Untitled ABC tune", tempoBpm: 180,
  key: "C", keyTonicPitchClass: "C",
  errors: ["No playable notes or chord symbols were found in this ABC text."],
};

type AbcExampleOption = {
  value: string;
  label: string;
  file: string;
};

const ABC_EXAMPLE_PLACEHOLDER: AbcExampleOption = {
  value: "",
  label: "Choose example…",
  file: "",
};

/** Owns ABC editor, example catalog, mapping preferences and transport UI state.
 * The shared Web Audio engine, timer cancellation, and cross-tool exclusivity
 * remain in App until the separate playback-coordinator migration.
 * Keep these original setters stable for the existing JSON settings adapter.
 */
export function useAbcPlayerState() {
  const [abcText, setAbcText] = useState("");
  const [abcEditorExpanded, setAbcEditorExpanded] = useState(false);
  const [abcFileName, setAbcFileName] = useState("");
  const [abcExampleValue, setAbcExampleValue] = useState("");
  const [abcExampleOptions, setAbcExampleOptions] = useState<AbcExampleOption[]>([ABC_EXAMPLE_PLACEHOLDER]);
  const [abcTempoBpm, setAbcTempoBpm] = useState(80);
  const [abcPositionBeat, setAbcPositionBeat] = useState(0);
  const [abcPlaybackState, setAbcPlaybackState] = useState<
    "stopped" | "playing" | "paused"
  >("stopped");
  const [abcActiveButtonIds, setAbcActiveButtonIds] = useState<string[]>([]);
  const [abcStradellaMode, setAbcStradellaMode] =
    useState<AbcStradellaMode>("bass-notes-and-chord-symbols");
  const [abcTrebleChordSymbolsMode, setAbcTrebleChordSymbolsMode] =
    useState<AbcTrebleChordSymbolsMode>("ignore");
  const [abcRenderedNotationVisible, setAbcRenderedNotationVisible] =
    useState(false);
  const abcNotationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAbcExampleManifest() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}abc/examples.json`, {
          cache: "no-store",
        });
        if (!response.ok) return;

        const manifest = (await response.json()) as unknown;
        if (cancelled || !Array.isArray(manifest)) return;

        const examples = manifest
          .map((entry): AbcExampleOption | null => {
            if (!entry || typeof entry !== "object") return null;
            const value = (entry as { value?: unknown }).value;
            const label = (entry as { label?: unknown }).label;
            const file = (entry as { file?: unknown }).file;
            if (
              typeof value !== "string" ||
              typeof label !== "string" ||
              typeof file !== "string" ||
              !value ||
              !label ||
              !file
            ) {
              return null;
            }
            return { value, label, file };
          })
          .filter((entry): entry is AbcExampleOption => entry !== null);

        if (examples.length > 0) {
          setAbcExampleOptions([ABC_EXAMPLE_PLACEHOLDER, ...examples]);
        }
      } catch {
        /* The fallback ABC example list is used when the manifest is unavailable. */
      }
    }

    loadAbcExampleManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadAbcExample(exampleValue: string) {
    const example = abcExampleOptions.find(
      (option) => option.value === exampleValue,
    );
    setAbcExampleValue(exampleValue);
    if (!example || !example.file) return;

    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}${example.file}`,
      );
      if (!response.ok) throw new Error(`Could not load ${example.file}`);
      const text = await response.text();
      setAbcText(text);
      setAbcFileName(example.label);
      setAbcPositionBeat(0);
      setAbcActiveButtonIds([]);
      setAbcPlaybackState("stopped");
    } catch (error) {
      setAbcText(`% Could not load example: ${example.label}
% ${String(error)}`);
      setAbcFileName("");
      setAbcPositionBeat(0);
      setAbcActiveButtonIds([]);
      setAbcPlaybackState("stopped");
    }
  }

  return {
    abcText, setAbcText, abcEditorExpanded, setAbcEditorExpanded,
    abcFileName, setAbcFileName, abcExampleValue, setAbcExampleValue,
    abcExampleOptions, abcTempoBpm, setAbcTempoBpm,
    abcPositionBeat, setAbcPositionBeat, abcPlaybackState, setAbcPlaybackState,
    abcActiveButtonIds, setAbcActiveButtonIds, abcStradellaMode, setAbcStradellaMode,
    abcTrebleChordSymbolsMode, setAbcTrebleChordSymbolsMode,
    abcRenderedNotationVisible, setAbcRenderedNotationVisible,
    abcNotationRef, loadAbcExample,
  };
}

export type AbcPlayerResultInput = {
  abcText: string;
  abcPlaybackState: "stopped" | "playing" | "paused";
  setAbcTempoBpm: Dispatch<SetStateAction<number>>;
  abcActiveButtonIds: string[];
  abcStradellaMode: AbcStradellaMode;
  abcTrebleChordSymbolsMode: AbcTrebleChordSymbolsMode;
  side: Side;
  isTrebleLikeSide: boolean;
  buttons: DiagramButton[];
};

/** The app loads the existing synchronous parser and mapping functions on the
 * first nonempty score. The canonical tools/abcPlayerTools public API is not
 * changed: existing direct callers and musical tests remain synchronous. */
export function useAbcPlayerResults({
  abcText, abcPlaybackState, setAbcTempoBpm, abcActiveButtonIds,
  abcStradellaMode, abcTrebleChordSymbolsMode, side, isTrebleLikeSide, buttons,
}: AbcPlayerResultInput) {
  const [engine, setEngine] = useState<Awaited<ReturnType<typeof loadAbcEngine>> | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  useEffect(() => {
    if (!abcText.trim() || engine) return;
    let active = true;
    void loadAbcEngine().then(module => {
      if (active) { setEngine(module); setEngineError(null); }
    }).catch(error => {
      if (active) setEngineError(error instanceof Error ? error.message : String(error));
    });
    return () => { active = false; };
  }, [abcText, engine]);

  const abcParseResult = useMemo(() => {
    if (!abcText.trim()) return EMPTY_ABC_RESULT;
    if (!engine) return {
      ...EMPTY_ABC_RESULT,
      errors: engineError ? [`Could not load ABC parser: ${engineError}`] : [],
    };
    return engine.parseAbc(abcText);
  }, [abcText, engine, engineError]);

  useEffect(() => {
    if (abcPlaybackState !== "playing") {
      setAbcTempoBpm(abcParseResult.tempoBpm);
    }
  }, [abcParseResult.tempoBpm, abcPlaybackState, setAbcTempoBpm]);

  const abcPlayableEvents = useMemo(() => {
    if (!abcText.trim()) return [];
    if (side === "stradella") {
      return engine ? engine.abcEventsForStradellaSide(abcParseResult.events) : [];
    }
    if (isTrebleLikeSide) {
      return engine ? engine.abcEventsForTrebleSide(abcParseResult.events) : [];
    }
    return [];
  }, [abcParseResult.events, abcText, engine, isTrebleLikeSide, side]);

  const abcMappedEvents = useMemo<MappedAbcEvent[]>(() => {
    if (abcPlayableEvents.length === 0) return [];
    if (side === "stradella") {
      return engine!.mapAbcEventsToStradellaButtons(
        buttons,
        abcPlayableEvents,
        abcParseResult.keyTonicPitchClass,
        abcStradellaMode,
      );
    }
    if (isTrebleLikeSide) {
      return engine!.mapAbcEventsToTrebleButtons(
        buttons,
        abcPlayableEvents,
        abcTrebleChordSymbolsMode === "play",
      );
    }
    return [];
  }, [
    abcPlayableEvents,
    engine,
    abcParseResult.keyTonicPitchClass,
    abcStradellaMode,
    abcTrebleChordSymbolsMode,
    buttons,
    isTrebleLikeSide,
    side,
  ]);

  const abcTotalBeats = useMemo(
    () => engine ? engine.totalAbcBeats(abcPlayableEvents) : 0,
    [abcPlayableEvents, engine],
  );
  const abcMissingPitchText = useMemo(
    () => engine ? engine.abcMissingNotes(abcMappedEvents).join(", ") : "",
    [abcMappedEvents, engine],
  );

  const abcActiveButtonIdSet = useMemo(
    () => new Set(abcActiveButtonIds),
    [abcActiveButtonIds],
  );
  return {
    abcParseResult, abcPlayableEvents, abcMappedEvents,
    abcTotalBeats, abcMissingPitchText, abcActiveButtonIdSet,
  };
}
