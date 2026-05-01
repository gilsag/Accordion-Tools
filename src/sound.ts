import type { DiagramButton, SoundVoicePreset, SoundWaveform } from "./types";
import { PITCH_INDEX, transpose } from "./music";

/*
  Browser sound engine for the accordion diagram.

  This module deliberately keeps audio logic separate from the UI:
  - App.tsx decides when a button or sequence should play.
  - sound.ts converts button metadata into notes and schedules Web Audio tones.

  The engine is still synthetic, but it now supports several higher-level
  voices made from multiple oscillators. These voices are not samples; they are
  lightweight approximations that can later be replaced by real accordion audio.
*/

/** Runtime options used by all sound playback functions. */
export type SoundOptions = {
  enabled: boolean;
  volume: number;
  waveform: SoundWaveform;
  voicePreset: SoundVoicePreset;
  noteDurationMs: number;
  sequenceTempoBpm: number;
  musetteDetuneCents: number;
  attackMs: number;
  releaseMs: number;
};

/** A concrete note to play, using internal pitch-class identity and octave. */
type SoundNote = {
  pitchClass: string;
  octave: number;
};

/** One oscillator layer inside a synthesized voice. */
type VoicePart = {
  waveform: SoundWaveform;
  gain: number;
  detuneCents?: number;
  octaveShift?: number;
};

/** Complete synthesized voice description. */
type VoiceProfile = {
  parts: VoicePart[];
  filterCutoffHz?: number;
};

let audioContext: AudioContext | null = null;
let activeTimeouts: number[] = [];
let activeOscillators: OscillatorNode[] = [];

/** Lazily creates the browser audio context after a user gesture. */
function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

