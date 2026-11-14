/** The rules that span tools: which Finder's result is on the diagram, what
 * opening or closing a tool does to the others, the Reset menu's scopes, and
 * what a change of physical layout clears.
 *
 * Tools take part through a handle: a small object of optional commands,
 * registered under the tool's id. The coordinator holds no state of its own;
 * which tools react to what is data in `TOOL_REGISTRY`. Transfers between two
 * named tools are not here: they are explicit sequences in
 * `crossToolCommands.ts`. */
import { TOOL_REGISTRY, type ToolId, type WorkspaceMode } from "./toolRegistry";

export interface ToolHandle {
  /** Finders: show the result on the diagram. */
  activate?(): void;
  /** Finders: hide the result, keeping the request and the selection. */
  deactivate?(): void;
  /** Players: stop playing. */
  stop?(): void;
  /** "Reset work" in the given workspace: clear marks, results on the
   * diagram and playback, keeping preferences. Sound is stopped afterwards
   * by the coordinator. */
  resetWork?(workspace: WorkspaceMode): void;
  /** "Reset tool": restore this tool's own preferences. */
  resetPreferences?(): void;
  /** The physical layout changed, so marks tied to button identities are stale. */
  onLayoutChange?(): void;
}

/** "playback" stops every player at once; it goes away when playback gets
 * its own provider (docs/internal/controller-split-plan.md, step 6). */
export type ToolHandleId = ToolId | "playback";

export interface ToolCoordinator {
  register(id: ToolHandleId, read: () => ToolHandle): () => void;
  /** Called after navigation has toggled `section`; `opening` is true when
   * it was not the open tool before. */
  toolToggled(section: ToolId, opening: boolean): void;
  resetWork(workspace: WorkspaceMode): void;
  resetTool(target: ToolId | null): void;
  layoutChanged(): void;
}

const TOOL_IDS = Object.keys(TOOL_REGISTRY) as ToolId[];
const definition = (id: ToolId) =>
  TOOL_REGISTRY[id] as {
    highlights?: "on-open" | "own-button";
    onToggle?: {
      hideFinders?: true;
      stopPlayers?: readonly ToolId[];
      stopAllPlayback?: true;
    };
  };
const FINDERS = TOOL_IDS.filter((id) => definition(id).highlights);
const CHORD_FINDERS = TOOL_IDS.filter((id) => definition(id).highlights === "on-open");

export function createToolCoordinator(ports: { stopAllSound(): void }): ToolCoordinator {
  const readers = new Map<ToolHandleId, () => ToolHandle>();
  const handle = (id: ToolHandleId) => readers.get(id)?.();

  return {
    register(id, read) {
      readers.set(id, read);
      return () => {
        if (readers.get(id) === read) readers.delete(id);
      };
    },

    toolToggled(section, opening) {
      if (opening) {
        if (definition(section).highlights === "on-open") {
          // A chord Finder shows its current chord at once; Finder results
          // stay exclusive.
          for (const id of FINDERS) if (id !== section) handle(id)?.deactivate?.();
          handle(section)?.activate?.();
        } else {
          // Any other tool hides the chord Finders' results. Their chord and
          // selected realization are kept, so reopening shows them again.
          for (const id of CHORD_FINDERS) handle(id)?.deactivate?.();
        }
      }
      const onToggle = definition(section).onToggle;
      if (onToggle?.hideFinders) for (const id of FINDERS) handle(id)?.deactivate?.();
      for (const id of onToggle?.stopPlayers ?? []) handle(id)?.stop?.();
      if (onToggle?.stopAllPlayback) handle("playback")?.stop?.();
    },

    resetWork(workspace) {
      // Every tool cancels its own timers first; sound stops last.
      for (const id of TOOL_IDS) handle(id)?.resetWork?.(workspace);
      ports.stopAllSound();
    },

    resetTool(target) {
      if (target) handle(target)?.resetPreferences?.();
    },

    layoutChanged() {
      for (const id of TOOL_IDS) handle(id)?.onLayoutChange?.();
    },
  };
}
