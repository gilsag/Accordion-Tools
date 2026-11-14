/** The toolbar's icons. */
export function PaneIcon({ side, open }: { side: "left" | "right"; open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d={side === "left" ? "M9 4.5v15" : "M15 4.5v15"} />
      {open && (
        <rect
          x={side === "left" ? 4 : 15}
          y="5.5"
          width="5"
          height="13"
          fill="currentColor"
          stroke="none"
        />
      )}
    </svg>
  );
}

export function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {on ? (
        <>
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a8.5 8.5 0 0 1 0 12" />
        </>
      ) : (
        <>
          <path d="M17 9l5 6" />
          <path d="M22 9l-5 6" />
        </>
      )}
    </svg>
  );
}

/* Settings, Tools and Reset show their icons only when the toolbar is narrow
   and their labels are hidden (see .topbar-compact-icon in App.css). */
export function SettingsIcon() {
  return (
    <svg
      className="topbar-compact-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </svg>
  );
}

export function ToolsIcon() {
  return (
    <svg
      className="topbar-compact-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function ResetIcon() {
  return (
    <svg
      className="topbar-compact-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4.5h4.5" />
    </svg>
  );
}

/** A short staff with a note: shows or hides staff notation. */
export function NotationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 7h20M2 11h20M2 15h20M2 19h20" opacity="0.55" />
      <ellipse
        cx="9"
        cy="17"
        rx="3"
        ry="2.2"
        fill="currentColor"
        stroke="none"
        transform="rotate(-20 9 17)"
      />
      <path d="M11.6 16.4V4.5l5 2" strokeWidth="2" />
    </svg>
  );
}

/** An arrow into a tray: download. */
export function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" />
    </svg>
  );
}
