import { useEffect, useRef } from "react";
import { downloadRenderedNotationSvg } from "../../notation/notationService";
import { useI18n } from "../../i18n/useI18n";
import { WorkspaceInspectorFrame } from "./WorkspaceInspectorFrame";

/** ABC Player notation in the results panel. abcjs draws it responsively, so
 * the staff is scaled to the panel's width. */
export function AbcNotationInspector({ abcText, title, renderNotationInto, blocked = false }: {
  abcText: string;
  title: string;
  renderNotationInto: (target: HTMLDivElement | null, abcSource: string) => void;
  blocked?: boolean;
}) {
  const { t } = useI18n();
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    renderNotationInto(hostRef.current, abcText);
  }, [abcText, renderNotationInto]);
  return (
    <WorkspaceInspectorFrame title={title} blocked={blocked}>
      <button type="button" className="small-button notation-download-button"
        onClick={() => downloadRenderedNotationSvg(hostRef.current, `${title || "abc"}-notation`)}>
        {t("ui.downloadSVG")}
      </button>
      <div ref={hostRef} className="rendered-abc abc-notation-inspector" aria-label={t("ui.renderedABCAria")} />
    </WorkspaceInspectorFrame>
  );
}
