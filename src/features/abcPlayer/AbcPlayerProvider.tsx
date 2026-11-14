import { useEffect, useRef, type ReactNode } from "react";
import { usePlatformNavigation, usePlatformTools } from "../../app/platform/platformContexts";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { AbcPlayerContext } from "./abcPlayerContext";
import { useAbcPlayerState } from "./useAbcPlayer";

/** Two-voice tune the ABC Player loads the first time it opens empty. */
const DEFAULT_ABC_EXAMPLE = "happy-birthday";

/** Owns the ABC Player's editor, example choice, tempo, transport position
 * mapping preferences and score visibility. Its playback still runs in the
 * application controller, which registers the player's stop command. */
export function AbcPlayerProvider({ children }: { children: ReactNode }) {
  const state = useAbcPlayerState();
  const { activeToolSection } = usePlatformNavigation();
  const { coordinator } = usePlatformTools();
  useOwnedSettings("abcPlayer", state);
  const { setAbcRenderedNotationVisible } = state;
  useToolHandle("abcPlayer", { hideScore: () => setAbcRenderedNotationVisible(false) });
  function toggleAbcNotation() {
    setAbcRenderedNotationVisible((current) => !current);
    coordinator.scoreToggled("abcPlayer");
  }
  // Closing the player hides its score.
  useEffect(() => {
    if (activeToolSection !== "abcPlayer") setAbcRenderedNotationVisible(false);
  }, [activeToolSection, setAbcRenderedNotationVisible]);

  /* The first time the ABC Player opens with nothing loaded, it loads Happy
   * Birthday, a two-voice tune, so both hands are shown and heard right away.
   * Only once per visit: after Clear ABC the editor stays empty. */
  const { abcText, abcExampleOptions, loadAbcExample } = state;
  const defaultTuneLoaded = useRef(false);
  useEffect(() => {
    if (defaultTuneLoaded.current || activeToolSection !== "abcPlayer") return;
    if (abcText.trim()) {
      defaultTuneLoaded.current = true;
      return;
    }
    if (!abcExampleOptions.some((option) => option.value === DEFAULT_ABC_EXAMPLE)) return;
    defaultTuneLoaded.current = true;
    void loadAbcExample(DEFAULT_ABC_EXAMPLE);
  }, [activeToolSection, abcText, abcExampleOptions, loadAbcExample]);

  return (
    <AbcPlayerContext.Provider value={{ ...state, toggleAbcNotation }}>
      {children}
    </AbcPlayerContext.Provider>
  );
}
