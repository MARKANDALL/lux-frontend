# features/features

Sub-surfaces that don't belong to one feature but aren't architecturally "core" either: the Self-Playback drawer (compare your recording against a reference with a waveform + AB loop + rate control) and the Text-to-Speech drawer (Azure neural voices for any highlighted text). Both mount as "peekaboo" drawers — a tab is visible immediately, the heavy UI only loads on first click.

## Key Files & Subfolders

- `08-selfpb-peekaboo.js` — Lazy loader for Self-Playback. Builds the panel shell + tab synchronously, then dynamically imports `selfpb/` and WaveSurfer on first open.
- `selfpb/` — Self-Playback engine. `core.js` (audio engine, AB loop, rate persistence, `luxBus.set('selfpbApi', …)`), `waveform-logic.js` (WaveSurfer wiring + `loadLearnerBlob`), `karaoke.js`, `controls.js`, `dom.js`, `ui-sync.js`, `download-latest.js`, `shortcuts.js`, `attach-learner-blob.js` (+ its test).
- `tts/` — Text-to-Speech. `boot-tts.js` (lazy mount), `player-core.js` (Azure TTS endpoint, 12+ voice ids like `en-US-AriaNeural`), `player-dom.js`, `player-ui/`.
- `self-playback.css`, `selfpb-peekaboo.css`, `tts.css`, `tts-peekaboo.css` — Drawer chrome + inner control styling.

## Conventions

- **Peekaboo pattern.** Tab + minimal panel shell load eagerly (small CSS); the heavy module + vendor library (WaveSurfer) loads on first open. Both drawers key on a guard like `document.getElementById("lux-tts-guard-style")` to avoid double-mount.
- **Read rate from `K_SELFPB_RATE`.** Persist playback rate via `app-core/lux-storage.js`, not bare localStorage.
- **`luxBus.get('selfpbApi')`** is the integration seam for passing the learner blob — see `app-core/audio-sink.js`.

## See Also

- [app-core/audio-sink.js](../../app-core/audio-sink.js) — how the learner blob gets into Self-Playback
- [public/vendor/wavesurfer-7.8.11.min.js](../../public/vendor/wavesurfer-7.8.11.min.js)
- [_api/util.js](../../_api/util.js) — shared TTS admin-token attachment
