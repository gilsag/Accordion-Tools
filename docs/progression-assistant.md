# Stradella Progression Assistant

The **Progression Assistant** finds a good way to play a chord progression on the Stradella bass: for each chord it picks a combination of buttons, and it chooses them so that your hand moves as little as possible and the harmony flows smoothly from chord to chord.

## Opening the tool

Choose **Stradella** in the top bar, then open **Tools → Progression Assistant**. The tool is only available on the Stradella side, because it works with the positions of the bass and chord buttons.

## Building a progression

Choose how to enter chords with **Manual / Use preset**:

- **Manual:** pick a **Root** and a **Chord type**, then **Add chord**. All 35 chord types of the Chord Finder are available, including add9, 9th, 11th and 13th chords.
- **Use preset:** pick one of the progressions also used by the Bass Pattern Player and a key, then **Load preset**. This replaces the current list. Presets that use chords the assistant cannot place yet (such as secondary dominants or minor-key numerals) are marked as unsupported and cannot be loaded.

You can also send chords from Harmony Explorer: select a relationship there and choose **Add relationship to Progression**.

Switching between Manual and Use preset keeps your current progression.

### Editing the list

Each chord row has:

- **↑** and **↓** to move the chord earlier or later, and **×** to remove it;
- **← / →** to choose how that chord is played (see below);
- an **eye** button that shows the chord's explanation on the diagram.

**Clear** removes the whole progression.

Some chords cannot be played at all on a given bass layout. They are reported as unavailable; the assistant never swaps in a simpler chord.

## How the assistant chooses

For every chord, the assistant starts from the Chord Finder's ranked list of ways to play it. In **Auto**, it then looks at the whole progression at once and picks the combination with the best balance of:

- how highly the Chord Finder ranks each choice;
- **Hand movement:** how far your hand travels between chords;
- **Harmonic voice leading:** how few notes change between chords.

The two sliders set how much the last two matter. At 0% for both, every chord simply uses its top-ranked option. Raising **Hand movement** favours choices close to the previous chord; raising **Harmonic voice leading** favours choices that keep notes in common. These are practical rules of thumb, not measurements of real hands or reeds.

### Choosing a realization yourself

Use **← / →** on a chord row to step from **Auto** through every playable option for that chord. Each option shows its original Chord Finder rank. Picking one fixes that chord; the assistant then re-plans the other chords around it. Go back to **Auto** to release it.

Your choice stays with the chord when you reorder the list. It is cleared when you remove the chord, load a new progression, or change the bass layout so that the option no longer exists. These choices are not saved in the settings file.

## Explanations on the diagram

Press the **eye** next to a chord to show the same explanation lines as the Chord Finder (harmonic identity, pitch classes, physical buttons and registral voicing) under the diagram, and in downloaded images. Press it again to hide them; pressing another chord's eye moves the explanation there. Only one chord shows its explanation at a time, and it is hidden while the progression plays so it does not get confused with the buttons sounding.

Clicking a chord in the Results panel also selects it.

## Results

The Results panel shows, for the chosen plan:

- the buttons used for each chord;
- the total and per-step harmonic motion and hand movement;
- whether any chord leaves out a note;
- the notes shared between neighbouring chords.

With **Show path on diagram** turned on, the diagram numbers each chord's button (a button used by several chords shows, for example, **1·4**) and draws dashed arrows from step to step. The numbers match the Results panel. The path is off by default and is included in downloads when shown.

## Playback

**Play** and **Stop** are in the playback bar under the diagram. Playback uses your sound settings, including La Melodiosa, and lights up the buttons as they sound. The tool has its own tempo control and four rhythms:

- **All buttons together:** each chord as a single block.
- **Basic oom-pah (2/4):** the lowest bass on beat 1, the rest of the chord on beat 2.
- **Waltz (3/4):** the lowest bass on beat 1, the rest on beats 2 and 3.
- **March (4/4):** the lowest bass on beat 1, the rest on beats 2, 3 and 4.

"Lowest bass" means the lowest bass or counterbass button in the chosen option, according to the register model in **Settings → Instrument**. If an option has several bass buttons, the others join the chord on the later beats. If an option uses only chord buttons, the root bass is added on beat 1. If it uses only bass buttons, the later beats are silent rather than repeating the bass. For Em7 played as **E counterbass + G major**, for example, E counterbass sounds on beat 1 and G major on the following beats.

**Note length in players** in **Settings → Sound** sets how long each beat sounds.

### Staff notation

When there is something to play, the top toolbar offers **Show notation**, which draws the progression in the chosen rhythm as staff notation below the diagram. It can be downloaded as SVG.

## Progression Assistant and Harmony Explorer

Harmony Explorer shows **which chords are related and why**. The Progression Assistant shows **how to play a sequence of them efficiently on the Stradella bass**. Harmonically, an E bass and an E counterbass are the same note; the assistant decides which of the two is more convenient.
