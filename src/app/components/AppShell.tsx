import type { CSSProperties, ReactNode } from "react";
import type { InterfaceLanguage } from "../../i18n/catalog";
import type { InterfaceDensity } from "../../types";

/** Stable DOM shell. Panel/workspace content is supplied by the controller
 * until the remaining large control panels can be extracted independently.
 */
export function AppShell({ language, density, gridTemplateColumns, children }: {
  language: InterfaceLanguage;
  density: InterfaceDensity;
  gridTemplateColumns: CSSProperties["gridTemplateColumns"];
  children: ReactNode;
}) {
  return <main lang={language} className={`app density-${density}`}
    style={{ gridTemplateColumns }}>{children}</main>;
}
