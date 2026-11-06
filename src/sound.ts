import { progressionPulsePlan } from "./audio/progressionPulsePlan";
import { audioTimelineOrigin, msUntilAudioTime, scheduleAtAudioOffset, type AudioClockPorts } from "./audio/audioClock";
import type {
  DiagramButton,
  SampleRegister,
  SoundSource,
  SoundVoicePreset,
  SoundWaveform,
  StradellaBassVoicing,
} from "./types";
import { PITCH_INDEX, transpose } from "./music";
import { nominalRegisterNote, type StradellaRegisterModel } from "./tools/stradellaChordFinder/registerModel";
import {
  LA_MELODIOSA_REGIONS,
  LA_MELODIOSA_SAMPLE_BASE,
  type LaMelodiosaRegion,
  type LaMelodiosaSide,
} from "./laMelodiosa";

/*
  Browser sound engine for the accordion diagram.

  The musical mapping is deliberately kept separate from rendering. Buttons are
  first converted into concrete notes, then those notes are rendered either by
  the built-in Web Audio synthesizer or by the La Melodiosa sample set.
*/

/** Runtime options used by all sound playback functions. */
export type SoundOptions = {
  enabled: boolean;
  volume: number;
  source: SoundSource;
  laMelodiosaTrebleRegister: SampleRegister;
  laMelodiosaBassRegister: SampleRegister;
  waveform: SoundWaveform;
  voicePreset: SoundVoicePreset;
  noteDurationMs: number;
  /** Share of a written note's length that sounds in timed playback (0.3–1). */
  articulation: number;
  sequenceTempoBpm: number;
  musetteDetuneCents: number;
  attackMs: number;
  releaseMs: number;
  stradellaBassVoicing: StradellaBassVoicing;
  /** Opt-in to nominal Stradella register pitches with La Melodiosa sample transposition. */
  laMelodiosaFollowStradellaRegisters?: boolean;
  stradellaRegisterModel?: StradellaRegisterModel;
};

/** A concrete note to play, using internal pitch-class identity and octave. */
type SoundNote = {
  pitchClass: string;
  octave: number;
  side: LaMelodiosaSide;
};

type VoicePart = {
  waveform: SoundWaveform;
  gain: number;
  detuneCents?: number;
  octaveShift?: number;
};

type VoiceProfile = {
  parts: VoicePart[];
  filterCutoffHz?: number;
};

let audioContext: AudioContext | null = null;
let activeTimeouts: number[] = [];
let activeOscillators: OscillatorNode[] = [];
let activeSampleSources: AudioBufferSourceNode[] = [];
const sampleBuffers = new Map<string, AudioBuffer>();
const sampleBufferPromises = new Map<string, Promise<AudioBuffer>>();
const roundRobinPositions = new Map<string, number>();
// Incremented when stopping playback so late asynchronous sample decodes
// cannot trigger audible notes belonging to an already-cancelled sequence.
let playbackGeneration = 0;

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

function midiForNote(pitchClass: string, octave: number) {
  const pitchIndex = PITCH_INDEX[pitchClass];
  if (pitchIndex === undefined) return null;
  return (octave + 1) * 12 + pitchIndex;
}

function frequencyForNote(pitchClass: string, octave: number) {
  const midiNumber = midiForNote(pitchClass, octave);
  if (midiNumber === null) return null;
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

function octaveShiftForTranspose(root: string, semitones: number) {
  const rootIndex = PITCH_INDEX[root];
  if (rootIndex === undefined) return 0;
  return Math.floor((rootIndex + semitones) / 12);
}

function centsToFrequencyRatio(cents: number) {
  return Math.pow(2, cents / 1200);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

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

  return { parts: [{ waveform: options.waveform, gain: 1 }] };
}

function scheduleTone(
  frequency: number,
  startTime: number,
  durationSeconds: number,
  options: SoundOptions,
  noteGain = 1,
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
    durationSeconds * 0.65,
  );
  const releaseStart = Math.max(
    startTime + attackSeconds,
    startTime + durationSeconds - releaseSeconds,
  );
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
      frequency *
        Math.pow(2, part.octaveShift ?? 0) *
        centsToFrequencyRatio(part.detuneCents ?? 0),
      startTime,
    );

    partGain.gain.setValueAtTime(part.gain, startTime);
    oscillator.connect(partGain);
    partGain.connect(filter);
    oscillator.start(startTime);
    oscillator.stop(stopTime);

    activeOscillators.push(oscillator);
    oscillator.onended = () => {
      activeOscillators = activeOscillators.filter(
        (active) => active !== oscillator,
      );
    };
  });
}

