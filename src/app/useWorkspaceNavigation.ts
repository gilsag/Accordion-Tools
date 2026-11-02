import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { LeftPanelMode, Side } from "../types";
import { toolDestination, type ToolId, type ToolSection, type WorkspaceMode } from "./toolRegistry";

export type SettingsSection = "instrument" | "title" | "appearance" | "notation" |
  "musicNotation" | "sound" | "harmony" | "about" | null;

/** Workspace/UI navigation; instrument layout stays with the instrument hook.
 * Musical tool state, playback cancellation and selection transfer remain owned
 * by their feature controllers and the App command handlers, respectively.
 */
export function useWorkspaceNavigation(side: Side, setSide: Dispatch<SetStateAction<Side>>) {
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>("tools");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("accordion");
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>(null);
  const [activeToolSection, setActiveToolSection] = useState<ToolSection>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Preserve the original settings-close behavior on workspace/instrument changes.
    setActiveSettingsSection(null);
  }, [workspaceMode, side]);

  function toggleSettingsSection(section: Exclude<SettingsSection, null>) {
    setActiveSettingsSection(current => current === section ? null : section);
  }

  function toggleToolSection(tool: ToolId) {
    setWorkspaceMode(toolDestination(tool).workspace);
    // Historical accordion behavior: only Progression Assistant forces Stradella.
    if (tool === "progressionAssistant") setSide("stradella");
    setActiveToolSection(current => current === tool ? null : tool);
  }

  /** Command navigation, unlike accordion toggling, always exposes its target.
   * The caller continues to own any cross-tool data transfer and audio stops.
   */
  function navigateToTool(tool: ToolId, options: { side?: Side; showTools?: boolean } = {}) {
    const destination = toolDestination(tool);
    setWorkspaceMode(destination.workspace);
    const nextSide = options.side ?? destination.defaultSide;
    if (nextSide) setSide(nextSide);
    if (options.showTools !== false) setLeftPanelMode("tools");
    setActiveToolSection(tool);
  }

  function selectAccordionSide(nextSide: Side) {
    setWorkspaceMode("accordion");
    setSide(nextSide);
  }

  function setPanel(mode: Exclude<LeftPanelMode, "hidden">) {
    setLeftPanelMode(current => current === mode ? "hidden" : mode);
  }

  function toggleFocusPanel() {
    setLeftPanelMode(current => current === "hidden"
      ? (workspaceMode === "harmony" ? "tools" : "settings") : "hidden");
  }

  return {
    leftPanelMode, setLeftPanelMode, workspaceMode, setWorkspaceMode,
    activeSettingsSection, setActiveSettingsSection, activeToolSection, setActiveToolSection,
    toggleSettingsSection, toggleToolSection, navigateToTool,
    selectAccordionSide, setPanel, toggleFocusPanel,
  };
}
