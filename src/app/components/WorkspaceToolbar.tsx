import { useEffect, useRef } from "react";
import type { Side, LeftPanelMode, DownloadFormat } from "../../types";
import type { useLanguageSettings } from "../../settings/useLanguageSettings";
import type { ToolSection, WorkspaceMode } from "../toolRegistry";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";

/** Presentational toolbar. Callbacks must retain App's stop/cancel and reset ordering. */
export type WorkspaceToolbarProps = {
  t: ReturnType<typeof useLanguageSettings>["t"];
  workspaceMode: WorkspaceMode;
  side: Side;
  leftPanelMode: LeftPanelMode;
  activeToolSection: ToolSection;
  onSelectStradella: () => void;
  onSelectTreble: () => void;
  onSelectHarmony: () => void;
  onShowSettings: () => void;
  onShowTools: () => void;
  onToggleFocus: () => void;
  bassPatternEvents: readonly unknown[];
  bassPatternRenderedNotationVisible: boolean;
  onToggleBassPatternNotation: () => void;
  harmonyRecordedProgression: readonly unknown[];
  harmonyRecordedNotationVisible: boolean;
  onToggleHarmonyRecordedNotation: () => void;
  harmonyProgressionPlayable: boolean;
  harmonyProgressionNotationVisible: boolean;
  onToggleHarmonyProgressionNotation: () => void;
  abcText: string;
  abcRenderedNotationVisible: boolean;
  onToggleAbcNotation: () => void;
  sequenceStepsWithButtons: readonly unknown[];
  sequenceRenderedNotationVisible: boolean;
  onToggleSequenceNotation: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearWork: () => void;
  onRestoreToolDefaults: () => void;
  downloadFormat: DownloadFormat;
  setDownloadFormat: (format: DownloadFormat) => void;
  onDownloadDiagram: () => void;
};

export function WorkspaceToolbar({
  t, workspaceMode, side, leftPanelMode, activeToolSection,
  onSelectStradella, onSelectTreble, onSelectHarmony, onShowSettings, onShowTools, onToggleFocus,
  bassPatternEvents, bassPatternRenderedNotationVisible, onToggleBassPatternNotation,
  harmonyRecordedProgression, harmonyRecordedNotationVisible, onToggleHarmonyRecordedNotation,
  harmonyProgressionPlayable, harmonyProgressionNotationVisible, onToggleHarmonyProgressionNotation,
  abcText, abcRenderedNotationVisible, onToggleAbcNotation,
  sequenceStepsWithButtons, sequenceRenderedNotationVisible, onToggleSequenceNotation,
  soundEnabled, onToggleSound, onClearWork, onRestoreToolDefaults,
  downloadFormat, setDownloadFormat, onDownloadDiagram,
}: WorkspaceToolbarProps) {
  const resetMenuRef = useRef<HTMLDetailsElement | null>(null);
  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (resetMenuRef.current?.open && !resetMenuRef.current.contains(event.target as Node))
        resetMenuRef.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && resetMenuRef.current?.open) {
        resetMenuRef.current.open = false;
        resetMenuRef.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  return (
        <div className="topbar">
          <button
            className={`topbar-button ${workspaceMode === "accordion" && side === "stradella" ? "active" : ""}`}
            onClick={onSelectStradella}
          >
            {t("nav.stradella")}
          </button>

          <button
            className={`topbar-button ${workspaceMode === "accordion" && side === "treble" ? "active" : ""}`}
            onClick={onSelectTreble}
          >
            {t("nav.treble")}
          </button>

          <button
            className={`topbar-button ${workspaceMode === "harmony" ? "active" : ""}`}
            onClick={onSelectHarmony}
          >
            {t("nav.harmony")}
          </button>

          <span className="topbar-separator" />

          <button
            className={`topbar-button ${leftPanelMode === "settings" ? "active" : ""}`}
            onClick={onShowSettings}
          >
            {t("nav.settings")}
          </button>

          <button
            className={`topbar-button ${leftPanelMode === "tools" ? "active" : ""}`}
            onClick={onShowTools}
          >
            {t("nav.tools")}
          </button>

          <button
            className={`topbar-button ${leftPanelMode === "hidden" ? "active" : ""}`}
            onClick={onToggleFocus}
            title={t("nav.focusHint")}
          >
            {leftPanelMode === "hidden" ? t("nav.showControls") : t("nav.focusDiagram")}
          </button>

          {workspaceMode === "accordion" &&
            side === "stradella" &&
            activeToolSection === "bassPatternPlayer" &&
            bassPatternEvents.length > 0 && (
              <>
                <button
                  className={`topbar-button ${bassPatternRenderedNotationVisible ? "active" : ""}`}
                  onClick={onToggleBassPatternNotation}
                >
                  {bassPatternRenderedNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
                </button>
              </>
            )}

          {workspaceMode === "harmony" && harmonyRecordedProgression.length > 0 && (
            <button
              className={`topbar-button ${harmonyRecordedNotationVisible ? "active" : ""}`}
              onClick={onToggleHarmonyRecordedNotation}
            >
              {harmonyRecordedNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
            </button>
          )}

          {workspaceMode === "accordion" &&
            side === "stradella" &&
            activeToolSection === "progressionAssistant" &&
            harmonyProgressionPlayable && (
              <button
                className={`topbar-button ${harmonyProgressionNotationVisible ? "active" : ""}`}
                onClick={onToggleHarmonyProgressionNotation}
              >
                {harmonyProgressionNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
              </button>
            )}

          {workspaceMode === "accordion" && activeToolSection === "abcPlayer" && abcText.trim() && (
            <button
              className={`topbar-button ${abcRenderedNotationVisible ? "active" : ""}`}
              onClick={onToggleAbcNotation}
            >
              {abcRenderedNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
            </button>
          )}

          {workspaceMode === "accordion" && activeToolSection === "sequences" &&
            sequenceStepsWithButtons.length > 0 && (
              <button
                className={`topbar-button ${sequenceRenderedNotationVisible ? "active" : ""}`}
                onClick={onToggleSequenceNotation}
              >
                {sequenceRenderedNotationVisible ? t("ui.hideNotation") : t("ui.showNotation")}
              </button>
            )}

          <span className="topbar-spacer" />

          <button
            className={`topbar-button ${soundEnabled ? "active" : ""}`}
            onClick={onToggleSound}
          >
            {soundEnabled ? t("ui.soundOn") : t("ui.soundOff")}
          </button>

          <details ref={resetMenuRef} className="reset-menu">
            <summary className="topbar-button reset-button" title={t("ui.resetScope")}>
              {t("ui.reset")} <span aria-hidden="true">▾</span>
            </summary>
            <div className="reset-menu-options">
              <button type="button" onClick={(event) => {
                onClearWork();
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}>{t("ui.clearCurrentWork")}</button>
              {(workspaceMode === "harmony" || (side === "stradella" && activeToolSection === "stradellaChordFinder")) && (
                <button type="button" onClick={(event) => {
                  onRestoreToolDefaults();
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }}>{t("ui.restoreToolDefaults")}</button>
              )}
            </div>
          </details>

          <span className="topbar-after-reset-space" aria-hidden="true" />

          <div className="topbar-format-choice">
            <SegmentedChoice label={t("ui.downloadFormat")} value={downloadFormat} onChange={setDownloadFormat}
              options={[{ value: "svg", label: "SVG" }, { value: "png", label: "PNG" }]} />
          </div>

          <button
            className="topbar-button download-button"
            onClick={onDownloadDiagram}
          >
            {t("ui.downloadKind", { kind: downloadFormat.toUpperCase() })}
          </button>
        </div>
  );
}
