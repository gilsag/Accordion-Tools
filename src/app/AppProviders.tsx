import type { ReactNode } from "react";
import { PlatformProviders } from "./platform/PlatformProviders";
import { DiagramButtonsProvider } from "./diagram/DiagramButtonsProvider";
import { ToolOutputProviders } from "./tools/ToolOutputProviders";
import { ToolProviders } from "./tools/ToolProviders";
import { CrossToolProvider } from "./crossTool/CrossToolProvider";
import { ShareLinkProvider } from "./shareLink/ShareLinkProvider";

/** Shared state, then each tool's state, then the diagram's buttons (which
 * follow what the tools ask to keep visible), then what each tool derives
 * from its state and the buttons, then the commands that span tools, then
 * shared links, which open and describe a view across all of them.
 * Everything in the application renders inside these providers. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlatformProviders>
      <ToolProviders>
        <DiagramButtonsProvider>
          <ToolOutputProviders>
            <CrossToolProvider>
              <ShareLinkProvider>{children}</ShareLinkProvider>
            </CrossToolProvider>
          </ToolOutputProviders>
        </DiagramButtonsProvider>
      </ToolProviders>
    </PlatformProviders>
  );
}
