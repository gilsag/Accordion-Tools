import { useEffect, useLayoutEffect, useRef } from "react";
import { useActiveScoreToggle } from "../notation/scoreEntries";
import { NotationIcon, PaneIcon, SettingsIcon, SpeakerIcon, ToolsIcon } from "./toolbarIcons";
import { DownloadMenu, ResetMenu } from "./ToolbarMenus";
import { DOWNLOAD_FORMATS, useDismissibleMenu } from "./toolbarMenuSupport";
import type { Side, LeftPanelMode, DownloadFormat } from "../../types";
import type { useLanguageSettings } from "../../settings/useLanguageSettings";
import type { ToolSection, WorkspaceMode } from "../toolRegistry";
import { useShareLink } from "../shareLink/shareLinkContext";

/** Presentational toolbar. Callbacks must retain App's stop/cancel and reset ordering. */
export type WorkspaceToolbarProps = {
  t: ReturnType<typeof useLanguageSettings>["t"];
  workspaceMode: WorkspaceMode;
  side: Side;
  leftPanelMode: LeftPanelMode;
  activeToolSection: ToolSection;
  inspectorAvailable?: boolean;
  inspectorVisible?: boolean;
  onToggleInspector?: () => void;
  onSelectStradella: () => void;
  onSelectTreble: () => void;
  onSelectHarmony: () => void;
  onShowSettings: () => void;
  onShowTools: () => void;
  onToggleFocus: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearWork: () => void;
  onRestoreToolDefaults: () => void;
  downloadFormat: DownloadFormat;
  setDownloadFormat: (format: DownloadFormat) => void;
  /** Downloads the current diagram in the given format and remembers it. */
  onDownloadDiagram: (format: DownloadFormat) => void;
};

/** A window with its left (controls) or right (results) pane filled. */
/** Switches the toolbar to compact mode when its full form does not fit on one row. */
function fitToolbar(bar: HTMLElement | null) {
  if (!bar) return;
  bar.classList.remove("topbar-compact");
  bar.classList.toggle("topbar-compact", bar.scrollWidth > bar.clientWidth + 1);
}

