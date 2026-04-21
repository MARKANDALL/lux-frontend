# _api

The frontend's thin client layer over the [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api) backend. Every network call to the Lux API is wrapped here; feature code never hits `fetch` directly.

Grouped by concern: pronunciation assessment, AI coaching, attempt persistence, identity, voice-mirror, and shared HTTP utilities. `index.js` is the public surface — re-exports the small set of functions callers are expected to use.

## Key Files

- `index.js` — public barrel: `assessPronunciation`, `fetchAIFeedback`, everything from `attempts`, plus identity and `API_BASE`.
- `util.js` — `API_BASE` resolution (dev proxy vs prod origin), `jsonOrThrow`, `apiFetch`, and the `dbg` logger toggle.
- `identity.js` — canonical UID owner (generate, persist, migrate guest → authed). Single source of truth for `LUX_USER_ID`.
- `assess.js` — Azure pronunciation-assessment call used by Practice and Convo.
- `attempts.js` — `saveAttempt`, `fetchHistory`, `updateAttempt` — the persistence surface for every scored attempt.
- `ai.js` / `convo-report.js` / `voice-mirror.js` — GPT coaching, conversation reports, ElevenLabs voice clone endpoints.

## Conventions

- Folder is prefixed `_` so it sorts to the top and so the Vite config can whitelist it separately from `src/`.
- Test files (`*.test.js`) live next to the module they cover — these are protection-ring tests.
- New API calls go in a concern-named file (e.g. `ai.js`), then get re-exported from `index.js` — don't have callers import from a concern file directly.
- All requests go through `apiFetch` in `util.js` so admin-token injection and base-URL resolution stay centralized.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for how `_api` relates to the rest of the app
- Backend repo: [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api)
- [tests/](../tests/) — protection-ring tests for identity and util
