# features/recorder

Mic capture + MediaRecorder lifecycle for Practice Skills and Convo. Connects DOM ↔ media ↔ `_api/assess` ↔ state, with quality guardrails (minimum duration, minimum score-to-save) and an audio inspector for diagnosing upload issues. Also owns the NORMAL/PRO audio-mode switch that changes `getUserMedia` constraints.

## Key Files

- `index.js` — Orchestrator. `initLuxRecorder`, `wireRecordingButtons`. Runs the full attempt lifecycle: start recording → stop → `assessPronunciation` → `showPrettyResults` → `saveAttempt` → `mountAICoachAlwaysOn` → `markPartCompleted`. Enforces `MIN_DURATION_MS = 1500` and `MIN_SCORE_TO_SAVE = 10`.
- `media.js` — `navigator.mediaDevices.getUserMedia`, AudioContext level meter, `MediaRecorder` wrapper, final Blob assembly.
- `ui.js` — DOM accessors and class toggles for `#recordBtn`, `#stopBtn`, `#recMeter`, `#recStatus`.
- `audio-mode.js` / `audio-mode-core.js` / `audio-mode-switch.js` — NORMAL vs PRO mode. Core owns `K_AUDIO_MODE` persistence + `<html data-lux-audio-mode>` attribute; `audio-mode.js` maps modes to `getUserMedia` `audio` constraint objects (echo cancellation / noise suppression toggles); `audio-mode-switch.js` renders the toggle UI on Practice and Convo.
- `audio-inspector.js` — Hidden diagnostic panel. Captures upload details (endpoint, filename, blob, text) and surfaces them behind `K_AUDIO_INSPECTOR`. Invaluable for "why is my score 0" debugging.

## Conventions

- **Guardrails are non-negotiable.** Recordings under 1.5s or scoring under 10 are discarded from history — they are almost always accidental taps or corrupt audio.
- **State via `app-core/state.js` + `runtime.js`.** `setLastAttemptId`, `setLastRecording` so the AI Coach and Self-Playback can pick them up.
- **Inspector is opt-in.** Controlled by `K_AUDIO_INSPECTOR` flag; do not enable by default in production.

## See Also

- [_api/assess.js](../../_api/assess.js) — the one POST this feature makes
- [features/results/](../results/) — renders what comes back
- [app-core/runtime.js](../../app-core/runtime.js) — `lastAttemptId` / `lastRecording` hand-off
