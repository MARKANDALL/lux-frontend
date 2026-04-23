# features/voice-mirror

The "hear it in your own voice" feature. After a 5-recording consent flow, Lux clones the learner's voice via ElevenLabs Instant Voice Cloning, then plays target sentences back in their own voice for self-comparison. Surfaces as a tile + custom player inside the TTS drawer.

## Key Files

- `voice-mirror.js` — tile + custom player (Play / speed / ±2s). Resolves target text from a string or getter, checks profile status, synthesises via `_api/voice-mirror.js`, and caches the result.
- `voice-onboarding.js` — multi-step guided recording modal with designed prompts (warm-up, conversational, descriptive, …) tuned for consistent natural speech. Calls `createVoiceClone()` when the set completes.

## Conventions

- The voice profile is per-user (backed by Supabase + ElevenLabs), RLS-enforced. Never try to play a clone before `ensureProfileChecked()` has resolved true.
- Clone synthesis is billable — gate callers behind the same admin-token protection as other paid routes; see `_api/util.js`.
- After a successful onboarding the cache must be reset via `resetVoiceMirrorCache()` so the tile flips from "Create" to "Play".

## See Also

- [`_api/voice-mirror.js`](../../_api/voice-mirror.js) — endpoint wrapper
- [`README.md`](../../README.md) — product-level Voice Mirror description