/** Converts a pitch class and octave into a frequency in Hz. */
function frequencyForNote(pitchClass: string, octave: number) {
  const pitchIndex = PITCH_INDEX[pitchClass];

  if (pitchIndex === undefined) return null;

  const midiNumber = (octave + 1) * 12 + pitchIndex;
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

/** Returns the octave shift created when transposing a pitch by semitones. */
function octaveShiftForTranspose(root: string, semitones: number) {
  const rootIndex = PITCH_INDEX[root];

  if (rootIndex === undefined) return 0;

  return Math.floor((rootIndex + semitones) / 12);
}

/** Converts a detune value in cents into a frequency multiplier. */
function centsToFrequencyRatio(cents: number) {
  return Math.pow(2, cents / 1200);
}

/** Keeps a numeric option inside a safe range. */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Builds a multi-oscillator voice from the selected sound preset. */
function voiceProfileForOptions(options: SoundOptions): VoiceProfile {
  const detune = clamp(options.musetteDetuneCents, 0, 30);

  if (options.voicePreset === "soft-reed") {
    return {
      parts: [
        { waveform: "triangle", gain: 0.7 },
        { waveform: "sawtooth", gain: 0.3, detuneCents: 2 },
      ],
      filterCutoffHz: 2600,
    };
  }

  if (options.voicePreset === "bright-reed") {
    return {
      parts: [
        { waveform: "sawtooth", gain: 0.72 },
        { waveform: "triangle", gain: 0.28, detuneCents: -3 },
      ],
      filterCutoffHz: 5200,
    };
  }

  if (options.voicePreset === "musette") {
    return {
      parts: [
        { waveform: "sawtooth", gain: 0.36, detuneCents: -detune },
        { waveform: "sawtooth", gain: 0.3 },
        { waveform: "sawtooth", gain: 0.36, detuneCents: detune },
      ],
      filterCutoffHz: 4200,
    };
  }

  if (options.voicePreset === "organ") {
    return {
      parts: [
        { waveform: "square", gain: 0.55 },
        { waveform: "sine", gain: 0.25 },
        { waveform: "sine", gain: 0.2, octaveShift: 1 },
      ],
      filterCutoffHz: 3600,
    };
  }

  if (options.voicePreset === "bass-reed") {
    return {
      parts: [
        { waveform: "sawtooth", gain: 0.55 },
        { waveform: "triangle", gain: 0.28, detuneCents: -4 },
        { waveform: "sine", gain: 0.17, octaveShift: -1 },
      ],
      filterCutoffHz: 1800,
    };
  }

  return {
    parts: [{ waveform: options.waveform, gain: 1 }],
  };
}

/** Creates one synthesized tone with attack/release envelope and optional filtering. */
function scheduleTone(
  frequency: number,
  startTime: number,
  durationSeconds: number,
  options: SoundOptions,
  noteGain = 1
) {
  const context = getAudioContext();
  const profile = voiceProfileForOptions(options);

  const masterGain = context.createGain();
  const filter = context.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(profile.filterCutoffHz ?? 12000, startTime);
  filter.Q.setValueAtTime(0.4, startTime);

  const safeVolume = clamp(options.volume, 0, 1);
  const attackSeconds = clamp(options.attackMs, 1, 250) / 1000;
  const releaseSeconds = Math.min(
    clamp(options.releaseMs, 10, 700) / 1000,
    durationSeconds * 0.65
  );
  const releaseStart = Math.max(startTime + attackSeconds, startTime + durationSeconds - releaseSeconds);
  const stopTime = startTime + durationSeconds + 0.04;
  const peakGain = safeVolume * noteGain;

  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(peakGain, startTime + attackSeconds);
  masterGain.gain.setValueAtTime(peakGain, releaseStart);
  masterGain.gain.linearRampToValueAtTime(0, startTime + durationSeconds);

  filter.connect(masterGain);
  masterGain.connect(context.destination);

  profile.parts.forEach((part) => {
    const oscillator = context.createOscillator();
    const partGain = context.createGain();

    oscillator.type = part.waveform;
    oscillator.frequency.setValueAtTime(
      frequency * Math.pow(2, part.octaveShift ?? 0) * centsToFrequencyRatio(part.detuneCents ?? 0),
      startTime
    );

    partGain.gain.setValueAtTime(part.gain, startTime);

    oscillator.connect(partGain);
    partGain.connect(filter);

    oscillator.start(startTime);
    oscillator.stop(stopTime);

    activeOscillators.push(oscillator);

    oscillator.onended = () => {
      activeOscillators = activeOscillators.filter((active) => active !== oscillator);
    };
  });
}

/** Plays a group of notes at the same time, usually a single note or chord. */
function playNotes(notes: SoundNote[], options: SoundOptions, delayMs = 0) {
  if (!options.enabled || notes.length === 0) return;

  const context = getAudioContext();
  const startTime = context.currentTime + delayMs / 1000;
  const durationSeconds = Math.max(40, options.noteDurationMs) / 1000;

  const perNoteGain = 1 / Math.sqrt(notes.length);

  notes.forEach((note) => {
    const frequency = frequencyForNote(note.pitchClass, note.octave);
    if (frequency) scheduleTone(frequency, startTime, durationSeconds, options, perNoteGain);
  });
}

/** Returns the Stradella chord intervals used by modern mechanisms. */
function stradellaChordIntervals(kind: DiagramButton["kind"]) {
  if (kind === "chord-major") return [0, 4, 7];
  if (kind === "chord-minor") return [0, 3, 7];
  if (kind === "chord-dominant7") return [0, 4, 10];
  if (kind === "chord-diminished7") return [0, 3, 9];
  return [];
}

/** Converts one diagram button into the note or notes that should sound. */
export function notesForButton(button: DiagramButton): SoundNote[] {
  if (button.kind === "treble-note") {
    if (!button.pitchClass) return [];

    return [
      {
        pitchClass: button.pitchClass,
        octave: button.soundOctave ?? button.octave ?? 3,
      },
    ];
  }

  if (button.kind === "bass-root" || button.kind === "bass-counterbass") {
    if (!button.pitchClass) return [];

    return [
      {
        pitchClass: button.pitchClass,
        octave: 2,
      },
    ];
  }

  const intervals = stradellaChordIntervals(button.kind);
  const root = button.chordRoot ?? button.pitchClass;

  if (!root || intervals.length === 0) return [];

  return intervals.map((interval) => ({
    pitchClass: transpose(root, interval),
    octave: 3 + octaveShiftForTranspose(root, interval),
  }));
}

/** Plays the sound represented by one diagram button. */
export function playButtonSound(button: DiagramButton, options: SoundOptions) {
  playNotes(notesForButton(button), options);
}

/** Plays recorded sequence steps in order at the selected tempo. */
export function playButtonSequence(
  buttons: DiagramButton[],
  options: SoundOptions
) {
  if (!options.enabled || buttons.length === 0) return;

  stopAllSound();

  const stepDelayMs = 60000 / Math.max(20, options.sequenceTempoBpm);

  buttons.forEach((button, index) => {
    const timeoutId = window.setTimeout(() => {
      playButtonSound(button, options);
    }, index * stepDelayMs);

    activeTimeouts.push(timeoutId);
  });
}

/**
 * Plays chord Finder buttons as an arpeggio first, then sounds the full chord.
 * This is used by the Finder chord workflow: users hear the chord tones in
 * order, followed by the simultaneous chord sonority.
 */
export function playButtonArpeggioThenChord(
  buttons: DiagramButton[],
  options: SoundOptions
) {
  if (!options.enabled || buttons.length === 0) return;

  stopAllSound();

  const stepDelayMs = 60000 / Math.max(20, options.sequenceTempoBpm);

  buttons.forEach((button, index) => {
    const timeoutId = window.setTimeout(() => {
      playButtonSound(button, options);
    }, index * stepDelayMs);

    activeTimeouts.push(timeoutId);
  });

  const fullChordDelayMs = buttons.length * stepDelayMs;
  const chordTimeoutId = window.setTimeout(() => {
    const notes = buttons.flatMap((button) => notesForButton(button));
    playNotes(notes, options);
  }, fullChordDelayMs);

  activeTimeouts.push(chordTimeoutId);
}

/** Stops scheduled sequence playback and any currently ringing oscillators. */
export function stopAllSound() {
  activeTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  activeTimeouts = [];

  activeOscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      // Oscillators may already have stopped naturally.
    }
  });

  activeOscillators = [];
}

/*
  TypeScript projects created by Vite may not include the prefixed Safari type.
  This declaration keeps getAudioContext() type-safe in browsers that still use it.
*/
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
