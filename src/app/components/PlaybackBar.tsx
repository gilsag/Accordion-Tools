import type { useLanguageSettings } from "../../settings/useLanguageSettings";

export type PlaybackBarState = "stopped" | "playing" | "paused";

/** What the shared playback bar controls for the active tool. Players without
 * a tracked transport state (Progression Assistant, Sequence) stay "stopped":
 * Play restarts them and Stop silences everything. */
export type PlaybackTransport = {
  label: string;
  state: PlaybackBarState;
  canPlay: boolean;
  onPlay: () => void;
  onPause?: () => void;
  onStop: () => void;
};

function Icon({ kind }: { kind: "play" | "pause" | "stop" }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
      {kind === "play" && <path d="M4 2.5v11l9-5.5z" />}
      {kind === "pause" && <><rect x="3.5" y="2.5" width="3" height="11" rx="0.8" /><rect x="9.5" y="2.5" width="3" height="11" rx="0.8" /></>}
      {kind === "stop" && <rect x="3" y="3" width="10" height="10" rx="1.2" />}
    </svg>
  );
}

/** One transport under the diagram, shared by every player, so playback is
 * reachable next to what it highlights (and on phones without the Tools sheet). */
export function PlaybackBar({ transport, loading, t }: {
  transport: PlaybackTransport;
  loading: boolean;
  t: ReturnType<typeof useLanguageSettings>["t"];
}) {
  const { label, state, canPlay, onPlay, onPause, onStop } = transport;
  return (
    <div className="playback-bar" role="group" aria-label={`${t("ui.playback")}: ${label}`}>
      <span className="playback-bar-label">{label}</span>
      {loading && <span className="playback-bar-status" role="status">{t("ui.loadingSounds")}</span>}
      <div className="playback-bar-buttons">
        <button type="button" className={`playback-bar-button playback-bar-play ${state === "playing" ? "active" : ""}`}
          onClick={onPlay} disabled={!canPlay || state === "playing"}>
          <Icon kind="play" /> {state === "paused" ? t("ui.continue") : t("tools.play")}
        </button>
        {onPause && (
          <button type="button" className="playback-bar-button" onClick={onPause} disabled={state !== "playing"}>
            <Icon kind="pause" /> {t("ui.pause")}
          </button>
        )}
        <button type="button" className="playback-bar-button" onClick={onStop}>
          <Icon kind="stop" /> {t("ui.stop")}
        </button>
      </div>
    </div>
  );
}
