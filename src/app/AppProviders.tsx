import type { ReactNode } from "react";
import { PlatformProviders } from "./platform/PlatformProviders";
import { DiagramButtonsProvider } from "./diagram/DiagramButtonsProvider";
import { ToolOutputProviders } from "./tools/ToolOutputProviders";
import { ToolProviders } from "./tools/ToolProviders";
import { CrossToolProvider } from "./crossTool/CrossToolProvider";

/** Shared state, then each tool's state, then the diagram's buttons (which
 * follow what the tools ask to keep visible), then what each tool derives
 * from its state and the buttons, then the commands that span tools.
 * Everything in the application renders inside these providers. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlatformProviders>
      <ToolProviders>
        <DiagramButtonsProvider>
          <ToolOutputProviders>
            <CrossToolProvider>{children}</CrossToolProvider>
          </ToolOutputProviders>
        </DiagramButtonsProvider>
      </ToolProviders>
    </PlatformProviders>
  );
}
