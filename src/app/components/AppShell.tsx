import type { CSSProperties, ReactNode } from "react";
import type { InterfaceLanguage } from "../../i18n/catalog";
import type { InterfaceDensity } from "../../types";

/** Stable DOM shell: language, density and the grid tracks. The panels,
 * the workspace and the inspector are its children. */
export function AppShell({
  language,
  density,
  gridTemplateColumns,
  children,
}: {
  language: InterfaceLanguage;
  density: InterfaceDensity;
  gridTemplateColumns: CSSProperties["gridTemplateColumns"];
  children: ReactNode;
}) {
  return (
    <main lang={language} className={`app density-${density}`} style={{ gridTemplateColumns }}>
      {children}
    </main>
  );
}
