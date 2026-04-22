# src

Vite entry points. Each file here boots a specific HTML page and wires together the features that page needs. The folder holds no business logic of its own — it is the seam between each page's `<script type="module">` and the feature modules under `features/`.

## Key Files

- `main.js` — Entry for `index.html` (the Practice page). Boots recorder, onboarding, passages, Harvard picker, results, dashboard drawer, auth UI, TTS, Self-Playback, ripple buttons, top-banner state.
- `convo.js` — Entry for `convo.html` (AI Conversation). Boots `features/convo`, audio sink, TTS, convo progress, auth UI.
- `life.js` — Entry for `life.html` (Life Journey). Mounts `features/life`.
- `stream.js` / `stream-setup.js` — Entries for the Realtime streaming page and its setup screen. Mount `features/streaming`.
- `progress.js` — Entry for the Progress Hub page. Mounts `features/dashboard` and the global My Words launcher.
- `wordcloud.js` — Entry for the wordcloud page. Boots `features/progress/wordcloud`.
- `supabase.js` — Constructs the shared Supabase client from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and exposes `getCanonicalUID()`.
- `data/` — Static data barrel: base passages, lazy-loaded Harvard passages, phoneme details, passage phoneme meta.

## Conventions

- Every entry begins with `ensureUID()` so every page shares one identity.
- Entries should only import and call — no inline business logic. Anything non-trivial belongs in `features/`.
- `data/index.js` uses lazy imports for Harvard and passage-phoneme-meta so first paint stays lean; do not break that by re-exporting them statically.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — multi-page-app wiring
- `vite.config.js` at the repo root for how entries map to pages
