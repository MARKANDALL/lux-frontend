# features/recorder

The microphone-capture orchestrator. Owns the DOM record/stop buttons, MediaRecorder lifecycle, Azure assessment dispatch, and the Normal/Pro audio-mode switch.

This is the first-touch surface for most attempts — every scored recording in Practice Skills goes through here.

## Key Files

- `index.js` — `initLuxRecorder`, `wireRecordingButtons`. The orchestrator that connects DOM ↔ Mic ↔ API ↔ State.
- `media.js` — MediaRecorder wrapper (start/stop, blob assembly, mic stream management).
- `ui.js` — DOM handles and visual state (record button, status, inline messaging).
- `audio-mode-core.js` — `AUDIO_MODES` (`NORMAL`/`PRO`) and the `<html data-lux-audio-mode="...">` hook that the CSS targets.
- `audio-mode-switch.js` — `mountAudioModeSwitch`. The UI toggle.
- `audio-mode.js` — audio-processing pipeline differences between modes (gain, filtering).
- `audio-inspector.js` — dev-time audio inspector for debugging capture issues.

## Conventions

- Recordings always go through `setLastRecording` in [app-core/runtime.js](../../app-core/runtime.js) — other features read from there.
- Audio mode is a global CSS hook (`<html data-lux-audio-mode>`) — don't couple individual components to the mode directly.
- After a successful attempt, the recorder calls `showPrettyResults` from [features/results/](../results/), `markPartCompleted` from [features/passages/](../passages/), and `mountAICoachAlwaysOn` from [ui/ui-ai-ai-logic.js](../../ui/ui-ai-ai-logic.js).

## See Also

- [_api/assess.js](../../_api/assess.js) — the Azure assessment call
- [features/results/](../results/) — where scored attempts are rendered
- [app-core/runtime.js](../../app-core/runtime.js) — last-recording + last-attempt state
