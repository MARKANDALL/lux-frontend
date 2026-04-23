# _api

Thin frontend wrappers around the `luxury-language-api` backend. This folder does **not** contain Vercel serverless handlers — those live in the backend repo. Every module here is an ES-module helper that the frontend imports to talk to `API_BASE` (dev: same-origin proxy; prod: `https://luxury-language-api.vercel.app`). All admin-gated routes attach the `x-admin-token` via the shared `apiFetch` helper.

## Key Files

- `index.js` — Public barrel. Re-exports `assessPronunciation`, `fetchAIFeedback`, everything from `attempts.js`, and the identity + util helpers.
- `util.js` — `API_BASE` resolution, `apiFetch` (the only approved fetch path — auto-attaches admin token), `getAdminToken`, `jsonOrThrow`.
- `identity.js` — Single source of truth for user UID: `ensureUID` / `getUID` / `setUID`, with UUID validation, URL-param override, and three-key localStorage migration.
- `assess.js` — `assessPronunciation({ audioBlob, text, firstLang })` → Azure pronunciation assessment. Guards against zero-byte uploads and calls `AudioInspector.noteUpload`.
- `attempts.js` — `saveAttempt`, `fetchHistory`, `updateAttempt` (attach AI feedback to an existing attempt).
- `ai.js` — `fetchAIFeedback` for GPT coaching (Quick Tips + Deep Mode, persona, history injection).
- `convo.js`, `convo-report.js` — AI conversation turn + post-session report.
- `voice-mirror.js`, `alt-meaning.js` — ElevenLabs clone status/create/synth; alternate-meaning disambiguation.

## Conventions

- **Never call `fetch` directly for admin-gated routes.** Use `apiFetch` so the `x-admin-token` header is attached consistently.
- **Never read `localStorage` for keys in this folder.** Import key constants (`K_ADMIN_TOKEN`, `K_IDENTITY_UID`, …) from `app-core/lux-storage.js`.
- **UID precedence** (strongest → weakest) is defined in `identity.js`: `?uid=` → canonical key → `window.LUX_USER_ID` → alias key → legacy key → new UUID.
- Tests (`*.test.js`) live next to their modules and are part of the 59-test protection-ring suite.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — where this layer sits in the system
- [app-core/lux-storage.js](../app-core/lux-storage.js) — the key registry these helpers import from
- Backend: [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api)
