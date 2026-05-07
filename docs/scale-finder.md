# Scale Finder

Scale Finder highlights a scale path on the current diagram.

It works in both Treble and Stradella modes, but the behavior differs because the two sides of the accordion are organized differently.

## Treble Scale Finder

In Treble mode, Scale Finder highlights a one-octave scale path on:

- C-system chromatic button accordion
- B-system / Bayan chromatic button accordion
- piano keyboard

It uses the selected root and scale type, then marks the path on the diagram.

## Stradella Scale Finder

In Stradella mode, Scale Finder uses bass and counterbass note buttons only.

It tries to choose notes near the selected root and avoid unnecessarily large physical jumps. Some scales may not be available on smaller Stradella layouts.

## Supported scale types

- Major scale
- Natural minor scale
- Harmonic minor scale
- Major pentatonic scale
- Minor pentatonic scale
- Major blues scale
- Minor blues scale
- Chromatic scale

## Display modes

Scale paths can be shown as:

- numbers only
- straight arrows
- curved arrows
- numbers plus straight arrows
- numbers plus curved arrows

Numbers show scale-degree order. Arrows show physical movement.

## Playback

If sound is enabled, the current scale path can be played back.

## Export

Scale Finder markings are included in SVG/PNG downloads.

## Related settings

See [`settings.md`](settings.md) for:

- `scaleFinderDisplayMode`
- `soundEnabled`
- `notation`
- `accidental`
