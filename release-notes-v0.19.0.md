### ABC Player

- New **Hands** choice: Stradella, Treble or **Both** (the default, saved in settings as `abcHands`). With Both, a two-voice tune plays voice 1 on the treble and voice 2 on the Stradella at the same time from one Play button, each mapped exactly as that side alone would map it.
- On wider screens both manuals are drawn in one diagram, treble above Stradella, at the same scale and width, captioned **Treble, voice 1** and **Stradella, voice 2**, without the title, bellows guide or row names. Both light up together as their notes sound, and **Download** saves the two-manual diagram. On phones a **Show** switch changes between the two manuals while both keep playing.
- Choosing Stradella or Treble under Hands, or in the top bar while the ABC Player is open, plays and shows that side only, as before. Single-voice tunes play on the current side.
- The first time the ABC Player opens with nothing loaded, it loads Happy Birthday, so both hands show right away.
- **Show notation** opens the staff notation in the Results panel on the right, scaled to fit, so the diagrams keep their space. Phones, or a hidden Results panel, keep it below the diagram.
- **Pause** keeps the last played buttons lit (one per hand with Both) instead of clearing them; **Continue** clears them and picks up from there.

### Annotate Diagram

- Selection, Fingering, Sequence and Annotate Diagram are now one tool, **Annotate Diagram**, with four click modes: Select, Finger, Sequence and Notes. A click on the diagram does only what the chosen mode does, and every mark (selection, finger numbers, sequence steps and notes) stays visible in all modes. With the tool closed, clicks only play the buttons.
- The separate switches **Selection on click**, **Click buttons to label** and **Record sequence** are gone; choosing the mode replaces them.
- In Finger mode the finger number is chosen from 1 to 5 instead of typed. It stays chosen after a click, so several buttons can take the same finger, and clicking a button that already shows that number removes it.
- The Selection, Fingering and Sequence guides are merged into the Annotate Diagram guide.

### Layout

- The Tools/Settings panel and the Results panel can be resized by dragging their edge next to the diagram, or with the arrow keys when the edge has focus. Double-click (or Enter) restores the default width. The diagram always keeps at least 480 px, and the widths are remembered in this browser.

### Fixes

- Labels such as Selected buttons, Arrow thickness, Distance from center and the ABC Player's File and Events no longer show a double colon.

### Settings files

- Settings files are now version 3. The retired `selectionOnClick` setting is dropped when older files are imported; `abcHands` is new.

### Internal

- `useAppController` is split by workspace into seven hooks (Accordion playback, Accordion notation, Harmony actions, Progression actions, Progression notation, settings transfer and diagram labels), plus pure side-button builders in `sideButtons.ts`. Behavior is unchanged.
