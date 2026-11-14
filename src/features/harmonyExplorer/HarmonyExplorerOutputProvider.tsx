import type { ReactNode } from "react";
import { usePlatformLanguage } from "../../app/platform/platformContexts";
import { HarmonyExplorerOutputContext, useHarmonyExplorer } from "./harmonyExplorerContext";
import { useHarmonyExplorerResults } from "./useHarmonyExplorer";

/** The circle's sectors, counts, scale and explanation for the current
 * reference family, related family and filters. */
export function HarmonyExplorerOutputProvider({ children }: { children: ReactNode }) {
  const { language, t } = usePlatformLanguage();
  const state = useHarmonyExplorer();
  const value = useHarmonyExplorerResults({ ...state, language, t });
  return (
    <HarmonyExplorerOutputContext.Provider value={value}>
      {children}
    </HarmonyExplorerOutputContext.Provider>
  );
}
