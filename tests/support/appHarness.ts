/** Renders the application's state composition in jsdom, with the bundled
 * files in `public/` served to `fetch` and sound switched off, so tests can
 * drive the same commands the panels and the toolbar call.
 *
 * Tests reach the composition only through `renderApp()` and the model it
 * returns. When `useAppController` is replaced by tool providers (see
 * docs/internal/controller-split-plan.md), only this file changes. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { useAppController, type AppControllerModel } from "../../src/app/useAppController";
import { SAVED_SESSION_KEY } from "../../src/settings/settingsSession";

const PUBLIC_DIR = resolve(import.meta.dirname, "../../public");

/** One pending `fetch`, for tests that hold a file back. */
export interface HeldRequest {
  release(): void;
}

export interface FetchControl {
  /** Holds back every request whose path ends with `suffix` until released. */
  hold(suffix: string): HeldRequest;
  /** Paths requested so far, without the base URL. */
  requested: string[];
}

/** Serves `public/<path>` for `<BASE_URL><path>`, as GitHub Pages does. */
export function serveBundledFiles(): FetchControl {
  const base = import.meta.env.BASE_URL;
  const held: { suffix: string; gate: Promise<void> }[] = [];
  const requested: string[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = url.startsWith(base) ? url.slice(base.length) : url.replace(/^\//, "");
    requested.push(path);
    const gate = held.find((entry) => path.endsWith(entry.suffix))?.gate;
    if (gate) await gate;
    try {
      const body = readFileSync(resolve(PUBLIC_DIR, path), "utf8");
      return new Response(body, { status: 200 });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
  return {
    requested,
    hold(suffix) {
      let release = () => {};
      const gate = new Promise<void>((resolveGate) => (release = resolveGate));
      held.push({ suffix, gate });
      return { release };
    },
  };
}

/** The startup sequence is finished once the first session has been stored. */
export async function waitForStartup() {
  await waitFor(() => expect(window.localStorage.getItem(SAVED_SESSION_KEY)).not.toBeNull(), {
    timeout: 3000,
  });
}

export interface RenderedApp {
  /** The current model; read it again after every command. */
  readonly model: AppControllerModel;
  /** Runs commands and lets React apply the resulting state and effects. */
  run(commands: (model: AppControllerModel) => void): Promise<void>;
}

export interface RenderAppOptions {
  /** Wait for the defaults file and the saved session (default true). */
  waitForStartup?: boolean;
}

/** Renders the composition. Sound is switched off after startup, because
 * jsdom has no Web Audio; playback order is covered by the audio tests. */
export async function renderApp(options: RenderAppOptions = {}): Promise<RenderedApp> {
  const { result } = renderHook(() => useAppController());
  const app: RenderedApp = {
    get model() {
      return result.current;
    },
    async run(commands) {
      await act(async () => {
        commands(result.current);
      });
    },
  };
  if (options.waitForStartup !== false) {
    await waitForStartup();
    await app.run((model) => model.workspace.setSoundEnabled(false));
  }
  return app;
}

/** Fresh storage and globals for every test. */
export function resetBrowserState() {
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
}
