# features/voice-mirror

"Hear it in my voice." Clones the learner's voice once (ElevenLabs IVC) and then uses that cloned voice for TTS playback of target passages — a pedagogically strong self-modeling technique.

Two paths: a small inline button + audio player embedded in the TTS drawer, and a multi-step guided recording modal for creating the clone.

## Key Files

- `voice-mirror.js` — `mountVoiceMirrorButton`, `resetVoiceMirrorCache`. The runtime surface: checks profile status, synthesizes target text, plays it inline.
- `voice-onboarding.js` — `openVoiceOnboarding`. The multi-step recording modal with four prompt categories (Warm-up, Conversational, Descriptive, and one more) designed to elicit natural, consistent speech for high-quality cloning.

## Conventions

- Profile status is checked once per session (`_hasProfile` cache). Calls `resetVoiceMirrorCache()` invalidate it after onboarding completes.
- Target text can come from a string or a getter function — the button is mounted lazily inside places where the text isn't known at mount time (e.g. post-attempt summary).
- UID resolution follows the same rules as everywhere else: `window.LUX_USER_ID` first, then the DOM `data-uid` fallback.

## See Also

- [_api/voice-mirror.js](../../_api/voice-mirror.js) — backend calls (`getVoiceProfileStatus`, `synthesizeVoiceMirror`, `createVoiceClone`)
- [features/results/summary.js](../results/summary.js) — one of the primary mount points
