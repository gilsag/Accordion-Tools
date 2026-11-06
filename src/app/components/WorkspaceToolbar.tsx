import { useEffect, useLayoutEffect, useRef } from "react";
import type { Side, LeftPanelMode, DownloadFormat } from "../../types";
import type { useLanguageSettings } from "../../settings/useLanguageSettings";
import type { ToolSection, WorkspaceMode } from "../toolRegistry";

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
  /** Downloads the current diagram in the given format and remembers it. */
  onDownloadDiagram: (format: DownloadFormat) => void;
};

const DOWNLOAD_FORMATS: readonly DownloadFormat[] = ["svg", "png"];

/** A window with its left (controls) or right (results) pane filled. */
function PaneIcon({ side, open }: { side: "left" | "right"; open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d={side === "left" ? "M9 4.5v15" : "M15 4.5v15"} />
      {open && <rect x={side === "left" ? 4 : 15} y="5.5" width="5" height="13" fill="currentColor" stroke="none" />}
    </svg>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {on
        ? <><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" /></>
        : <><path d="M17 9l5 6" /><path d="M22 9l-5 6" /></>}
    </svg>
  );
}

/** Switches the toolbar to compact mode when its full form does not fit on one row. */
function fitToolbar(bar: HTMLElement | null) {
  if (!bar) return;
  bar.classList.remove("topbar-compact");
  bar.classList.toggle("topbar-compact", bar.scrollWidth > bar.clientWidth + 1);
}

/* Settings, Tools and Reset show their icons only when the toolbar is narrow
   and their labels are hidden (see .topbar-compact-icon in App.css). */
function SettingsIcon() {
  return (
    <svg className="topbar-compact-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg className="topbar-compact-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="topbar-compact-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4.5h4.5" />
    </svg>
  );
}

/** A short staff with a note: shows or hides staff notation. */
function NotationIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" aria-hidden="true">
      <path d="M2 7h20M2 11h20M2 15h20M2 19h20" opacity="0.55" />
      <ellipse cx="9" cy="17" rx="3" ry="2.2" fill="currentColor" stroke="none" transform="rotate(-20 9 17)" />
      <path d="M11.6 16.4V4.5l5 2" strokeWidth="2" />
    </svg>
  );
}

/** An arrow into a tray: download. */
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" />
    </svg>
  );
}

