import { useLayoutEffect, useRef } from "react";
import type { ToolHandle, ToolHandleId } from "../toolCoordinator";
import { usePlatformTools } from "./platformContexts";

/** Registers a tool's handle with the tool coordinator. The handle may be a
 * new object on every render; the coordinator always calls the latest one. */
export function useToolHandle(id: ToolHandleId, handle: ToolHandle) {
  const { coordinator } = usePlatformTools();
  const latest = useRef(handle);
  useLayoutEffect(() => {
    latest.current = handle;
  });
  useLayoutEffect(() => coordinator.register(id, () => latest.current), [coordinator, id]);
}
