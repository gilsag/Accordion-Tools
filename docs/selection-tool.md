# Selection Tool

The Selection Tool marks individual accordion buttons or piano keys on the diagram.

It is useful for:

- marking notes to practice
- showing a teacher/student which buttons to use
- building a temporary set of buttons for playback
- checking how notes are distributed across a layout

## Opening the tool

The Selection Tool is available from the Tools panel in both Stradella and Treble modes.

Tools start collapsed by default. Open **Selection** to see the selected items and playback controls.

## Selecting buttons or keys

Selection-on-click can be enabled or disabled. When enabled, clicking a diagram button/key toggles its selected state.

When disabled, clicks do not change selection unless another tool uses the click for its own purpose.

## Selected item list

The tool shows the selected buttons/keys so you can review what is currently marked.

You can clear the selection when you want to start over.

## Playback

If sound is enabled, selected items can be played back.

Playback is synthetic and intended for reference. It is useful for checking whether selected notes or buttons match the sound you expect.

## Diagram export

Selected buttons are included in SVG/PNG diagram exports because they are part of the visible diagram state.

## Related settings

See [`settings.md`](settings.md) for:

- `selectionOnClick`
- `soundEnabled`
- `downloadFormat`
