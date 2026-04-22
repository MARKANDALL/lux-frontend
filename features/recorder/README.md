# features/recorder

The learner-audio pipeline: mic access, recording, audio-mode switching (push-to-talk vs. voice-activated), quality inspection, upload to `/api/assess`, and hand-off to `features/results` with the assessment payload. Boots from `src/main.js` via `initLuxRecorder` + `wireRecordingButtons`.

## Key Files

- `index.js` — The orchestrator: connects DOM ↔ Media ↔ API ↔ state. Exposes `initLuxRecorder`, `wireRecordingButtons`.
- `media.js` — MediaRecorder lifecycle: stream acquisition, start/stop, blob finalization.
- `ui.js` — DOM for the record button, timer, and state class swaps.
- `audio-mode.js` / `audio-mode-core.js` / `audio-mode-switch.js` — Audio-mode state machine (push-to-talk vs. auto-detect) and the mode-switch UI.
- `audio-inspector.js` — Captures upload metadata (endpoint, blob size, text) for debugging failed assessments; consumed by `_api/assess.js` via `AudioInspector.noteUpload`.

## Conventions

- Never call `fetch` directly here — `assessPronunciation` and `saveAttempt` come from `_api/`.
- State mutations go through `app-core/state.js` setters (`pushPartResult`, `beginPracticeRunIfNeeded`, etc.) so other features observe them.
- The recorder does not own results rendering — on a successful assessment it calls `showPrettyResults` from `features/results`.

## See Also

- [features/results/README.md](../results/README.md) — downstream consumer
- [features/passages/README.md](../passages/README.md) — source of current passage/part
- [_api/assess.js](../../_api/assess.js)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
