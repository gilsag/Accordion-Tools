import type { ToolHandle } from "../toolCoordinator";

/** A Finder: its result is shown or hidden on the diagram, and hidden by
 * Reset work and by a change of physical layout. */
export function finderHandle(setActive: (active: boolean) => void): ToolHandle {
  return {
    activate: () => setActive(true),
    deactivate: () => setActive(false),
    resetWork: (workspace) => {
      if (workspace === "accordion") setActive(false);
    },
    onLayoutChange: () => setActive(false),
  };
}

/** A player: stopped by Reset work and by the tools whose `onToggle` says so. */
export function playerHandle(stop: () => void): ToolHandle {
  return {
    stop,
    resetWork: (workspace) => {
      if (workspace === "accordion") stop();
    },
  };
}