export function WorkspaceToolbar({
  t, workspaceMode, side, leftPanelMode, activeToolSection, inspectorAvailable, inspectorVisible, onToggleInspector,
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
  const overflowRef = useRef<HTMLDetailsElement | null>(null);
  const exportMenuRef = useRef<HTMLDetailsElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  // Compact mode hides the Settings, Tools, notation, Reset and Download
  // labels behind icons. It is chosen by measuring: the full toolbar is laid
  // out on one row first, and compact mode is used only if it overflows. So
  // labels stay whenever they fit, in every language and at every width.
  useLayoutEffect(() => { fitToolbar(barRef.current); });
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
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => {
    const menus = [resetMenuRef, overflowRef, exportMenuRef];
    function closeOnOutside(event: PointerEvent) {
      for (const menu of menus) {
        if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      for (const menu of menus) {
        if (!menu.current?.open) continue;
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  function closeOverflow() { if (overflowRef.current) overflowRef.current.open = false; }
  function download(format: DownloadFormat) {
    if (exportMenuRef.current) exportMenuRef.current.open = false;
    setDownloadFormat(format);
    onDownloadDiagram(format);
  }
  const notationAction = workspaceMode === "accordion" && side === "stradella" && activeToolSection === "bassPatternPlayer" && bassPatternEvents.length
    ? { visible: bassPatternRenderedNotationVisible, toggle: onToggleBassPatternNotation }
    : workspaceMode === "harmony" && harmonyRecordedProgression.length
      ? { visible: harmonyRecordedNotationVisible, toggle: onToggleHarmonyRecordedNotation }
      : workspaceMode === "accordion" && side === "stradella" && activeToolSection === "progressionAssistant" && harmonyProgressionPlayable
        ? { visible: harmonyProgressionNotationVisible, toggle: onToggleHarmonyProgressionNotation }
        : workspaceMode === "accordion" && activeToolSection === "abcPlayer" && abcText.trim()
          ? { visible: abcRenderedNotationVisible, toggle: onToggleAbcNotation }
          : workspaceMode === "accordion" && activeToolSection === "sequences" && sequenceStepsWithButtons.length
            ? { visible: sequenceRenderedNotationVisible, toggle: onToggleSequenceNotation } : null;
  return (
        <div className="topbar" ref={barRef}>
          <button
            className={`topbar-button topbar-primary ${workspaceMode === "accordion" && side === "stradella" ? "active" : ""}`}
            onClick={onSelectStradella}
          >
            {t("nav.stradella")}
          </button>

          <button
            className={`topbar-button topbar-primary ${workspaceMode === "accordion" && side === "treble" ? "active" : ""}`}
            onClick={onSelectTreble}
          >
            {t("nav.treble")}
          </button>

          <button
            className={`topbar-button topbar-primary ${workspaceMode === "harmony" ? "active" : ""}`}
            onClick={onSelectHarmony}
          >
            {t("nav.harmony")}
          </button>

          <button type="button" className="topbar-button phone-tools-button" onClick={onShowTools}>
            {t("nav.tools")}
          </button>
          <details ref={overflowRef} className="phone-overflow">
            <summary className="topbar-button phone-overflow-toggle" aria-label={t("ui.moreActions")} title={t("ui.moreActions")}>
              <span aria-hidden="true">⋯</span>
            </summary>
            <div className="phone-overflow-menu">
              {inspectorAvailable && <button type="button" onClick={() => { closeOverflow(); onToggleInspector?.(); }}>
                {t(inspectorVisible ? "ui.hideResults" : "ui.showResults")}
              </button>}
              <button type="button" onClick={() => { closeOverflow(); onShowSettings(); }}>{t("nav.settings")}</button>
              <button type="button" onClick={() => { closeOverflow(); onToggleFocus(); }}>
                {leftPanelMode === "hidden" ? t("nav.showControls") : t("nav.focusDiagram")}
              </button>
              {notationAction && <button type="button" onClick={() => { closeOverflow(); notationAction.toggle(); }}>
                {notationAction.visible ? t("ui.hideNotation") : t("ui.showNotation")}
              </button>}
              <button type="button" onClick={() => { closeOverflow(); onToggleSound(); }}>
                {soundEnabled ? t("ui.soundOn") : t("ui.soundOff")}
              </button>
              <div className="phone-overflow-group">
                <span>{t("ui.reset")}</span>
                <button type="button" onClick={() => { closeOverflow(); onClearWork(); }}>{t("ui.clearCurrentWork")}</button>
                {(workspaceMode === "harmony" || (side === "stradella" && activeToolSection === "stradellaChordFinder")) &&
                  <button type="button" onClick={() => { closeOverflow(); onRestoreToolDefaults(); }}>{t("ui.restoreToolDefaults")}</button>}
              </div>
              <div className="phone-overflow-group">
                <span>{t("ui.download")}</span>
                {DOWNLOAD_FORMATS.map((format) => (
                  <button key={format} type="button" onClick={() => { closeOverflow(); download(format); }}>
                    {t("ui.downloadKind", { kind: format.toUpperCase() })}
                  </button>
                ))}
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
              <span className="topbar-label">{notationAction.visible ? t("ui.hideNotation") : t("ui.showNotation")}</span>
            </button>
          )}

          <span className="topbar-spacer" />
          {inspectorAvailable && <button type="button" className="topbar-button topbar-icon-button inspector-visibility-toggle"
            aria-pressed={inspectorVisible} onClick={onToggleInspector}
            aria-label={t(inspectorVisible ? "ui.hideResults" : "ui.showResults")}
            title={t(inspectorVisible ? "ui.hideResults" : "ui.showResults")}>
            <PaneIcon side="right" open={Boolean(inspectorVisible)} />
          </button>}

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

          <details ref={resetMenuRef} className="reset-menu">
            <summary className="topbar-button reset-button topbar-labelled-icon-button" title={t("ui.resetScope")}>
              <ResetIcon />
              <span className="topbar-label">{t("ui.reset")}</span> <span aria-hidden="true">▾</span>
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

          {/* One menu for both formats; the last one used is remembered (it is
              also the format of "Download all diagrams (ZIP)") and listed first. */}
          <details ref={exportMenuRef} className="reset-menu export-menu">
            <summary className="topbar-button download-button topbar-labelled-icon-button" title={t("ui.download")}>
              <DownloadIcon />
              <span className="topbar-label">{t("ui.download")}</span> <span aria-hidden="true">▾</span>
            </summary>
            <div className="reset-menu-options">
              {[downloadFormat, ...DOWNLOAD_FORMATS.filter((format) => format !== downloadFormat)].map((format) => (
                <button key={format} type="button" onClick={() => download(format)}>
                  {t("ui.downloadKind", { kind: format.toUpperCase() })}
                </button>
              ))}
            </div>
          </details>
          </div>
        </div>
  );
}
