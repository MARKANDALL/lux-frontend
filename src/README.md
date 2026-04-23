# src

Per-page Vite entrypoints. Lux is a **multi-page app**, not a SPA — each HTML file in the repo root is paired with a bootstrap module here that imports and mounts the right features. Pages share primitives via `app-core/`, but do not share a runtime shell.

## Key Files

- `main.js` — Practice Skills (`index.html`): recorder, passages, results, onboarding, dashboard, auth, banner.
- `convo.js` — AI Conversations (`convo.html`): boots `features/convo`, TTS, auth, My Words launcher.
- `progress.js` — Progress dashboard (`progress.html`): history, rollups, attempt-detail modal.
- `wordcloud.js` — Wordcloud visualisation (`wordcloud.html`).
- `stream.js` / `stream-setup.js` — Realtime streaming page and its pre-flight setup page.
- `life.js` — Life Journey mission surface (`life.html`).
- `supabase.js` — shared Supabase client + `getCanonicalUID()`.
- `data/` — static data (passages, Harvard sentences, phoneme dictionaries, per-passage phoneme meta). Some blobs are lazy-loaded — see `data/index.js`.

## Conventions

- Each entrypoint calls `ensureUID()` early, mounts `initAudioSink()`, then wires features in a deliberate order (see `main.js` for the canonical example).
- Heavy blobs (Harvard, passage phoneme meta) are lazy-loaded from `data/index.js` — do not import them eagerly in a page entrypoint.
- Keep entrypoints thin — they wire features, they should not contain feature logic.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — page table and multi-page rationale
- [`features/`](../features/) — what each entrypoint actually mounts
- [`vite.config.js`](../vite.config.js) — multi-page Rollup input wiring
