# features/voice-mirror

The "hear it in my voice" feature. After a one-time five-recording consent flow, Lux clones the learner's voice via ElevenLabs Instant Voice Cloning and synthesizes target sentences in their own voice — pronunciation practice becomes self-comparison instead of chasing a native-speaker reference.

## Key Files

- `voice-mirror.js` — The drawer-level "Hear it in my voice" button and inline audio player. Resolves a target-text source, checks the learner's voice profile via `getVoiceProfileStatus`, requests TTS via `synthesizeVoiceMirror`, and plays the result.
- `voice-onboarding.js` — `openVoiceOnboarding()` — the multi-step guided recording modal that captures the five consent samples, uploads them via `createVoiceClone`, and invalidates the voice-mirror cache on success.

## Conventions

- API calls flow through `_api/voice-mirror.js`; never invoke ElevenLabs or the backend directly.
- A learner is either profiled or not; this feature never assumes a partial profile state.
- Prompt texts in `voice-onboarding.js` are tuned for natural, consistent phrasing — do not swap them lightly, voice clone quality depends on them.

## See Also

- [_api/voice-mirror.js](../../_api/voice-mirror.js)
- [features/features/tts/](../features/tts/) — the TTS drawer surface that embeds this button
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
