import type { Notice } from "../../app/platform/useNotices";

/** The page's message area. Both live regions are always in the document, so
 * a screen reader announces each message as it is added: errors assertively,
 * information politely. */
export function NoticeRegion({
  notices,
  onDismiss,
  dismissLabel,
}: {
  notices: Notice[];
  onDismiss: (id: number) => void;
  dismissLabel: string;
}) {
  const list = (kind: Notice["kind"]) =>
    notices
      .filter((notice) => notice.kind === kind)
      .map((notice) => (
        <div key={notice.id} className={`notice notice-${kind}`}>
          <p>{notice.message}</p>
          <button
            type="button"
            className="notice-dismiss"
            aria-label={dismissLabel}
            title={dismissLabel}
            onClick={() => onDismiss(notice.id)}
          >
            ×
          </button>
        </div>
      ));
  return (
    <div className="notice-region">
      <div role="alert">{list("error")}</div>
      <div role="status">{list("info")}</div>
    </div>
  );
}
