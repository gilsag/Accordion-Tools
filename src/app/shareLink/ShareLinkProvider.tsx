import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useScaleFinder } from "../../features/scaleFinder/scaleFinderContext";
import {
  useStradellaChordFinder,
  useStradellaChordFinderOutput,
} from "../../features/stradellaChordFinder/stradellaChordFinderContext";
import { useTrebleChordFinder } from "../../features/trebleChordFinder/trebleChordFinderContext";
import {
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformNotices,
  usePlatformSettings,
  usePlatformTools,
} from "../platform/platformContexts";
import { toolOfferedOn } from "../toolRegistry";
import { ROOT_POSITION_BASS } from "../../features/stradellaChordFinder/engine/harmonicIdentity";
import {
  decodeShareLink,
  encodeShareLink,
  SHARED_TOOLS,
  type SharedTool,
  type SharedView,
} from "./shareLink";
import { ShareLinkContext } from "./shareLinkContext";

const isSharedTool = (tool: string | null): tool is SharedTool =>
  tool !== null && tool in SHARED_TOOLS;

/** Opens a shared link once startup is done, and builds links to the current
 * view. The link's values are shown over the person's own settings without
 * saving them (`holdSession`), and the query string is removed at once, so a
 * reload returns to their own setup unless they changed something. */
export function ShareLinkProvider({ children }: { children: ReactNode }) {
  const registry = usePlatformSettings();
  const instrument = usePlatformInstrument();
  const navigation = usePlatformNavigation();
  const tools = usePlatformTools();
  const { t } = usePlatformLanguage();
  const { notify } = usePlatformNotices();
  const stradella = useStradellaChordFinder();
  const { stradellaChordFinderRealizations: realizations } = useStradellaChordFinderOutput();
  const treble = useTrebleChordFinder();
  const scale = useScaleFinder();
  // The values used by callbacks that outlive a render.
  const current = useRef({ navigation, tools, stradella, scale });
  useLayoutEffect(() => {
    current.current = { navigation, tools, stradella, scale };
  });
  const pendingRealization = useRef<{ root: string; index: number } | null>(null);
  // A view whose settings are applied and whose tool is still to open.
  const [opening, setOpening] = useState<SharedView | null>(null);

  useEffect(() => {
    const view = decodeShareLink(window.location.search);
    if (!view) return;
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.hash,
    );
    return registry.whenStarted(() => {
      registry.holdSession();
      registry.applyImported(view.settings);
      setOpening(view);
    });
    // Startup runs once; the link is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new instrument layout clears the Finders' results once its render is
  // committed, so the tool opens after that.
  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => {
      openTool(opening, current.current, pendingRealization);
      setOpening(null);
    });
    return () => window.clearTimeout(timer);
  }, [opening]);

  // The search resets the realization whenever its inputs change, so the
  // shared one is chosen once the results for the shared chord exist.
  useEffect(() => {
    const pending = pendingRealization.current;
    if (!pending || realizations.length === 0) return;
    if (stradella.stradellaChordFinderRoot !== pending.root) return;
    pendingRealization.current = null;
    const timer = window.setTimeout(() =>
      current.current.stradella.setStradellaChordFinderRealizationIndex(
        Math.min(pending.index, realizations.length - 1),
      ),
    );
    return () => window.clearTimeout(timer);
  }, [realizations, stradella.stradellaChordFinderRoot]);

  function shareUrl() {
    const open = navigation.activeToolSection;
    const tool =
      navigation.workspaceMode === "accordion" &&
      isSharedTool(open) &&
      toolOfferedOn(open, instrument.side)
        ? open
        : null;
    const query = encodeShareLink({
      side: instrument.side,
      basses: instrument.basses,
      trebleLayout: instrument.trebleLayout,
      trebleRows: instrument.trebleRows,
      trebleSize: instrument.trebleSize,
      pianoTrebleRange: instrument.pianoTrebleRange,
      tool,
      stradella: {
        root: stradella.stradellaChordFinderRoot,
        pattern: stradella.stradellaChordFinderPattern,
        bass:
          stradella.stradellaChordFinderRequestedBass === stradella.stradellaChordFinderRoot
            ? ROOT_POSITION_BASS
            : stradella.stradellaChordFinderRequestedBass,
        realization: stradella.stradellaChordFinderRealizationIndex + 1,
        maxButtons: stradella.finderMaxButtons,
        spanColumns: stradella.finderSpanColumns,
        mode: stradella.stradellaChordFinderMode,
        minimumNominalGap: stradella.stradellaMinimumNominalGap,
      },
      treble: {
        root: treble.chordFinderRoot,
        pattern: treble.chordFinderPattern,
        inversion: treble.chordFinderInversion,
        octave: treble.chordFinderOctave,
      },
      scale: {
        root: scale.scaleFinderRoot,
        pattern: scale.scaleFinderPattern,
        rowLimit: scale.scaleFinderRowLimit,
      },
    });
    return `${window.location.origin}${import.meta.env.BASE_URL}${query}`;
  }

  async function copyShareLink() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      notify(t("ui.linkCopied"), "info");
    } catch {
      notify(t("ui.linkNotCopied", { url }));
    }
  }

  return (
    <ShareLinkContext.Provider value={{ shareUrl, copyShareLink }}>
      {children}
    </ShareLinkContext.Provider>
  );
}

type OpenPorts = {
  navigation: ReturnType<typeof usePlatformNavigation>;
  tools: ReturnType<typeof usePlatformTools>;
  stradella: ReturnType<typeof useStradellaChordFinder>;
  scale: ReturnType<typeof useScaleFinder>;
};

/** The part of a shared view that is not settings: the open Finder and the
 * Stradella Chord Finder's chord, through the tools' own setters. */
function openTool(
  view: SharedView,
  { navigation, tools, stradella, scale }: OpenPorts,
  pendingRealization: { current: { root: string; index: number } | null },
) {
  if (view.stradella) {
    const chord = view.stradella;
    stradella.setStradellaChordFinderRoot(chord.root);
    stradella.setStradellaChordFinderPattern(chord.pattern);
    stradella.setStradellaChordFinderRequestedBass(chord.bass);
    if (chord.maxButtons !== undefined) stradella.setFinderMaxButtons(chord.maxButtons);
    if (chord.spanColumns !== undefined) stradella.setFinderSpanColumns(chord.spanColumns);
    if (chord.realization > 1)
      pendingRealization.current = { root: chord.root, index: chord.realization - 1 };
  }
  if (view.tool) {
    navigation.setWorkspaceMode("accordion");
    navigation.setLeftPanelMode("tools");
    if (navigation.activeToolSection !== view.tool) tools.toggleTool(view.tool);
    if (view.tool === "scaleFinder") scale.setScaleFinderActive(true);
  }
}