export function WorkspaceToolbar({
  t,
  workspaceMode,
  side,
  leftPanelMode,
  activeToolSection,
  inspectorAvailable,
  inspectorVisible,
  onToggleInspector,
  onSelectStradella,
  onSelectTreble,
  onSelectHarmony,
  onShowSettings,
  onShowTools,
  onToggleFocus,
  soundEnabled,
  onToggleSound,
  onClearWork,
  onRestoreToolDefaults,
  downloadFormat,
  setDownloadFormat,
  onDownloadDiagram,
}: WorkspaceToolbarProps) {
  const overflowRef = useRef<HTMLDetailsElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  // Compact mode hides the Settings, Tools, notation, Reset and Download
  // labels behind icons. It is chosen by measuring: the full toolbar is laid
  // out on one row first, and compact mode is used only if it overflows. So
  // labels stay whenever they fit, in every language and at every width.
  useLayoutEffect(() => {
    fitToolbar(barRef.current);
  });
  useEffect(() => {
    const bar = barRef.current;
    const host = bar?.parentElement;
    if (!bar || !host) return;
    let frame = 0;
    let lastWidth = -1;
    // Watch the workspace column, not the toolbar, so a change of mode
    // (which can change the toolbar's height) never re-triggers the observer.
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      if (width === lastWidth) return;
      lastWidth = width;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fitToolbar(bar));
    });
    observer.observe(host);
    void document.fonts?.ready.then(() => fitToolbar(bar));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  useDismissibleMenu(overflowRef);
  const { copyShareLink } = useShareLink();
  function closeOverflow() {
    if (overflowRef.current) overflowRef.current.open = false;
  }
  function download(format: DownloadFormat) {
    setDownloadFormat(format);
    onDownloadDiagram(format);
  }
  // Only the Harmony workspace and the Stradella Chord Finder have tool defaults.
  const canRestoreToolDefaults =
    workspaceMode === "harmony" ||
    (side === "stradella" && activeToolSection === "stradellaChordFinder");
  const notationAction = useActiveScoreToggle();
  return (
    <div className="topbar" ref={barRef}>
      {/* One-of-three view switch; styled as a segmented control so it
              reads differently from the panel toggles that follow it. */}
      <div className="topbar-workspace-switch" role="group" aria-label={t("ui.workspaceSwitch")}>
        <button
          type="button"
          className={`topbar-button topbar-primary ${workspaceMode === "accordion" && side === "stradella" ? "active" : ""}`}
          aria-pressed={workspaceMode === "accordion" && side === "stradella"}
          onClick={onSelectStradella}
        >
          {t("nav.stradella")}
        </button>
        <button
          type="button"
          className={`topbar-button topbar-primary ${workspaceMode === "accordion" && side === "treble" ? "active" : ""}`}
          aria-pressed={workspaceMode === "accordion" && side === "treble"}
          onClick={onSelectTreble}
        >
          {t("nav.treble")}
        </button>
        <button
          type="button"
          className={`topbar-button topbar-primary ${workspaceMode === "harmony" ? "active" : ""}`}
          aria-pressed={workspaceMode === "harmony"}
          onClick={onSelectHarmony}
        >
          {t("nav.harmony")}
        </button>
      </div>

      <button type="button" className="topbar-button phone-tools-button" onClick={onShowTools}>
        {t("nav.tools")}
      </button>
      <details ref={overflowRef} className="phone-overflow">
        <summary
          className="topbar-button phone-overflow-toggle"
          aria-label={t("ui.moreActions")}
          title={t("ui.moreActions")}
        >
          <span aria-hidden="true">⋯</span>
        </summary>
        <div className="phone-overflow-menu">
          {inspectorAvailable && (
            <button
              type="button"
              onClick={() => {
                closeOverflow();
                onToggleInspector?.();
              }}
            >
              {t(inspectorVisible ? "ui.hideResults" : "ui.showResults")}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              closeOverflow();
              onShowSettings();
            }}
          >
            {t("nav.settings")}
          </button>
          <button
            type="button"
            onClick={() => {
              closeOverflow();
              onToggleFocus();
            }}
          >
            {leftPanelMode === "hidden" ? t("nav.showControls") : t("nav.focusDiagram")}
          </button>
          {notationAction && (
            <button
              type="button"
              onClick={() => {
                closeOverflow();
                notationAction.toggle();
              }}
            >
              {notationAction.visible ? t("ui.hideNotation") : t("ui.showNotation")}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              closeOverflow();
              onToggleSound();
            }}
          >
            {soundEnabled ? t("ui.soundOn") : t("ui.soundOff")}
          </button>
          <div className="phone-overflow-group">
            <span>{t("ui.reset")}</span>
            <button
              type="button"
              onClick={() => {
                closeOverflow();
                onClearWork();
              }}
            >
              {t("ui.clearCurrentWork")}
            </button>
            {canRestoreToolDefaults && (
              <button
                type="button"
                onClick={() => {
                  closeOverflow();
                  onRestoreToolDefaults();
                }}
              >
                {t("ui.restoreToolDefaults")}
              </button>
            )}
          </div>
          <div className="phone-overflow-group">
            <span>{t("ui.download")}</span>
            {DOWNLOAD_FORMATS.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => {
                  closeOverflow();
                  download(format);
                }}
              >
                {t("ui.downloadKind", { kind: format.toUpperCase() })}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                closeOverflow();
                void copyShareLink();
              }}
            >
              {t("ui.copyLink")}
            </button>
          </div>
        </div>
      </details>
      <div className="topbar-secondary">
        <span className="topbar-separator" />

        <button
          className={`topbar-button topbar-labelled-icon-button ${leftPanelMode === "settings" ? "active" : ""}`}
          onClick={onShowSettings}
          title={t("nav.settings")}
        >
          <SettingsIcon />
          <span className="topbar-label">{t("nav.settings")}</span>
        </button>

        <button
          className={`topbar-button topbar-labelled-icon-button ${leftPanelMode === "tools" ? "active" : ""}`}
          onClick={onShowTools}
          title={t("nav.tools")}
        >
          <ToolsIcon />
          <span className="topbar-label">{t("nav.tools")}</span>
        </button>

        <button
          type="button"
          className={`topbar-button topbar-icon-button ${leftPanelMode === "hidden" ? "active" : ""}`}
          onClick={onToggleFocus}
          aria-pressed={leftPanelMode === "hidden"}
          aria-label={leftPanelMode === "hidden" ? t("nav.showControls") : t("nav.focusDiagram")}
          title={`${leftPanelMode === "hidden" ? t("nav.showControls") : t("nav.focusDiagram")}. ${t("nav.focusHint")}`}
        >
          <PaneIcon side="left" open={leftPanelMode !== "hidden"} />
        </button>

        {notationAction && (
          <button
            type="button"
            className={`topbar-button topbar-labelled-icon-button ${notationAction.visible ? "active" : ""}`}
            onClick={notationAction.toggle}
            aria-pressed={notationAction.visible}
            title={notationAction.visible ? t("ui.hideNotation") : t("ui.showNotation")}
          >
            <NotationIcon />
            <span className="topbar-label">
              {notationAction.visible ? t("ui.hideNotation") : t("ui.showNotation")}
            </span>
          </button>
        )}

        <span className="topbar-spacer" />
        {inspectorAvailable && (
          <button
            type="button"
            className="topbar-button topbar-icon-button inspector-visibility-toggle"
            aria-pressed={inspectorVisible}
            onClick={onToggleInspector}
            aria-label={t(inspectorVisible ? "ui.hideResults" : "ui.showResults")}
            title={t(inspectorVisible ? "ui.hideResults" : "ui.showResults")}
          >
            <PaneIcon side="right" open={Boolean(inspectorVisible)} />
          </button>
        )}

        <button
          type="button"
          className={`topbar-button topbar-icon-button ${soundEnabled ? "active" : ""}`}
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? t("ui.soundOn") : t("ui.soundOff")}
          title={soundEnabled ? t("ui.soundOn") : t("ui.soundOff")}
        >
          <SpeakerIcon on={soundEnabled} />
        </button>

        <ResetMenu
          t={t}
          canRestoreToolDefaults={canRestoreToolDefaults}
          onClearWork={onClearWork}
          onRestoreToolDefaults={onRestoreToolDefaults}
        />

        <span className="topbar-after-reset-space" aria-hidden="true" />

        <DownloadMenu t={t} downloadFormat={downloadFormat} onDownload={download} />
      </div>
    </div>
  );
}
