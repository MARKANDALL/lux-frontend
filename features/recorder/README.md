# features/recorder

The microphone capture + assessment pipeline used by the Practice Skills page (and reused on parts of Convo). Owns the record/stop UI, mic stream lifecycle, live level meter, MediaRecorder chunking, blob assembly, and the upload to `_api/assess`. Also handles the Audio Mode (NORMAL / PRO) toggle and the dev-only Audio Inspector.

## Key Files

- `index.js` — orchestrator. Connects DOM ↔ Media ↔ API ↔ State. Calls `assessPronunciation`, `saveAttempt`, then hands off to `features/results/`.
- `media.js` — `getUserMedia` capture, AnalyserNode-driven level meter, `MediaRecorder` lifecycle, final blob construction.
- `ui.js` — DOM accessors (`#referenceText`, `#record`, `#stop`, `#status`, `#recordingError`) and small UI state setters.
- `audio-mode.js` / `audio-mode-core.js` / `audio-mode-switch.js` — NORMAL / PRO mode toggle. Lowercase legacy enum (`normal`/`pro`) plus uppercase canonical core (`NORMAL`/`PRO`); `audio-mode.js` is the compat layer.
- `audio-inspector.js` — opt-in pipeline inspector (`?audioDebug=1` or `K_AUDIO_INSPECTOR`). Notes upload details, blob sizes, codec choices.

## Conventions

- All DOM access goes through `ui.js`'s `ui` getter object — never `document.querySelector` outside that file.
- Audio Mode reads/writes via `K_AUDIO_MODE` from `app-core/lux-storage`; do not duplicate the enum.
- Final blob is uploaded via `_api/assess.js`; never call `fetch` directly here.
- The shared playback `<audio>` element is in `app-core/audio-sink.js` — use it for review playback.

## See Also

- [`_api/assess.js`](../../_api/assess.js) — the upload endpoint client
- [`features/results/`](../results/) — receives the assessment response
- [`features/features/selfpb/`](../features/selfpb/) — Self-Playback that reads the same blob
