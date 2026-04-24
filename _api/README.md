# _api

Frontend HTTP client for the Lux backend (the [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api) Vercel app). Every outbound call to Azure pronunciation assessment, GPT coaching, attempt persistence, voice cloning, and identity migration goes through one of these helpers — no `fetch` calls live in feature code.

`API_BASE` resolves to same-origin in dev (so the Vite proxy forwards `/api/*` to the backend) and to the production backend URL in builds. `apiFetch` injects the admin token from `lux-storage` for paid routes, and `jsonOrThrow` normalizes error shapes.

## Key Files

- `index.js` — public barrel; imports across the app go through here, never directly to the modules below.
- `util.js` — `API_BASE`, `apiFetch`, `jsonOrThrow`, and the `[AI]` debug logger.
- `assess.js` — uploads a recording blob to `/api/assess` for Azure pronunciation analysis; integrated with `AudioInspector`.
- `ai.js` — `fetchAIFeedback` posts the assessment result to `/api/pronunciation-gpt` for tiered coaching, QuickTips paging, and persona selection.
- `attempts.js` — `saveAttempt` / `fetchHistory` / `updateAttempt` for attempt persistence (used by recorder, dashboard, my-words).
- `identity.js` — single source of truth for the user UID (UUID generation, localStorage persistence, legacy-key migration).
- `convo.js`, `convo-report.js`, `voice-mirror.js`, `alt-meaning.js` — feature-specific endpoints.

## Conventions

- All modules live at the file root of `_api/` and are re-exported through `index.js`. Feature code should import from `../../_api/index.js` (or `../_api/...` from `src/`), not directly from individual files.
- Tests are colocated (`*.test.js`) and run by Vitest from the repo root.
- The folder is named `_api` (leading underscore) so it sorts above `admin/` and reads as low-level infrastructure.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the broader request/response flow
- [`app-core/lux-storage.js`](../app-core/lux-storage.js) for the admin-token key registry
