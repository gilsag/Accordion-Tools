import { useCallback, useRef, useState } from "react";

export type NoticeKind = "error" | "info";
export type Notice = { id: number; kind: NoticeKind; message: string };

/** How long an information notice stays. Errors stay until dismissed. */
export const INFO_NOTICE_MS = 8000;

/** Messages shown in the page instead of browser dialogs: an export that
 * failed, a file that could not be read, a transfer that left something out.
 * They never block the page. `NoticeRegion` shows them and announces them to
 * screen readers; errors stay until dismissed, information goes after
 * `INFO_NOTICE_MS`. The same message is not shown twice at once. */
export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);
  const notify = useCallback(
    (message: string, kind: NoticeKind = "error") => {
      const id = nextId.current++;
      setNotices((current) => [
        ...current.filter((notice) => notice.message !== message),
        { id, kind, message },
      ]);
      if (kind === "info") window.setTimeout(() => dismiss(id), INFO_NOTICE_MS);
    },
    [dismiss],
  );
  return { notices, notify, dismiss };
}
