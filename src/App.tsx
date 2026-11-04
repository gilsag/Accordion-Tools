import { useInspectorVisibility } from "./app/inspector/useInspectorVisibility";
import "./App.css";
import { resolveWorkspaceInspector } from "./app/inspector/inspectorSelection";
import { WorkspaceInspectorSlot } from "./app/inspector/WorkspaceInspectorSlot";
import { LanguageProvider } from "./i18n/context";
import { AppShell } from "./app/components/AppShell";
import { useAppController } from "./app/useAppController";
import { usePhonePanel } from "./app/usePhonePanel";
import { SettingsView } from "./app/views/SettingsView";
import { ToolsView } from "./app/views/ToolsView";
import { WorkspaceView } from "./app/views/WorkspaceView";

/** Layout composition only. Feature state and cross-tool orchestration are
 * supplied by the controller while independent views render the UI. */
export default function App() {
  const model = useAppController();
  const { visible: inspectorVisible, toggle: toggleInspector } = useInspectorVisibility();
  const { language, interfaceDensity, appGridColumns, leftPanelMode, t } = model;
  const { isPhone, open: sheetOpen, show: showSheet, close: closeSheet,
    panelRef, closeRef, onPanelKeyDown } = usePhonePanel(model.tools.activeToolSection, model.tools.workspaceMode);
  function openPhonePanel(mode: "tools" | "settings") {
    if (leftPanelMode !== mode) model.workspace.setPanel(mode);
    showSheet();
  }
  const availableInspector = resolveWorkspaceInspector({
    leftPanelMode,
    workspaceMode: model.tools.workspaceMode,
    side: model.tools.side,
    stradellaChordFinderActive: model.tools.stradellaChordFinderActive,
    activeToolSection: model.tools.activeToolSection,
  });
  const inspector = inspectorVisible ? availableInspector : null;
  return (
    <LanguageProvider language={language}>
      <AppShell language={language} density={interfaceDensity} gridTemplateColumns={inspector ? `${appGridColumns} minmax(300px, 360px)` : appGridColumns}>
        {isPhone && sheetOpen && <button type="button" tabIndex={-1}
          className="phone-sheet-backdrop" aria-label={t("ui.close")}
          onClick={closeSheet} />}
        {leftPanelMode !== "hidden" && (
          <aside ref={panelRef} className={`left-panel ${isPhone && sheetOpen ? "phone-sheet-open" : ""}`}
            role={isPhone ? "dialog" : undefined} aria-modal={isPhone && sheetOpen ? true : undefined}
            aria-label={isPhone ? (leftPanelMode === "settings" ? t("nav.settings") : t("nav.tools")) : undefined}
            aria-hidden={isPhone && !sheetOpen ? true : undefined}
            inert={isPhone && !sheetOpen}
            onKeyDown={onPanelKeyDown}>
            <div className="phone-sheet-header"><strong>{leftPanelMode === "settings" ? t("nav.settings") : t("nav.tools")}</strong>
              <button ref={closeRef} type="button" className="phone-sheet-close" onClick={closeSheet}>{t("ui.close")}</button>
            </div>
            <h1>{leftPanelMode === "settings" ? t("nav.settings") : t("nav.tools")}</h1>
            {leftPanelMode === "settings" && <SettingsView model={model.settings} />}
            {leftPanelMode === "tools" && <ToolsView model={model.tools} />}
          </aside>
        )}
        <WorkspaceView model={model.workspace} isPhone={isPhone}
          phoneSheetOpen={isPhone && sheetOpen} onOpenPhonePanel={openPhonePanel}
          inspectorAvailable={!!availableInspector} inspectorVisible={!!inspector}
          onToggleInspector={toggleInspector} />
        {inspector && <WorkspaceInspectorSlot inspector={inspector} tools={model.tools} blocked={isPhone && sheetOpen} />}
      </AppShell>
    </LanguageProvider>
  );
}
