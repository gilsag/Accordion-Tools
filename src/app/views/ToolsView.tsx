import { Suspense } from "react";
import { CollapsibleSection } from "../../components/ui/CollapsibleSection";
import { TOOL_REGISTRY, toolsListedFor } from "../toolRegistry";
import { TOOL_SECTIONS, TOOL_SECTION_CONTENT_CLASS } from "../toolSections";
import type { AppControllerModel } from "../useAppController";

/** The Tools panel: one collapsible section per tool offered in the current
 * workspace and on the current instrument side.
 *
 * Names, summaries, availability and order come from the tool registry; the
 * controls of a tool are loaded when its section is first opened. All state
 * and commands originate in the controller.
 */
export function ToolsView({ model }: { model: AppControllerModel["tools"] }) {
  const { activeToolSection, side, t, toggleToolSection, workspaceMode } = model;
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
            onToggle={() => toggleToolSection(tool)}
            contentClassName={TOOL_SECTION_CONTENT_CLASS[tool]}
            keepMounted={"keepMounted" in TOOL_REGISTRY[tool]}
          >
            <Suspense fallback={<div aria-busy="true" />}>
              <Section model={model} />
            </Suspense>
          </CollapsibleSection>
        );
      })}
    </>
  );
}