function registerForNote(note: SoundNote, options: SoundOptions) {
  return note.side === "treble"
    ? options.laMelodiosaTrebleRegister
    : options.laMelodiosaBassRegister;
}

/** Pick the SFZ region matching a nominal MIDI note, extending the nearest
 * region at the edges instead of silently changing sound engine. Such octave
 * assignments are software playback conventions, not physical reed claims. */
function findLaMelodiosaRegion(
  note: SoundNote,
  options: SoundOptions,
): LaMelodiosaRegion | null {
  const midi = midiForNote(note.pitchClass, note.octave);
  if (midi === null) return null;
  const register = registerForNote(note, options);
  const candidates = LA_MELODIOSA_REGIONS.filter(
    (region) => region.side === note.side && region.register === register,
  );
  const exact = candidates.find(
    (region) => midi >= region.lowMidi && midi <= region.highMidi,
  );
  if (exact) return exact;

  // Keep La Melodiosa selected outside its native mapped range by extending the
  // nearest edge region rather than abruptly switching to the synthesizer.
  return (
    candidates
      .map((region) => ({
        region,
        distance:
          midi < region.lowMidi
            ? region.lowMidi - midi
            : midi > region.highMidi
              ? midi - region.highMidi
              : 0,
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.region ?? null
  );
}

async function loadSample(file: string) {
  const cached = sampleBuffers.get(file);
  if (cached) return cached;

  const inFlight = sampleBufferPromises.get(file);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const response = await fetch(`${LA_MELODIOSA_SAMPLE_BASE}${file}`, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load La Melodiosa sample: ${file}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await getAudioContext().decodeAudioData(arrayBuffer);
    sampleBuffers.set(file, buffer);
    sampleBufferPromises.delete(file);
    return buffer;
  })().catch((error) => {
    sampleBufferPromises.delete(file);
    throw error;
  });

  sampleBufferPromises.set(file, promise);
  return promise;
}

function chooseRegionSample(region: LaMelodiosaRegion) {
  if (region.samples.length <= 1) return region.samples[0];
  const key = `${region.side}:${region.register}:${region.lowMidi}-${region.highMidi}`;
  const current = roundRobinPositions.get(key) ?? 0;
  roundRobinPositions.set(key, (current + 1) % region.samples.length);
  return region.samples[current % region.samples.length];
}

async function scheduleSampleNote(
  note: SoundNote,
  startTime: number,
  durationSeconds: number,
  options: SoundOptions,
  noteGain: number,
  generation: number,
) {
  const region = findLaMelodiosaRegion(note, options);
  const targetMidi = midiForNote(note.pitchClass, note.octave);

  if (!region || targetMidi === null) {
    // Sample mode never switches silently to oscillators. A missing sample or
    // invalid pitch results in silence for that note and an explicit warning.
    console.warn("No La Melodiosa sample mapping for", note);
    return;
  }

  const preferredSample = chooseRegionSample(region);

  // Keep sampled mode fully sampled. If a particular take cannot be loaded, try
  // its alternate take and then nearby regions in the same register before
  // giving up. Falling back to the synthesizer here makes missing assets sound
  // like an intentional timbre change and masks the actual loading problem.
  const register = registerForNote(note, options);
  const nearbyRegions = LA_MELODIOSA_REGIONS
    .filter((candidate) => candidate.side === note.side && candidate.register === register)
    .slice()
    .sort((a, b) => {
      const distanceA = Math.min(
        Math.abs(targetMidi - a.lowMidi),
        Math.abs(targetMidi - a.highMidi),
      );
      const distanceB = Math.min(
        Math.abs(targetMidi - b.lowMidi),
        Math.abs(targetMidi - b.highMidi),
      );
      return distanceA - distanceB;
    });

  const sampleCandidates = [
    preferredSample,
    ...region.samples.filter((sample) => sample.file !== preferredSample.file),
    ...nearbyRegions
      .filter((candidate) => candidate !== region)
      .flatMap((candidate) => candidate.samples),
  ].filter(
    (sample, index, samples) =>
      samples.findIndex((candidate) => candidate.file === sample.file) === index,
  );

  let loaded: { sample: (typeof sampleCandidates)[number]; buffer: AudioBuffer } | null = null;
  for (const sample of sampleCandidates) {
    try {
      loaded = { sample, buffer: await loadSample(sample.file) };
      break;
    } catch (error) {
      console.warn(error);
    }
  }

  if (!loaded || generation !== playbackGeneration) return;

  const { sample, buffer } = loaded;
  const context = getAudioContext();
  const source = context.createBufferSource();
  const gain = context.createGain();
  const now = context.currentTime;
  const actualStart = Math.max(startTime, now + 0.005);
  const attackSeconds = Math.min(clamp(options.attackMs, 1, 250) / 1000, 0.08);
  const releaseSeconds = Math.min(
    clamp(options.releaseMs, 10, 900) / 1000,
    durationSeconds * 0.75,
  );
  const releaseStart = Math.max(
    actualStart + attackSeconds,
    actualStart + durationSeconds - releaseSeconds,
  );
  const stopTime = actualStart + durationSeconds + 0.03;
  const amplitudeScale = clamp(region.amplitude / 150, 0.55, 1.35);
  const peakGain = clamp(options.volume, 0, 1) * noteGain * amplitudeScale;

  source.buffer = buffer;
  source.playbackRate.setValueAtTime(
    Math.pow(
      2,
      (targetMidi - sample.rootMidi + sample.tuneCents / 100) / 12,
    ),
    actualStart,
  );

  gain.gain.setValueAtTime(0, actualStart);
  gain.gain.linearRampToValueAtTime(peakGain, actualStart + attackSeconds);
  gain.gain.setValueAtTime(peakGain, releaseStart);
  gain.gain.linearRampToValueAtTime(0, actualStart + durationSeconds);

  source.connect(gain);

  // Register III contains both treble reed sets. On its lower sampled notes,
  // some alternating takes can sound unusually sharp through browser playback.
  // Apply a gentle low-pass only to this narrow case; leave registers I/II and
  // the upper part of register III unchanged.
  if (note.side === "treble" && register === "III" && targetMidi < 72) {
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4600, actualStart);
    filter.Q.setValueAtTime(0.65, actualStart);
    gain.connect(filter);
    filter.connect(context.destination);
  } else {
    gain.connect(context.destination);
  }

  source.start(actualStart);
  source.stop(Math.min(stopTime, actualStart + buffer.duration / source.playbackRate.value));

  activeSampleSources.push(source);
  source.onended = () => {
    activeSampleSources = activeSampleSources.filter(
      (active) => active !== source,
    );
  };
}

/**
 * Creates or resumes the shared AudioContext. Call it from a user-gesture
 * handler: browsers (Safari in particular) only start audio inside one, and
 * creating the context earlier only produces autoplay warnings.
 */
export function unlockAudio() {
  try {
    getAudioContext();
  } catch {
    // No Web Audio support; playback reports its own error when used.
  }
}

/**
 * Preloads La Melodiosa samples for the selected registers. Pass `null` for a
 * side the current workspace does not play, so it is not downloaded (the treble
 * registers are about 11 to 13 MB each, the bass registers about 2 MB).
 * Decoding needs an AudioContext, so call this only after a user gesture.
 */
export async function preloadLaMelodiosa(
  trebleRegister: SampleRegister | null,
  bassRegister: SampleRegister | null,
) {
  const files = new Set<string>();
  LA_MELODIOSA_REGIONS.forEach((region) => {
    const wanted =
      (trebleRegister !== null && region.side === "treble" && region.register === trebleRegister) ||
      (bassRegister !== null && region.side === "bass" && region.register === bassRegister);
    if (wanted) region.samples.forEach((sample) => files.add(sample.file));
  });

  await Promise.allSettled(Array.from(files, (file) => loadSample(file)));
}

/**
 * Optional timing for a played note. `at` is an AudioContext time (see
 * audio/audioClock.ts); `durationMs` overrides the button-click note duration,
 * so timed players can sound each note for its written length.
 */
export type NoteTiming = { at?: number; durationMs?: number };

/** Default share of a written note's length that sounds in timed playback
 * (Settings → Sound → Note length in players). The highlight lasts as long. */
export const DEFAULT_NOTE_ARTICULATION = 0.85;

function playNotes(notes: SoundNote[], options: SoundOptions, delayMs = 0, timing: NoteTiming = {}) {
  if (!options.enabled || notes.length === 0) return;

  const context = getAudioContext();
  const startTime = timing.at ?? context.currentTime + delayMs / 1000;
  const durationSeconds = Math.max(40, timing.durationMs ?? options.noteDurationMs) / 1000;
  const perNoteGain = 1 / Math.sqrt(notes.length);

  notes.forEach((note) => {
    if (options.source === "la-melodiosa") {
      void scheduleSampleNote(
        note,
        startTime,
        durationSeconds,
        options,
        perNoteGain,
        playbackGeneration,
      );
      return;
    }

    const frequency = frequencyForNote(note.pitchClass, note.octave);
    if (frequency) scheduleTone(frequency, startTime, durationSeconds, options, perNoteGain);
  });
}

function stradellaChordIntervals(kind: DiagramButton["kind"]) {
  if (kind === "chord-major") return [0, 4, 7];
  if (kind === "chord-minor") return [0, 3, 7];
  if (kind === "chord-dominant7") return [0, 4, 10];
  if (kind === "chord-diminished7") return [0, 3, 9];
  return [];
}

/** Converts one diagram button into the note or notes that should sound. */
// Nominal sound octaves model this synthesizer/sample playback path only;
// they must not dictate theoretical chord-search or structural inversion labels.
export function notesForButton(
  button: DiagramButton,
  options?: Pick<SoundOptions, "stradellaBassVoicing" | "source" | "stradellaRegisterModel" | "laMelodiosaFollowStradellaRegisters">,
): SoundNote[] {
  // The configured octave mapping affects *sampled Stradella* notes only.
  // Treble playback, chord identity, search results, and synthesizer voicing
  // remain independent of this optional reproduction mode.
  const modeled = options?.source === "la-melodiosa" &&
    options.laMelodiosaFollowStradellaRegisters && options.stradellaRegisterModel
    ? options.stradellaRegisterModel : null;
  if (button.kind === "treble-note") {
    if (!button.pitchClass) return [];
    return [
      {
        pitchClass: button.pitchClass,
        octave: button.soundOctave ?? button.octave ?? 3,
        side: "treble",
      },
    ];
  }

  if (button.kind === "bass-root" || button.kind === "bass-counterbass") {
    if (!button.pitchClass) return [];

    if (modeled) {
      const note = nominalRegisterNote(button.pitchClass, modeled.bass);
      return note ? [{ pitchClass: note.pitchClass, octave: note.octave, side: "bass" }] : [];
    }

    const voicing =
      options?.source === "la-melodiosa"
        ? "single-low"
        : (options?.stradellaBassVoicing ?? "single-low");

    if (voicing === "single-middle") {
      return [{ pitchClass: button.pitchClass, octave: 3, side: "bass" }];
    }

    if (voicing === "low-and-middle") {
      return [
        { pitchClass: button.pitchClass, octave: 2, side: "bass" },
        { pitchClass: button.pitchClass, octave: 3, side: "bass" },
      ];
    }

    return [{ pitchClass: button.pitchClass, octave: 2, side: "bass" }];
  }

  const intervals = stradellaChordIntervals(button.kind);
  const root = button.chordRoot ?? button.pitchClass;
  if (!root || intervals.length === 0) return [];

  return intervals.map((interval) => {
    const pitchClass = transpose(root, interval);
    const nominal = modeled ? nominalRegisterNote(pitchClass, modeled.chord) : null;
    return {
      pitchClass,
      // One nominal pitch per chord tone. The source WAV may itself contain
      // octave-doubled reeds; transposition does not isolate those partials.
      octave: nominal?.octave ?? (options?.source === "la-melodiosa"
        ? 3
        : 3 + octaveShiftForTranspose(root, interval)),
      side: "bass" as const,
    };
  });
}

export function playButtonSound(button: DiagramButton, options: SoundOptions, timing?: NoteTiming) {
  playNotes(notesForButton(button, options), options, 0, timing);
}

/** Current AudioContext time in seconds, the clock timed players schedule on. */
export function audioClockNow() {
  return getAudioContext().currentTime;
}

/** Changes whenever stopAllSound() runs; lets a deferred start detect a Stop. */
export function currentPlaybackGeneration() {
  return playbackGeneration;
}

function sampleFilesForButtons(buttons: DiagramButton[], options: SoundOptions) {
  const files = new Set<string>();
  if (!options.enabled || options.source !== "la-melodiosa") return files;
  const seen = new Set<string>();
  for (const button of buttons) {
    if (seen.has(button.id)) continue;
    seen.add(button.id);
    for (const note of notesForButton(button, options)) {
      findLaMelodiosaRegion(note, options)?.samples.forEach((sample) => files.add(sample.file));
    }
  }
  return files;
}

/** True when every sample these buttons need is decoded (always true for the synth). */
export function samplesReadyFor(buttons: DiagramButton[], options: SoundOptions) {
  return [...sampleFilesForButtons(buttons, options)].every((file) => sampleBuffers.has(file));
}

/** Loads the samples these buttons need, so a transport can start on time.
 * Failed files are skipped here; playback reports them when it reaches them. */
export async function prepareSamplesFor(buttons: DiagramButton[], options: SoundOptions) {
  await Promise.allSettled([...sampleFilesForButtons(buttons, options)].map((file) => loadSample(file)));
}

function soundClockPorts(): AudioClockPorts {
  return { now: audioClockNow, push: (id) => activeTimeouts.push(id) };
}

export function playButtonSequence(
  buttons: DiagramButton[],
  options: SoundOptions,
  onDone?: () => void,
) {
  if (!options.enabled || buttons.length === 0) return;
  stopAllSound();
  const stepDelayMs = 60000 / Math.max(20, options.sequenceTempoBpm);
  const ports = soundClockPorts();
  const origin = audioTimelineOrigin(ports.now);

  buttons.forEach((button, index) => {
    scheduleAtAudioOffset(ports, origin, index * stepDelayMs, (when) =>
      playButtonSound(button, options, { at: when }));
  });
  if (onDone) {
    // The sequence ends one step after its last note starts.
    activeTimeouts.push(window.setTimeout(onDone,
      msUntilAudioTime(ports, origin + (buttons.length * stepDelayMs) / 1000)));
  }
}

export function playButtonCombination(
  buttons: DiagramButton[],
  options: SoundOptions,
) {
  if (!options.enabled || buttons.length === 0) return;
  stopAllSound();
  playNotes(buttons.flatMap((button) => notesForButton(button, options)), options);
}

/** Plays a sequence of Stradella button combinations as block chords. */
export function playButtonProgression(
  combinations: DiagramButton[][],
  options: SoundOptions,
) {
  if (!options.enabled || combinations.length === 0) return;
  stopAllSound();
  const stepDelayMs = Math.max(240, 60000 / Math.max(20, options.sequenceTempoBpm));
  const ports = soundClockPorts();
  const origin = audioTimelineOrigin(ports.now);

  combinations.forEach((buttons, index) => {
    if (buttons.length === 0) return;
    scheduleAtAudioOffset(ports, origin, index * stepDelayMs, (when) =>
      playNotes(buttons.flatMap((button) => notesForButton(button, options)), options, 0, { at: when }));
  });
}

export type ProgressionRhythmPattern = "block" | "oom-pah" | "waltz" | "march";

type ProgressionPlaybackCallbacks = {
  onActiveButtons?: (buttonIds: string[], progressionIndex: number) => void;
  onDone?: () => void;
};

/**
 * Plays optimized Stradella realizations with a small set of idiomatic rhythm
 * patterns. A caller may supply the exact pulse plan used for score notation.
 * Otherwise the shared planner derives it from the selected physical recipe.
 * Callbacks highlight only the physical buttons actually sounding.
 */
export function playButtonRhythmProgression(
  combinations: DiagramButton[][],
  options: SoundOptions,
  pattern: ProgressionRhythmPattern,
  callbacks: ProgressionPlaybackCallbacks = {},
  bassOverrides: DiagramButton[][] = [],
  pulseOverrides?: DiagramButton[][][],
) {
  if (!options.enabled || combinations.length === 0) return;
  stopAllSound();

  const beatMs = Math.max(240, 60000 / Math.max(20, options.sequenceTempoBpm));
  const beatsPerChord = pattern === "march" ? 4 : pattern === "waltz" ? 3 : pattern === "oom-pah" ? 2 : 1;
  const ports = soundClockPorts();
  const origin = audioTimelineOrigin(ports.now);
  // Each pulse lasts one beat; "block" holds the whole chord for its beat.
  const pulseDurationMs = beatMs * options.articulation;

  combinations.forEach((buttons, progressionIndex) => {
    const pulses = pulseOverrides?.[progressionIndex] ?? progressionPulsePlan(
      buttons, bassOverrides[progressionIndex] ?? [], pattern,
      (button) => Math.min(...notesForButton(button, options).map((note) =>
        note.octave * 12 + (PITCH_INDEX[note.pitchClass] ?? 0))),
    );

    pulses.forEach((pulse, beatIndex) => {
      const offsetMs = (progressionIndex * beatsPerChord + beatIndex) * beatMs;
      scheduleAtAudioOffset(ports, origin, offsetMs,
        (when) => {
          if (pulse.length === 0) return;
          playNotes(pulse.flatMap((button) => notesForButton(button, options)), options, 0,
            { at: when, durationMs: pulseDurationMs });
        },
        () => {
          // A silent pulse (rest) clears the highlight when its beat is reached.
          if (pulse.length === 0) callbacks.onActiveButtons?.([], progressionIndex);
          else callbacks.onActiveButtons?.(pulse.map((button) => button.id), progressionIndex);
        });
    });
  });

  const totalDuration = combinations.length * beatsPerChord * beatMs;
  const doneTimeout = window.setTimeout(() => {
    callbacks.onActiveButtons?.([], Math.max(0, combinations.length - 1));
    callbacks.onDone?.();
  }, msUntilAudioTime(ports, origin + totalDuration / 1000));
  activeTimeouts.push(doneTimeout);
}

export function playButtonArpeggioThenChord(
  buttons: DiagramButton[],
  options: SoundOptions,
) {
  if (!options.enabled || buttons.length === 0) return;
  stopAllSound();
  const stepDelayMs = 60000 / Math.max(20, options.sequenceTempoBpm);
  const ports = soundClockPorts();
  const origin = audioTimelineOrigin(ports.now);

  buttons.forEach((button, index) => {
    scheduleAtAudioOffset(ports, origin, index * stepDelayMs, (when) =>
      playButtonSound(button, options, { at: when }));
  });

  scheduleAtAudioOffset(ports, origin, buttons.length * stepDelayMs, (when) =>
    playNotes(buttons.flatMap((button) => notesForButton(button, options)), options, 0, { at: when }));
}

const stopListeners = new Set<() => void>();

/** Calls the listener after every stopAllSound(), including the one each new
 * playback start makes. Returns a function that removes the listener. */
export function onStopAllSound(listener: () => void) {
  stopListeners.add(listener);
  return () => { stopListeners.delete(listener); };
}

/** Stops scheduled playback and any currently ringing synth/sample voices. */
export function stopAllSound() {
  playbackGeneration += 1;
  activeTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  activeTimeouts = [];

  activeOscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      // Already stopped.
    }
  });
  activeOscillators = [];

  activeSampleSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  });
  activeSampleSources = [];
  stopListeners.forEach((listener) => listener());
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
/**
 * Plays an abstract chord as pitch classes inside the single Stradella chord
 * octave (C3-B3). This is used by Harmony Explorer so its audio follows the
 * same sampled/synth engine and bass register as the physical Stradella view.
 */
