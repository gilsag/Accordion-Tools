import { useMemo, type ReactNode } from "react";
import {
  KeepVisibleContext,
  useKeepVisibleRequests,
  type KeepVisible,
} from "./diagramButtonsContext";

/** Adds a tool's keep-visible request to those of the providers above. Tool
 * state providers wrap their children in it; pass a stable function
 * (useCallback) so the diagram recomputes only when the request changes. */
export function KeepVisibleRequest({
  request,
  children,
}: {
  request: KeepVisible;
  children: ReactNode;
}) {
  const above = useKeepVisibleRequests();
  const value = useMemo(() => [...above, request], [above, request]);
  return <KeepVisibleContext.Provider value={value}>{children}</KeepVisibleContext.Provider>;
}
