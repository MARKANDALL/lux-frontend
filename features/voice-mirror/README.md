# features/voice-mirror

"Hear it in my voice." Optional voice-cloning feature: learners record a guided four-prompt sample, the backend creates an ElevenLabs IVC profile, and the TTS drawer then offers a button that synthesizes the target text in the learner's own voice. A pedagogically-strong technique for self-modeling.

## Key Files

- `voice-mirror.js` — mounts the inline "Hear it in my voice" button and audio player inside the TTS drawer. Caches `_hasProfile` across calls; exposes `mountVoiceMirrorButton` and `resetVoiceMirrorCache`.
- `voice-onboarding.js` — the multi-step guided recording modal. Ships four prompts (Warm-up / Conversational / Descriptive / Instructional) designed for natural, consistent speech, then posts audio to `createVoiceClone`.

## Conventions

- **Opt-in, not default.** The button only appears when `getVoiceProfileStatus()` reports an active profile (or right after a successful onboarding).
- **Four prompts is a product choice.** The prompt set is tuned for consistent prosody across styles — don't expand or shorten without auditing clone quality.
- **Strings must be trimmed before synthesis.** `resolveTargetText` normalizes input from either a string or a getter function.

## See Also

- [_api/voice-mirror.js](../../_api/voice-mirror.js) — the backend client this feature wraps
- [features/results/summary.js](../results/summary.js) — the summary view that mounts the button
