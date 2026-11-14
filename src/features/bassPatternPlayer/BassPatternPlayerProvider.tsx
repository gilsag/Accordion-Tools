import type { ReactNode } from "react";
import { usePlatformLanguage } from "../../app/platform/platformContexts";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { BassPatternPlayerContext } from "./bassPatternPlayerContext";
import { useBassPatternState } from "./useBassPatternPlayer";

/** Owns the bass pattern and chord progression libraries, the pattern editor,
 * custom patterns and the player's preferences. The Rhythm Trainer and the
 * Progression Assistant read the libraries from here. Playback still runs in
 * the application controller, which also registers the player's handle. */
export function BassPatternPlayerProvider({ children }: { children: ReactNode }) {
  const { t } = usePlatformLanguage();
  const state = useBassPatternState(t);
  useOwnedSettings("bassPatternPlayer", state);
  return (
    <BassPatternPlayerContext.Provider value={state}>{children}</BassPatternPlayerContext.Provider>
  );
}
