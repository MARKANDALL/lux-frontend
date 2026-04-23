# features/voice-mirror

Voice Mirror — Lux's distinctive feature. After a 5-recording consent flow, the learner's voice is cloned via ElevenLabs Instant Voice Cloning and any target sentence can be played back **in the learner's own voice**. Pronunciation practice becomes self-comparison rather than chasing a native-speaker reference.

## Key Files

- `voice-mirror.js` — The "Hear it in my voice" button + inline audio player that attaches to the TTS drawer. Caches profile status, resolves target text (string or getter), calls `synthesizeVoiceMirror`, decodes the returned base64 audio, and offers a re-record entry point.
- `voice-onboarding.js` — Multi-step guided recording modal. Five prompt templates (Warm-up, Conversational, Descriptive, Instructional, Expressive) with natural-speech guidance, per-recording preview/re-record, final submit via `createVoiceClone`. On success, invalidates the voice-mirror cache so the next playback goes through the cloned profile.

## Conventions

- **Profile state is cached module-locally.** `_hasProfile` is `null` → unknown, then `true` / `false`. Invalidate via `resetVoiceMirrorCache()` after a new clone is created.
- **Prompts are hand-chosen for clone quality.** The five templates are designed to capture warm-up, conversational, descriptive, instructional, and expressive samples. Don't reorder or rewrite without knowing the effect on clone quality.
- **Admin-token gated.** Clone create and synth both hit `_api/voice-mirror.js`, which routes through `apiFetch` — the token attachment is not local to this feature.

## See Also

- [_api/voice-mirror.js](../../_api/voice-mirror.js) — API surface (status, create, delete, synthesize)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — Voice Mirror lifecycle
- Backend: [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api) — ElevenLabs IVC + Supabase RLS persistence
