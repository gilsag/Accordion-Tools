import { lazy, Suspense } from "react";
import { useInspectorVisibility } from "./app/inspector/useInspectorVisibility";
import "./App.css";
import { useActiveResults } from "./app/inspector/resultsEntries";
import { WorkspaceInspectorSlot } from "./app/inspector/WorkspaceInspectorSlot";
import { LanguageProvider } from "./i18n/context";
import { AppShell } from "./app/components/AppShell";
import { useAppController } from "./app/useAppController";
import { AppProviders } from "./app/AppProviders";
import { usePhonePanel } from "./app/usePhonePanel";
import { ToolsView } from "./app/views/ToolsView";
import { WorkspaceView } from "./app/views/WorkspaceView";
import { PanelResizeHandle } from "./app/components/PanelResizeHandle";
import { clampPanelWidth, panelTrack, usePanelWidths } from "./app/panelWidths";
import { workspaceGridColumns } from "./app/workspacePresentation";
import { notationLocation } from "./notation/notationSelection";
import { useActiveScore } from "./app/notation/scoreEntries";

// The Tools panel is open at startup; Settings loads the first time it is opened.
const SettingsView = lazy(() =>
  import("./app/views/SettingsView").then((module) => ({ default: module.SettingsView })),
);

const DEFAULT_INSPECTOR_TRACK = "minmax(300px, 360px)";

/** Everything renders inside the platform providers, which own the shared
 * state (language, instrument, appearance, sound, notation, navigation). */
export default function App() {
  return (
    <AppProviders>
      <AppLayout />
    </AppProviders>
  );
}

/** Layout composition only. Feature state and cross-tool orchestration are
 * supplied by the controller while independent views render the UI. */
function AppLayout() {
  const model = useAppController();
  const { visible: inspectorVisible, toggle: toggleInspector } = useInspectorVisibility();
  const { language, interfaceDensity, leftPanelMode, t } = model;
  const { widths: panelWidths, setPanelWidth } = usePanelWidths();
  const {
    isPhone,
    open: sheetOpen,
    show: showSheet,
    close: closeSheet,
    panelRef,
    closeRef,
    onPanelKeyDown,
  } = usePhonePanel(model.tools.activeToolSection, model.tools.workspaceMode);
  function openPhonePanel(mode: "tools" | "settings") {
    if (leftPanelMode !== mode) model.workspace.setPanel(mode);
    showSheet();
  }
  const score = useActiveScore();
  const showNotationRight =
    score !== null &&
    notationLocation(model.tools.musicNotationPlacement, isPhone, inspectorVisible) === "right";
  const results = useActiveResults();
  const inspector = showNotationRight ? "notation" : inspectorVisible && results ? "results" : null;
  const appGridColumns = workspaceGridColumns(
    interfaceDensity,
    leftPanelMode,
    panelWidths.left === null ? undefined : panelTrack(panelWidths.left, ""),
  );
  const inspectorTrack = panelTrack(panelWidths.inspector, DEFAULT_INSPECTOR_TRACK);
  const panelWidth = (element: Element | null | undefined) =>
    element?.getBoundingClientRect().width ?? 0;
  const leftPanelWidth = () => panelWidth(panelRef.current);
  const inspectorWidth = () => panelWidth(document.querySelector(".workspace-inspector"));
  // Drag handles on the diagram's edges; phones use a sheet instead of panels.
  const panelHandles = isPhone ? null : (
    <>
      {leftPanelMode !== "hidden" && (
        <PanelResizeHandle
          panel="left"
          label={t("ui.resizeLeftPanel")}
          measure={leftPanelWidth}
          onResize={(width) => setPanelWidth("left", width)}
          clamp={(width) =>
            clampPanelWidth("left", width, window.innerWidth, inspector ? inspectorWidth() : 0)
          }
        />
      )}
      {inspector && (
        <PanelResizeHandle
          panel="inspector"
          label={t("ui.resizeResultsPanel")}
          measure={inspectorWidth}
          onResize={(width) => setPanelWidth("inspector", width)}
          clamp={(width) =>
            clampPanelWidth("inspector", width, window.innerWidth, leftPanelWidth())
          }
        />
      )}
    </>
  );
  return (
    <LanguageProvider language={language}>
      <AppShell
        language={language}
        density={interfaceDensity}
        gridTemplateColumns={inspector ? `${appGridColumns} ${inspectorTrack}` : appGridColumns}
      >
        {isPhone && sheetOpen && (
          <button
            type="button"
            tabIndex={-1}
            className="phone-sheet-backdrop"
            aria-label={t("ui.close")}
            onClick={closeSheet}
          />
        )}
        {leftPanelMode !== "hidden" && (
          <aside
            ref={panelRef}
            className={`left-panel ${isPhone && sheetOpen ? "phone-sheet-open" : ""}`}
            role={isPhone ? "dialog" : undefined}
            aria-modal={isPhone && sheetOpen ? true : undefined}
            aria-label={
              isPhone
                ? leftPanelMode === "settings"
                  ? t("nav.settings")
                  : t("nav.tools")
                : undefined
            }
            aria-hidden={isPhone && !sheetOpen ? true : undefined}
            inert={isPhone && !sheetOpen}
            onKeyDown={onPanelKeyDown}
          >
            <div className="phone-sheet-header">
              <strong>{leftPanelMode === "settings" ? t("nav.settings") : t("nav.tools")}</strong>
              <button
                ref={closeRef}
                type="button"
                className="phone-sheet-close"
                onClick={closeSheet}
              >
                {t("ui.close")}
              </button>
            </div>
            <h1>{leftPanelMode === "settings" ? t("nav.settings") : t("nav.tools")}</h1>
            {leftPanelMode === "settings" && (
              <Suspense fallback={<div className="section-content" aria-busy="true" />}>
                <SettingsView />
              </Suspense>
            )}
            {leftPanelMode === "tools" && <ToolsView model={model.tools} />}
          </aside>
        )}
        <WorkspaceView
          model={model.workspace}
          score={score}
          isPhone={isPhone}
          phoneSheetOpen={isPhone && sheetOpen}
          onOpenPhonePanel={openPhonePanel}
          inspectorAvailable={results !== null}
          inspectorVisible={!!inspector}
          onToggleInspector={toggleInspector}
          notationInInspector={inspector === "notation"}
          panelHandles={panelHandles}
        />
        {inspector && (
          <WorkspaceInspectorSlot
            score={inspector === "notation" ? score : null}
            results={results}
            blocked={isPhone && sheetOpen}
          />
        )}
      </AppShell>
    </LanguageProvider>
  );
}
