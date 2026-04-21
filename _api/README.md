# _api

Thin frontend client wrappers around the Lux backend (`luxury-language-api` on Vercel). Every network call the app makes to Lux-owned endpoints passes through this folder: pronunciation assessment, GPT coaching, conversation turns, attempt save/load, voice-mirror, and UID identity. The underscore prefix keeps the folder sorted to the top and signals "ingress/egress layer," not business logic.

## Key Files

- `index.js` — public barrel; re-exports the functions feature code is allowed to call (`assessPronunciation`, `fetchAIFeedback`, `saveAttempt`, `fetchHistory`, `getUID`, `API_BASE`, etc.).
- `util.js` — resolves `API_BASE` (Vite proxy in dev, prod URL in prod), wraps `fetch` as `apiFetch`, handles admin-token prompting, and exposes `dbg()` for opt-in `[AI]` logging.
- `assess.js` — POSTs a recording blob to `/api/assess` for Azure pronunciation assessment; front-end-guarded against empty audio.
- `ai.js` — POSTs to `/api/pronunciation-gpt` for GPT coaching sections (QuickTips, chunked reports, persona/history options).
- `identity.js` — single source of truth for UID: UUID generation, localStorage persistence, legacy-key migration, `ensureUID()` / `getUID()` / `setUID()`.
- `attempts.js` — `saveAttempt`, `fetchHistory`, `updateAttempt` against `/api/attempt`, `/api/user-recent`, `/api/update-attempt`.
- `convo.js` — validated `convoTurn` calls to `/api/convo-turn` (asserts shape: `assistant` string + exactly 3 `suggested_replies`).
- `voice-mirror.js` — voice-clone status / create / synthesize against the `/api/router?route=...` endpoint.

## Conventions

- Feature code must never call `fetch` directly for Lux endpoints — always go through `_api/`.
- Import from `_api/index.js` where possible; reach into specific files only when the barrel doesn't re-export what you need.
- Sibling `*.test.js` files (`attempts.test.js`, `identity.test.js`, `util.test.js`) are Vitest unit tests and run in the standard test suite.
- `K_ADMIN_TOKEN` (from `app-core/lux-storage.js`) is the canonical storage key for the admin token; do not invent new keys.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — how the frontend wires into the backend API
- [app-core/lux-storage.js](../app-core/lux-storage.js) — canonical storage key registry
- [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api) — the backend this folder talks to
