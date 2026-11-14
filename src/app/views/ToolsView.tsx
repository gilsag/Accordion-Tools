import { Suspense } from "react";
import { CollapsibleSection } from "../../components/ui/CollapsibleSection";
import { TOOL_REGISTRY, toolsListedFor } from "../toolRegistry";
import { TOOL_SECTIONS, TOOL_SECTION_CONTENT_CLASS } from "../toolSections";
import {
  usePlatformInstrument,
  usePlatformLanguage,
  usePlatformNavigation,
  usePlatformTools,
} from "../platform/platformContexts";

/** The Tools panel: one collapsible section per tool offered in the current
 * workspace and on the current instrument side.
 *
 * Names, summaries, availability and order come from the tool registry; the
 * controls of a tool are loaded when its section is first opened.
 */
export function ToolsView() {
  const { t } = usePlatformLanguage();
  const { side } = usePlatformInstrument();
  const { activeToolSection, workspaceMode } = usePlatformNavigation();
  const { toggleTool } = usePlatformTools();
  return (
    <>
      {toolsListedFor(workspaceMode, side).map((tool) => {
        const { titleKey, summaryKey } = TOOL_REGISTRY[tool];
        const Section = TOOL_SECTIONS[tool];
        return (
          <CollapsibleSection
            key={tool}
            title={t(titleKey)}
            summary={t(summaryKey)}
            isOpen={activeToolSection === tool}
            onToggle={() => toggleTool(tool)}
            contentClassName={TOOL_SECTION_CONTENT_CLASS[tool]}
            keepMounted={"keepMounted" in TOOL_REGISTRY[tool]}
          >
            <Suspense fallback={<div aria-busy="true" />}>
              <Section />
            </Suspense>
          </CollapsibleSection>
        );
      })}
    </>
  );
}
