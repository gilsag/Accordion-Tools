# Annotate Diagram

Annotate Diagram marks up the diagram for practice sheets and lessons. It has four click modes: **Select**, **Finger**, **Sequence** and **Notes**. Open **Annotate Diagram** in the Tools panel, then choose a mode under **Click mode**.

## How clicks work

While Annotate Diagram is open, a click on the diagram does only what the chosen mode does:

- **Select** adds the button or key to the selection, or removes it.
- **Finger** writes the current finger number on the button.
- **Sequence** adds the button as the next step of the sequence.
- **Notes** opens a text note on the button, or on an empty spot of the diagram.

In Select, Finger and Sequence mode, each click also plays the button. Notes mode does not play, because the click opens the note editor.

Every mark stays on the diagram whichever mode is chosen, so you can select a few buttons, number them, draw a path through them and add notes, all on the same diagram. When Annotate Diagram is closed, clicks only play the buttons and the marks stay where they are.

Changing the layout or choosing **Clear current work** in the top bar menu clears all marks.

## Select

Selection marks an unordered group of buttons or keys. It is useful for marking notes to practice, showing a student which buttons to use, or checking how notes spread across a layout.

The panel lists the selected items with their row and column. Use **×** to deselect one item, **Clear selection** to start over, and **Play selection** to hear the group.

## Finger

Choose a finger number from 1 to 5 under **Fingering value**, then click buttons to label them. The number stays chosen, so you can click several buttons that take the same finger. Clicking a button that already shows that number removes it.

You can also apply the value to every selected button with **Apply to selected**, remove the numbers from the selected buttons with **Clear selected**, or remove every finger number with **Clear all**.

Finger numbers can be shown inside the button near the bottom, inside near the top, or above the button. For dense Stradella layouts, above the button is often easier to read; for piano or larger treble diagrams, inside placement is more compact.

## Sequence

A sequence is an ordered path of buttons or keys, useful for melodies, scale paths, arpeggios, exercises and left-hand bass movement. Click buttons in order; repeated buttons are allowed.

Sequences can show numbers, straight arrows, curved arrows, or numbers plus arrows. You can change the arrow color, arrow thickness, arrowhead size, number color, number position and number size. **No numbers** hides the step numbers and keeps the arrows.

In Sequence mode, the playback bar under the diagram plays the sequence in order. Playback is an audible check of the path rather than a full performance engine. **Clear sequence** removes all steps.

Scale Finder draws a scale path automatically; Sequence mode is better when you want a custom path.

### Notation

When the sequence has at least one step, the top toolbar shows **Show notation** in Sequence mode. The notation is a simple quarter-note sketch of the button order, meant as a quick reading aid. In Stradella mode, bass and counterbass notes sit at or below the bass-clef middle line D and chord buttons sit above it, as in the Bass Pattern Player. The notation panel has **Download SVG**.

## Notes

Notes adds text directly to the diagram.

1. Choose the button position and text style for new notes: **Text size**, **Distance from center**, **Bold**, **Italic**, color and font.
2. Click a button or an empty spot of the diagram.
3. Type the note on the diagram.
4. Press **Enter** to save, **Shift+Enter** for a new line, or **Esc** to cancel.

Notes on a button can sit at the center, top, bottom, left, right or one of the four corners. **Distance from center** sets how far a non-center note sits from the button center (default 50%). Notes on an empty spot are free labels, useful for titles or explanations about a larger area.

The style settings are stored with each note when you create it, so changing the controls later affects only new notes.

The panel lists all notes with a short preview and location. Use **×** to delete one note, or **Clear annotations** to remove them all.

## Export

Selection, finger numbers, sequence marks and notes are all part of the diagram, so they are included in SVG and PNG downloads.

## Related settings

Under [Settings](settings.md), **Sound** sets what you hear when you click a button, and the sequence playback tempo.
