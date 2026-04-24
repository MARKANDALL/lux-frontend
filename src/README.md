# src

Page entry points for the Vite multi-page app. Each `*.html` at the repo root pairs with a `src/<page>.js` here that wires `_api/identity`, the auth UI, the audio sink, and that page's main feature module(s). These files are intentionally thin — the heavy lifting lives in `features/`.

## Page Entry Points

| HTML | Entry | Purpose |
|---|---|---|
| `index.html` | `main.js` | Practice Skills (recorder + results) |
| `convo.html` | `convo.js` | AI Conversations |
| `progress.html` | `progress.js` | Progress dashboard |
| `wordcloud.html` | `wordcloud.js` | Wordcloud visualization |
| `stream.html` | `stream.js` | OpenAI Realtime streaming |
| `stream-setup.html` | `stream-setup.js` | Stream configuration |
| `life.html` | `life.js` | Life Journey |

## Other Files

- `supabase.js` — single shared Supabase client, reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env`. Used by auth UI and per-feature persistence (My Words, Voice Mirror).
- `data/` — static passage/phoneme data; see [`src/data/`](./data/) for layout and lazy-load patterns.

## Conventions

- Every page entry calls `ensureUID()` from `_api/identity.js` before mounting features — the UID must exist by the time any feature reads it.
- Page entries import features via barrel exports (e.g. `features/convo/index.js`), never reach into a feature's internals.
- New pages should be added to `vite.config.js`'s `rollupOptions.input` so the multi-page build picks them up.

## See Also

- [`vite.config.js`](../vite.config.js) for the multi-page build configuration
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
