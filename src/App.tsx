import "./App.css";
import { LanguageProvider } from "./i18n/context";
import { AppShell } from "./app/components/AppShell";
import { useAppController } from "./app/useAppController";
import { SettingsView } from "./app/views/SettingsView";
import { ToolsView } from "./app/views/ToolsView";
import { WorkspaceView } from "./app/views/WorkspaceView";

/** Layout composition only. Feature state and cross-tool orchestration are
 * supplied by the controller while independent views render the UI. */
export default function App() {
  const model = useAppController();
  const { language, interfaceDensity, appGridColumns, leftPanelMode, t } = model;
  return (
    <LanguageProvider language={language}>
      <AppShell language={language} density={interfaceDensity} gridTemplateColumns={appGridColumns}>
        {leftPanelMode !== "hidden" && (
          <aside className="left-panel">
            <h1>{leftPanelMode === "settings" ? t("nav.settings") : t("nav.tools")}</h1>
            {leftPanelMode === "settings" && <SettingsView model={model.settings} />}
            {leftPanelMode === "tools" && <ToolsView model={model.tools} />}
          </aside>
        )}
        <WorkspaceView model={model.workspace} />
      </AppShell>
    </LanguageProvider>
  );
}
