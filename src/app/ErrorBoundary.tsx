import { Component, type ErrorInfo, type ReactNode } from "react";
import { translate } from "../i18n/catalog";
import { clearSavedSession } from "../settings/settingsSession";
import { initialInterfaceLanguage } from "../settings/useLanguageSettings";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Last line of defence: a rendering error anywhere in the app shows a
 * recovery screen instead of a blank page.
 *
 * It sits outside the app, so it cannot use the language context and reads
 * the catalog directly. "Reset settings and reload" exists because a saved
 * session is the one input that survives a reload and could bring the same
 * error back. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Accordion Tools stopped after a rendering error.", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const language = initialInterfaceLanguage();
    return (
      <main className="app-error" role="alert">
        <h1>{translate(language, "error.title")}</h1>
        <p>{translate(language, "error.body")}</p>
        <div className="button-row">
          <button type="button" className="small-button" onClick={() => window.location.reload()}>
            {translate(language, "error.reload")}
          </button>
          <button type="button" className="small-button" onClick={() => { clearSavedSession(); window.location.reload(); }}>
            {translate(language, "error.resetAndReload")}
          </button>
        </div>
        <details>
          <summary>{translate(language, "error.details")}</summary>
          <pre>{error.message}</pre>
        </details>
      </main>
    );
  }
}
