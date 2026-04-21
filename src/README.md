# src

Vite multi-page entry points. Lux is **not** a SPA — each product surface has its own HTML file and its own entry here. An entry script's job is small: `ensureUID()`, initialize the audio sink, wire auth, and mount the relevant feature.

Shared data (passages, phoneme metadata) also lives here under `data/`.

## Key Files

- `main.js` — Practice Skills (`index.html`). Wires passages, recorder, onboarding, dashboard, auth, arrow trail, top-banner state.
- `convo.js` — AI Conversations (`convo.html`). Boots `features/convo` and the TTS pipeline.
- `progress.js` — Progress Hub (`progress.html`). Initializes dashboard and global My Words.
- `wordcloud.js` — Wordcloud page (`wordcloud.html`). Boots `features/progress/wordcloud`.
- `stream.js` / `stream-setup.js` — Real-time streaming (`stream.html`, `stream-setup.html`). Boots `features/streaming`.
- `life.js` — Life Journey (`life.html`). Mounts `features/life`.
- `supabase.js` — Supabase client + `getCanonicalUID` helper that resolves authed UID, falling back to the guest UID owned by `_api/identity`.
- `data/` — passages, Harvard lists, phoneme metadata, lazy loaders. `data/index.js` is the barrel.

## Conventions

- One entry per HTML file. Entry scripts stay thin — they wire, they don't implement.
- Always call `ensureUID()` first so the identity layer is warm before any feature touches it.
- `data/` uses lazy imports for the big payloads (Harvard, passage phoneme meta) so first paint stays lean. Don't statically re-export them.
- New pages: add the HTML file at the repo root, add an entry here, register the input in [vite.config.js](../vite.config.js).

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — page → feature composition map
- [vite.config.js](../vite.config.js) — multi-page input registration
- [features/](../features/) — what these entries mount
