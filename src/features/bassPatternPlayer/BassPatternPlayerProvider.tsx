import { useEffect, type ReactNode } from "react";
import {
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformTools,
} from "../../app/platform/platformContexts";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { BassPatternPlayerContext } from "./bassPatternPlayerContext";
import { useBassPatternState } from "./useBassPatternPlayer";

/** Owns the bass pattern and chord progression libraries, the pattern editor,
 * custom patterns and the player's preferences. The Rhythm Trainer and the
 * Progression Assistant read the libraries from here. Playback still runs in
 * the application controller, which registers the player's stop command. */
export function BassPatternPlayerProvider({ children }: { children: ReactNode }) {
  const { t } = usePlatformLanguage();
  const state = useBassPatternState(t);
  useOwnedSettings("bassPatternPlayer", state);
  const { activeToolSection } = usePlatformNavigation();
  const { coordinator } = usePlatformTools();
  const { setBassPatternRenderedNotationVisible } = state;
  useToolHandle("bassPatternPlayer", {
    hideScore: () => setBassPatternRenderedNotationVisible(false),
  });
  function toggleBassPatternNotation() {
    setBassPatternRenderedNotationVisible((current) => !current);
    coordinator.scoreToggled("bassPatternPlayer");
  }
  // Closing the player hides its score.
  useEffect(() => {
    if (activeToolSection !== "bassPatternPlayer") setBassPatternRenderedNotationVisible(false);
  }, [activeToolSection, setBassPatternRenderedNotationVisible]);
  return (
    <BassPatternPlayerContext.Provider value={{ ...state, toggleBassPatternNotation }}>
      {children}
    </BassPatternPlayerContext.Provider>
  );
}
