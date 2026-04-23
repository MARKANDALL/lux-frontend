# features/recorder

The mic-capture and assessment orchestrator for Practice Skills. Connects DOM buttons, the Media Recorder, the assessment API, and the results renderer. Owns the Normal / Pro audio-mode switch and the AudioInspector diagnostics surface.

## Key Files

- `index.js` — the orchestrator: wires record / stop / skip buttons, coordinates `Mic` (media) + `DOM` (ui), calls `assessPronunciation` + `saveAttempt`, promotes last recording/attempt into `runtime.js`, and triggers results + AI coach mount.
- `media.js` — low-level `getUserMedia` + `MediaRecorder` wrapper.
- `ui.js` — recorder-specific DOM wiring (buttons, status text).
- `audio-mode-core.js` — canonical NORMAL / PRO enum and persistence.
- `audio-mode.js` — legacy lowercase compat layer (`normal` / `pro`) over the core enum.
- `audio-mode-switch.js` — UI switch component for toggling modes.
- `audio-inspector.js` — diagnostics capture (upload metadata, blob size, text, endpoint) used from `_api/assess.js`.

## Conventions

- Always feed uploads through `AudioInspector.noteUpload()` so inspector panels stay populated.
- New callers should use `audio-mode-core.js`; `audio-mode.js` exists only for legacy lowercase strings.
- The recorder is the sole writer of `setLastRecording` / `setLastAttemptId` — other features read from `app-core/runtime.js`.

## See Also

- [`_api/assess.js`](../../_api/assess.js) — assessment endpoint
- [`app-core/runtime.js`](../../app-core/runtime.js) — last-attempt / last-recording contract
- [`features/results/`](../results/) — renderer invoked after a successful assessment
