import { useEffect, type ReactNode } from "react";
import { usePlatformNavigation, usePlatformTools } from "../../app/platform/platformContexts";
import { useOwnedSettings } from "../../app/platform/useOwnedSettings";
import { useToolHandle } from "../../app/platform/useToolHandle";
import { ProgressionAssistantContext } from "./progressionAssistantContext";
import { useHarmonyProgressionState } from "./useProgressionAssistant";

/** Owns the Progression Assistant's progression, optimization preferences,
 * pinned realizations, preview, path and score state. Its optimized plan needs
 * the generated Stradella buttons, so its output provider derives it. */
export function ProgressionAssistantProvider({ children }: { children: ReactNode }) {
  const state = useHarmonyProgressionState();
  const { activeToolSection } = usePlatformNavigation();
  useOwnedSettings("progressionAssistant", state);
  const { coordinator } = usePlatformTools();
  function toggleHarmonyProgressionNotation() {
    state.setHarmonyProgressionNotationVisible((current) => !current);
    coordinator.scoreToggled("progressionAssistant");
  }
  useToolHandle("progressionAssistant", {
    hideScore: () => state.setHarmonyProgressionNotationVisible(false),
    // Its players run in the sound engine; stopping clears the buttons it lit.
    stop() {
      state.setHarmonyProgressionActiveButtonIds([]);
      state.setHarmonyProgressionPulseSilent(false);
    },
    resetWork(workspace) {
      state.setHarmonyProgressionPreviewIndex(null);
      state.setHarmonyProgressionNoteStepId(null);
      state.setHarmonyProgressionActiveButtonIds([]);
      if (workspace === "harmony") state.setHarmonyProgressionPulseSilent(false);
    },
  });

  // Closing the assistant hides its score and the buttons it lit.
  const {
    setHarmonyProgressionNotationVisible,
    setHarmonyProgressionActiveButtonIds,
    setHarmonyProgressionPulseSilent,
  } = state;
  useEffect(() => {
    if (activeToolSection !== "progressionAssistant") {
      setHarmonyProgressionNotationVisible(false);
      setHarmonyProgressionActiveButtonIds([]);
      setHarmonyProgressionPulseSilent(false);
    }
  }, [
    activeToolSection,
    setHarmonyProgressionNotationVisible,
    setHarmonyProgressionActiveButtonIds,
    setHarmonyProgressionPulseSilent,
  ]);

  return (
    <ProgressionAssistantContext.Provider value={{ ...state, toggleHarmonyProgressionNotation }}>
      {children}
    </ProgressionAssistantContext.Provider>
  );
}
