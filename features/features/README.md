# features/features

Two browser-audio features that share a peekaboo-tab pattern: **Self-Playback** (review your own recording with WaveSurfer) and **TTS** (hear the target sentence in a synthesized voice). Both render a side panel with a small tab that the user clicks to expand the heavier UI lazily.

The doubled-up `features/features/` path is a historical quirk — these started as separate sub-features and were grouped under one folder rather than promoted to the top-level `features/`.

## Key Files

- `08-selfpb-peekaboo.js` — lazy loader for Self-Playback. Builds the tab + panel shell immediately; loads the heavy WaveSurfer UI and its inner CSS only on first click.
- `selfpb/` — Self-Playback implementation: `core.js`, `controls.js`, `karaoke.js`, `waveform-logic.js`, `attach-learner-blob.js` (+ tests), `download-latest.js`, `shortcuts.js`, `media-events.js`, `ui.js`, `ui-sync.js`, `dom.js`, `styles/`.
- `tts/` — TTS implementation: `boot-tts.js`, `player-core.js`, `player-dom.js`, `player-ui/`, `tts-overlay.css`.
- CSS: `self-playback.css`, `selfpb-peekaboo.css`, `tts.css`, `tts-peekaboo.css`.

## Conventions

- Lazy-load anything heavy (WaveSurfer, large CSS) — the tab shell must stay cheap so it can be present on every page that has a learner recording.
- Reuse the shared `<audio id="playbackAudio">` from `app-core/audio-sink.js`; do not create new audio elements.
- Voice Mirror playback (cloned voice) lives in [`features/voice-mirror/`](../voice-mirror/), not here.

## See Also

- [`app-core/audio-sink.js`](../../app-core/audio-sink.js) — the shared hidden audio element these features write to
- [`features/voice-mirror/`](../voice-mirror/)
