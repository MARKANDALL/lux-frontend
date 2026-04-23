# _api

Frontend API client helpers. This folder does **not** contain Vercel serverless functions — the actual backend lives in the separate `luxury-language-api` repo. These modules wrap `fetch` calls to that backend, attach the admin token where required, and own the client-side UID.

## Key Files

- `index.js` — barrel re-exporting the public client surface (assessment, AI feedback, attempts, identity, utilities).
- `util.js` — `API_BASE` resolution (dev proxy vs production host), `apiFetch()` — the single place that attaches `x-admin-token` to admin-gated routes — plus `jsonOrThrow` and `getAdminToken`.
- `assess.js` — `assessPronunciation({ audioBlob, text, firstLang })` posts to `/api/assess` and pipes uploads through `AudioInspector`.
- `attempts.js` — history/save/update helpers for practice attempts.
- `identity.js` — `getUID`, `ensureUID`, `setUID`; the canonical UID source for the frontend (guest-to-user migration on login).
- `voice-mirror.js` / `ai.js` / `convo-report.js` / `alt-meaning.js` — feature-specific endpoint wrappers.

## Conventions

- Always route new network calls through `apiFetch()` so the admin token is never forgotten.
- For JSON payloads pass `body: JSON.stringify(...)`; for audio use `FormData` and do **not** set `Content-Type`.
- Tests are colocated (`*.test.js`) and form part of the protection-ring suite — see `tests/` and `docs/ARCHITECTURE.md`.
- Folder name starts with `_` to sort above source folders in editors; it is not a private/hidden marker.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — how the frontend/backend split works
- [`app-core/lux-storage.js`](../app-core/lux-storage.js) — `K_ADMIN_TOKEN` lives here
- [`luxury-language-api`](https://github.com/MARKANDALL/luxury-language-api) — the backend this folder talks to