/**
 * Plays pitch classes in the Harmony Explorer's C3–B3 octave. Without `timing`
 * it is an immediate preview and silences anything already sounding. With
 * `timing` it is one step of a scheduled run: it starts at `timing.at` on the
 * audio clock, does not cut earlier steps, and block chords last
 * `timing.durationMs`.
 */
export function playHarmonyPitchClassChord(
  pitchClasses: string[],
  options: SoundOptions,
  style: "block" | "arpeggio" = "block",
  timing?: { at: number; durationMs?: number },
) {
  if (!options.enabled || pitchClasses.length === 0) return;
  if (!timing) stopAllSound();
  const unique = [...new Set(pitchClasses)].sort(
    (a, b) => (PITCH_INDEX[a] ?? 0) - (PITCH_INDEX[b] ?? 0),
  );
  const notes: SoundNote[] = unique.map((pitchClass) => ({
    pitchClass,
    octave: 3,
    side: "bass",
  }));

  if (style === "block") {
    playNotes(notes, options, 0, timing ? { at: timing.at, durationMs: timing.durationMs } : {});
    return;
  }

  const stepMs = Math.max(90, Math.min(260, 60000 / Math.max(40, options.sequenceTempoBpm) / 2));
  notes.forEach((note, index) => playNotes([note], options, index * stepMs,
    timing ? { at: timing.at + (index * stepMs) / 1000 } : {}));
}

