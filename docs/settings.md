# Settings Guide

Open **Settings** from the top bar. The panel shows only the sections that affect the current workspace:

- **Stradella and Treble:** Instrument, Notation, Music notation, Appearance, Sound, Title and About.
- **Harmony:** Appearance, Sound, Harmony and About.

Settings take effect immediately. To keep them, or to move them to another computer, use **Save settings JSON** in the About section (see **Saving and loading your settings** below).

## Toolbar and playback bar

The top bar keeps Stradella, Treble and Harmony on the left. Icon buttons, each with a tooltip, toggle the side controls (**Focus diagram**), the Results panel and sound. **Download** opens a menu with **Download SVG** and **Download PNG**; the format you use last is listed first and is also the format of **Download all diagrams (ZIP)**. Under each tool name in the Tools list, a one-line description says what the tool does. When the window is too narrow for the full toolbar, for example with the Results panel open, Settings, Tools, Show notation, Reset and Download turn into icons; hover over one to see its name.

### Panel widths

On wider screens you can drag the edge between the diagram and the Tools or Settings panel, and the edge between the diagram and the Results panel, to make either panel wider or narrower. When an edge has keyboard focus, the left and right arrow keys move it. Double-click an edge, or press **Enter** on it, to go back to the default width. The diagram always keeps enough room, and on a narrow window a wide panel gives way. The widths are remembered in this browser; they are not part of settings files, because a good width depends on the screen. Phones are unchanged.

Every player (ABC Player, Bass Pattern Player, Progression Assistant, Sequence in Annotate Diagram and the Harmony recording) uses one playback bar under the diagram, with **Play** (or **Continue** after Pause), **Pause** where the player supports it, and **Stop**. On phones it stays visible with the diagram when the Tools sheet is closed. While the needed La Melodiosa samples load, it shows **Loading sounds…** and starts as soon as they are ready.

## Phones and tablets

On narrow screens (up to 860 pixels wide) the diagram offers **Readable · scroll** and **Fit entire diagram**.

- **Readable · scroll** is the initial mobile/tablet view. The on-screen diagram is larger and scrolls horizontally to keep button targets readable. It opens centred on the C reference button and scrolls to the highlighted buttons when a chord, scale, selection or sequence changes, unless they are already in view.
- **Fit entire diagram** displays the whole keyboard at once, with smaller button targets.

This choice only changes what you see on screen. It is not saved, and it does not change downloads or sound.

On phones, the tools open in a sheet from the **Tools** button. Choosing a tool keeps the sheet open so you can use its controls; close it with **Close**, by tapping outside it or with Escape to see the diagram. Switching between Stradella, Treble and Harmony closes it. Help tips open with a tap.

## Keyboard

Diagram buttons can be used from the keyboard: **Tab** reaches the diagram, the arrow keys move between buttons (left and right along a row, up and down between rows), and **Enter** or **Space** acts like a click. Screen readers announce each button by name and row, for example "C, Root note".

## Interface language

Choose **Auto (browser)**, **English**, **Español**, **Français**, **Português (Brasil)**, **Italiano** or **Deutsch** at the top of the Settings panel. **Auto** follows your browser's preferred language and falls back to English. Portuguese is always Brazilian Portuguese.

The language changes the controls, tooltips, status lines, Harmony legends and generated chord explanations. These help guides stay in English. Changing the language never changes chords, note spelling, playback or the names of downloaded files.

## Instrument

Describes the accordion you are drawing.

- **Stradella side:** **Basses** (for example 48, 72, 96 or 120). A note explains how the chord buttons are built: seventh and diminished buttons have three notes and leave out the fifth.
- **Treble side:** the keyboard system (**C-system**, **B-system / Bayan** or **Piano keyboard**), the number of **Rows**, and **Treble size** or **Piano range**. The **1 octave** and **2 octaves** sizes centre on the highlighted buttons and grow to a larger size when a chord, scale or sequence needs more room.

### Stradella registers

The Chord Finder lists the notes of a realization from low to high, and works out which note is lowest, using a simple model of the bass mechanism: each bass button sounds one note and each chord button sounds one note per chord tone. Two groups set where those notes sit:

- **Bass / counterbass:** the **Starting octave** (1–4, default 2) and the **Grouping**.
- **Preset chords:** the **Starting octave** (2–5, default 3) and the **Grouping**.

**Grouping** chooses where each octave begins. With **C–B**, the bass notes run C2 to B2. With **F–E**, they run F2 up to B2 and then C3 to E3. The **Configured range** line shows the result.

These are model pitches, not measurements of a particular instrument. They change the note lists and inversion labels in the Chord Finder; with **La Melodiosa** and **Configured registers** (see **Sound** below), they also decide which recorded pitches you hear.

## Notation

- **Chord symbol style:** **C / Cm**, **CM / Cm** or **Cmaj / Cmin**. Used for chord labels everywhere: diagrams, Harmony Explorer, progression lists, titles and explanations.
- **Chord labels:** what chord buttons show: nothing, the chord name, the root only, the chord tones, the row function (M, m, 7) or a functional reference (I, iv, V7).
- **Pitch notation:** English, German or solfège note names, intervals, or blank labels.
- **Treble accidentals:** default spelling, prefer flats, prefer sharps or show both enharmonic names. The Stradella side keeps its own spelling.

## Music notation

Controls the staff notation shown under the diagram by the ABC Player, Bass Pattern Player, Sequence and Progression Assistant:

- **Include title**, **Include description** and **Include summary note** add text above or below the staff.
- **Limit bars per line** and **Bars per line** wrap long music onto several lines.
- **Chord text size**, **Notation scale**, **Staff width** and **Staff spacing** adjust the size and layout.

