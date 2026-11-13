import { useEffect, useRef, useCallback, type RefObject } from "react";
import { downloadRenderedNotationSvg } from "./notationService";
import { useI18n } from "../i18n/useI18n";

export type NotationRenderer = (host: HTMLDivElement | null, source: string, imported?: boolean) => void | Promise<void>;

/** Shared notation shell for the inspector AND the below-diagram position.
 * All tools use the same header, engraving host, download and help tooltip.
 * The feature supplies ABC and, optionally, a note-highlighting callback. */
export function NotationScore({ title, abc, filename, render, imported = false,
  help, showTitle = true, onRendered, onActive, activeKey, hostRef }: {
  title: string;
  abc: string;
  filename: string;
  render: NotationRenderer;
  imported?: boolean;
  help?: string;
  showTitle?: boolean;
  onRendered?: (host: HTMLDivElement) => void;
  onActive?: (host: HTMLDivElement) => void;
  activeKey?: unknown;
  hostRef?: RefObject<HTMLDivElement | null>;
}) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const ref = hostRef ?? localRef;
  const { t } = useI18n();
  const afterRender = useCallback((host: HTMLDivElement) => onRendered?.(host), [onRendered]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let alive = true;
    Promise.resolve(render(element, abc, imported)).then(() => {
      if (alive) afterRender(element);
    });
    return () => { alive = false; };
  }, [ref, abc, imported, render, afterRender]);
  useEffect(() => {
    if (ref.current) onActive?.(ref.current);
  }, [ref, onActive, activeKey]);
  return <div className="shared-notation-score">
    <div className="rendered-notation-header">
      {showTitle && <strong className="rendered-notation-title">{title}</strong>}
      <div className="notation-header-actions">
        {help && <button type="button" className="notation-help" title={help} aria-label={help}>i</button>}
        <button type="button" className="small-button notation-download-button"
          onClick={() => downloadRenderedNotationSvg(ref.current, filename)}>{t("ui.downloadSVG")}</button>
      </div>
    </div>
    <div ref={ref} className="rendered-abc abc-notation-inspector" aria-label={title}/>
  </div>;
}
