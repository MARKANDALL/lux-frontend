# _api

Thin frontend wrappers around the `luxury-language-api` backend. Every outbound HTTP call to the Vercel-hosted API flows through this folder, so request shapes, admin-token handling, and API base resolution live in exactly one place.

## Key Files

- `index.js` — Public barrel: re-exports `assessPronunciation`, `fetchAIFeedback`, all `attempts.*` helpers, `getUID`/`ensureUID`/`setUID`, `API_BASE`, and `dbg`.
- `util.js` — `API_BASE` resolution (dev uses Vite proxy, prod hits `luxury-language-api.vercel.app`), `apiFetch`, `getAdminToken`, and `jsonOrThrow`.
- `identity.js` — Single source of truth for the user UID: generation, localStorage persistence, legacy-key migration, alias sync.
- `assess.js` — Posts learner audio blobs to `/api/assess` for Azure Pronunciation Assessment.
- `attempts.js` — `saveAttempt`, `fetchHistory`, `updateAttempt` against `/api/attempt`, `/api/user-recent`, `/api/update-attempt`.
- `ai.js`, `convo.js`, `voice-mirror.js`, `alt-meaning.js`, `convo-report.js` — feature-specific endpoint wrappers (GPT coaching, convo turns, ElevenLabs voice clone + synth, etc.).

## Conventions

- Every module imports `API_BASE` and `apiFetch`/`jsonOrThrow` from `util.js` — no feature is allowed to build its own URL base.
- Admin-token gating is handled by `apiFetch({ promptIfMissing, promptLabel })`; never read the token manually.
- Tests live alongside source (`attempts.test.js`, `identity.test.js`, `util.test.js`) per the repo-wide colocated-test convention.
- Folder is prefixed with `_` for historical sort-order reasons; imports use the `_api/` path from feature code.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — full frontend/backend wiring
- [app-core/lux-storage.js](../app-core/lux-storage.js) — `K_ADMIN_TOKEN`, `K_IDENTITY_UID` constants consumed here
- Backend repo: `luxury-language-api`