/**
 * Demonstrates a harmonic relationship using the Stradella-compatible pitch
 * class octave: reference chord first, then the related chord. This avoids
 * importing piano-style octave/inversion assumptions into Harmony Explorer.
 */
export function playHarmonyRelationship(
  referencePitchClasses: string[],
  targetPitchClasses: string[],
  options: SoundOptions,
  style: "block" | "arpeggio" = "block",
) {
  if (!options.enabled || referencePitchClasses.length === 0 || targetPitchClasses.length === 0) return;
  stopAllSound();

  const makeNotes = (pitchClasses: string[]) =>
    [...new Set(pitchClasses)]
      .sort((a, b) => (PITCH_INDEX[a] ?? 0) - (PITCH_INDEX[b] ?? 0))
      .map((pitchClass) => ({ pitchClass, octave: 3, side: "bass" as const }));

  const referenceNotes = makeNotes(referencePitchClasses);
  const targetNotes = makeNotes(targetPitchClasses);

  if (style === "arpeggio") {
    const stepMs = Math.max(90, Math.min(260, 60000 / Math.max(40, options.sequenceTempoBpm) / 2));
    referenceNotes.forEach((note, index) => playNotes([note], options, index * stepMs));
    const targetStart = referenceNotes.length * stepMs + 180;
    targetNotes.forEach((note, index) => playNotes([note], options, targetStart + index * stepMs));
    return;
  }

  playNotes(referenceNotes, options);
  playNotes(targetNotes, options, Math.max(520, Math.round(options.noteDurationMs * 0.78)));
}

