import type { ReactNode } from "react";
import { PlatformProviders } from "./platform/PlatformProviders";
import { ToolProviders } from "./tools/ToolProviders";

/** Shared state, then each tool's state. Everything in the application
 * renders inside these providers. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlatformProviders>
      <ToolProviders>{children}</ToolProviders>
    </PlatformProviders>
  );
}
