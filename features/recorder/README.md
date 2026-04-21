# features/recorder

The mic pipeline. Owns getUserMedia, the live level meter, MediaRecorder lifecycle, the final audio blob, the audio-mode switch (low-gain / high-gain presets), and the orchestration that connects the recording to assessment, saving, and results display.

## Key Files

- `index.js` — orchestrator. Wires DOM ↔ mic ↔ `_api/assessPronunciation` ↔ `saveAttempt` ↔ results. Exports `initLuxRecorder` / `wireRecordingButtons`.
- `media.js` — mic capture, MediaRecorder lifecycle, live level meter (`AudioContext` + `AnalyserNode`), final blob creation.
- `audio-mode.js`, `audio-mode-core.js`, `audio-mode-switch.js` — audio-constraint presets (`buildAudioConstraints`) and the UI switch that toggles between them. Persists via `K_AUDIO_MODE`.
- `audio-inspector.js` — `?audioDebug=1` inspector. Logs constraints, blob type/size, and upload endpoint; opt-in via URL flag or `K_AUDIO_INSPECTOR`.
- `ui.js` — recorder DOM accessors (timer, meter, buttons, status).

## Conventions

- **Always quality-gate.** The orchestrator skips assessment for empty or too-short blobs (see `assessPronunciation` front-end guard and duration tracking via `recordingStartTime`).
- **`setLastRecording` after every record.** Results view and self-playback both read from `app-core/runtime.js` — don't skip the publish step.
- **Audio mode persists.** Audio-mode choice is a learner preference; it's read/written via the `K_AUDIO_MODE` constant only.

## See Also

- [_api/assess.js](../../_api/assess.js) — the assessment endpoint this feature feeds
- [app-core/runtime.js](../../app-core/runtime.js) — where `lastRecording` is published
- [features/results/](../results) — next surface after a successful recording