## Appearance

- **Interface density:** **Compact** or **Comfortable** spacing for the control panels.
- **Show status bar:** the summary line under the toolbar.
- **Diagram scale:** enlarges or reduces the diagram on screen. Above 100% the diagram may scroll.
- **Color theme:** Default blue, Classic ink, Pastel, Warm cream, High contrast or Print / grayscale. **Accidental buttons** chooses how sharps and flats look on chromatic keyboards.
- **Label font** and **Label font size** for the text on buttons.
- **Show / Hide** buttons for button labels, the bellows guide, Stradella row labels and octave numbers.
- **Button size**, **Spacing**, **Vertical spacing**, **Button line**, **Reference line**, **Chord fill** and **Treble angle** fine-tune the drawing.
- On a piano keyboard: **Piano key width**, **Piano key height**, **Black key width** and **Black key height**.

## Sound

- **Sound source:** **La Melodiosa**, a recorded accordion, or the built-in **Synthesizer**. La Melodiosa is the default.
- **Treble register** and **Bass register** (La Melodiosa): I (upper reed), II (lower reed) or III (both).
- **Sample pitch mapping** (La Melodiosa): **Configured registers** plays the pitches set under **Instrument → Stradella registers**; **Original mapping** keeps the sample set's own bass (C2–B2) and chord (C3–B3) ranges.
- **Voice**, **Stradella bass voicing**, **Waveform** and **Reed detune** shape the Synthesizer.
- **Volume**, **Attack** and **Release**.
- **Note duration:** how long a note sounds when you click a button, preview a chord or step through a sequence.
- **Note length in players:** how much of each written note sounds in the ABC Player, Bass Pattern Player, Progression Assistant and Harmony recording, from 30% (short, detached) to 100% (fully connected). The default is 85%. The button on the diagram stays lit for the same time.
- **Sequence tempo:** playback speed of a sequence in Annotate Diagram's Sequence mode.

Sound uses your browser's audio system. When La Melodiosa is selected and a note has no recording nearby, the nearest recording is played at a different speed to reach the pitch. If a recording cannot be loaded, that note is silent; the app never switches to the Synthesizer on its own.

### About the La Melodiosa samples

The **La Melodiosa** sample set was sampled, edited, and programmed by **Petri Pohjanmies (Finland), 2026**, and is distributed under the **Creative Commons Attribution (CC-BY)** license. Accordion-Tools preserves the supplied SFZ mapping details, including separate bass/treble registers, tuning offsets, relative levels, and treble sample alternation. The original README and preset files are retained in `public/samples/la-melodiosa/` together with an `ATTRIBUTION.txt` file.

## Title

**Title** chooses the heading drawn above the diagram (and used as the file name when you download it):

- **Contextual** (default): the active chord or scale and the selected realization.
- **Auto (instrument/layout):** the instrument and layout.
- **Custom:** your own text in **Custom title**.
- **None:** no title.

**Title font** and **Title size** set its look.

## Harmony

Shown in the Harmony workspace:

- **Diagram:** chord symbol style, segment separator lines, legend, explanation box, enharmonic equivalents, chord-tone tooltips, the inner note ring and coloring labels by chord family.
- **Outer rings:** which shared-note rings are drawn.
- **Circle diameter** and **Maximum font size**.
- **Playback:** **Chord playback** as a **Block** chord or an **Arpeggio**, and **Relationship playback** as the **Selected only** chord or **Reference → related**.

## About

Shows the version, the author, the sample credits and the license, and opens these guides with **Open documentation**. The documentation window has a topic list and a search box; links between guides open inside the window.

## Saving and loading your settings

In **About**:

- **Save settings JSON** downloads your current settings as `accordion-tools-settings.json`.
- **Load settings JSON** applies a saved file to the current session.

This is the easiest way to keep a backup or to use the same settings on another computer. Files saved by earlier versions of Accordion Tools still load; settings that no longer exist are ignored, and new settings keep their defaults.

## Reset

The **Reset** menu in the top bar has two actions: **Clear current work** clears the active selection and stops playback; **Restore current tool defaults** puts the open tool back to its starting values. Neither changes your Sound or Stradella register settings.

If you publish your own copy of the app and want different starting settings, see the [settings file reference](https://github.com/gilsag/Accordion-Tools/blob/main/docs/internal/settings-file-reference.md).

### Standard Stradella staff notation (shared preferences)

The **Music notation** section also controls how the generated Stradella left-hand scores are written:

- **Left-hand notation:** **Standard Stradella** (default) uses a *single written root note* for each preset chord button. **Expanded voicing** shows the selected realization's sounding pitches **in the Progression Assistant**, where registral analysis is available. The other Stradella teaching tools continue to use symbolic notation; imported ABC Player scores are displayed unchanged.
- **Chord-quality symbols:** **Show on every chord** (default) writes `M`, `m`, `7`, or `d` above each chord button, even when consecutive buttons share the same quality. **Show when quality changes** omits repeated identical labels.
- **Mark counterbass notes:** off by default. When enabled, a courtesy dash is drawn beneath counterbass notes in generated symbolic notation.

Written Stradella staff positions depend on **button pitch class and button function** (bass versus chord), not on the configured bass/chord reed register, sample transposition, or playback octave. Thus changing the instrument's audio register does not transpose its standard Stradella notation. A D on the third line of the bass staff may be either a bass or a chord; the chord-quality symbol identifies a D chord button.

These preferences participate in settings export/import and editable `default-settings.json`. When notation is visible, changes take effect in the displayed score and in the Bass Pattern Player's exported score ABC. The separate MIDI export and audio playback are unaffected.
