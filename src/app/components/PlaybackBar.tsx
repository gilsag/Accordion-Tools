import type { useLanguageSettings } from "../../settings/useLanguageSettings";

import type { PlaybackTransport } from "../playback/playbackTransports";

export type { PlaybackBarState, PlaybackTransport } from "../playback/playbackTransports";

function Icon({ kind }: { kind: "play" | "pause" | "stop" }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
      {kind === "play" && <path d="M4 2.5v11l9-5.5z" />}
      {kind === "pause" && (
        <>
          <rect x="3.5" y="2.5" width="3" height="11" rx="0.8" />
          <rect x="9.5" y="2.5" width="3" height="11" rx="0.8" />
        </>
      )}
      {kind === "stop" && <rect x="3" y="3" width="10" height="10" rx="1.2" />}
    </svg>
  );
}

/** The count-in and metronome switches (saved settings, src/audio/clickTrack.ts). */
export type ClickSwitches = {
  countIn: boolean;
  metronome: boolean;
  setCountIn: (value: boolean) => void;
  setMetronome: (value: boolean) => void;
};

/** One transport under the diagram, shared by every player, so playback is
 * reachable next to what it highlights (and on phones without the Tools sheet).
 * Players that play in time also get the count-in and metronome switches;
 * a change applies from the next Play. */
export function PlaybackBar({
  transport,
  loading,
  clicks,
  t,
}: {
  transport: PlaybackTransport;
  loading: boolean;
  clicks: ClickSwitches;
  t: ReturnType<typeof useLanguageSettings>["t"];
}) {
  const { label, state, canPlay, onPlay, onPause, onStop, rhythmic } = transport;
  return (
    <div className="playback-bar" role="group" aria-label={`${t("ui.playback")}: ${label}`}>
      <span className="playback-bar-label">{label}</span>
      {loading && (
        <span className="playback-bar-status" role="status">
          {t("ui.loadingSounds")}
        </span>
      )}
      <div className="playback-bar-buttons">
        <button
          type="button"
          className={`playback-bar-button playback-bar-play ${state === "playing" ? "active" : ""}`}
          onClick={onPlay}
          disabled={!canPlay || state === "playing"}
        >
          <Icon kind="play" /> {state === "paused" ? t("ui.continue") : t("tools.play")}
        </button>
        {onPause && (
          <button
            type="button"
            className="playback-bar-button"
            onClick={onPause}
            disabled={state !== "playing"}
          >
            <Icon kind="pause" /> {t("ui.pause")}
          </button>
        )}
        <button type="button" className="playback-bar-button" onClick={onStop}>
          <Icon kind="stop" /> {t("ui.stop")}
        </button>
      </div>
      {rhythmic && (
        <div className="playback-bar-clicks" role="group" aria-label={t("ui.clicks")}>
          <button
            type="button"
            className="playback-bar-toggle"
            aria-pressed={clicks.countIn}
            title={t("ui.countInHelp")}
            onClick={() => clicks.setCountIn(!clicks.countIn)}
          >
            {t("ui.countIn")}
          </button>
          <button
            type="button"
            className="playback-bar-toggle"
            aria-pressed={clicks.metronome}
            title={t("ui.metronomeHelp")}
            onClick={() => clicks.setMetronome(!clicks.metronome)}
          >
            {t("ui.metronome")}
          </button>
        </div>
      )}
    </div>
  );
}
