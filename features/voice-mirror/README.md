# features/voice-mirror

Lux's distinctive feature: after a 5-recording consent flow, the learner's voice is cloned via ElevenLabs Instant Voice Cloning. Target sentences then play back in the learner's own voice (via `eleven_multilingual_v2`), so pronunciation practice becomes self-comparison instead of chasing an unreachable native-speaker reference.

## Key Files

- `voice-mirror.js` — the "Hear it in my voice" tile + custom audio player (Play / speed / ±2s) for the TTS drawer. Uses `_api/voice-mirror.js` (`getVoiceProfileStatus`, `synthesizeVoiceMirror`). `mountVoiceMirrorButton` is the entry point used by the results summary.
- `voice-onboarding.js` — multi-step guided recording modal that captures 5 consistent prompts (warm-up, conversational, descriptive, …) and uploads them via `createVoiceClone`.

## Conventions

- Voice profile state is fetched lazily and cached in module scope (`_hasProfile`); `resetVoiceMirrorCache` invalidates it after onboarding completes.
- Target text resolution accepts a string or a getter function — features that mount the button can pass a live getter to follow user input.
- All ElevenLabs calls go through `_api/voice-mirror.js`; never call ElevenLabs directly from feature code.
- The clone lifecycle (existence check, creation, deletion) is owned end-to-end by `_api/voice-mirror.js` — this folder only renders UI and reads status.

## See Also

- [`_api/voice-mirror.js`](../../_api/voice-mirror.js) — backend client for clone create / synthesize / status
- [`features/features/tts/`](../features/tts/) — the standard (non-cloned) TTS player this lives next to in the results drawer
