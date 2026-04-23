# src

Vite multi-page entry points. Lux is **not** a SPA — each HTML file at the repo root (`index.html`, `convo.html`, `progress.html`, `stream.html`, `stream-setup.html`, `wordcloud.html`, `life.html`) loads exactly one module from this folder. These entries stay small: they compose features, they do not contain feature logic.

## Key Files

- `main.js` — Entry for Practice Skills (`index.html`). Boots audio sink, TTS, passages, Harvard picker, recorder, summary, dashboard, auth, onboarding, My Words, arrow-trail visuals, and the top-banner collapse state.
- `convo.js` — Entry for AI Conversations (`convo.html`). `ensureUID` → audio sink → TTS → auth → My Words → `bootConvo()` → `initConvoProgress()`.
- `progress.js` — Entry for the progress dashboard (`progress.html`). Boots My Words globally + `initDashboard()`.
- `stream.js` / `stream-setup.js` — Mount the streaming app / streaming setup UI into `#lux-stream-root` / `#lux-stream-setup-root`.
- `life.js` — Mounts Life Journey into `#lux-life-root`.
- `wordcloud.js` — Mounts the wordcloud page (`wordcloud.html`).
- `supabase.js` — Supabase client factory + `getCanonicalUID()` (authed > guest > null).
- `data/` — Curated passage data + Harvard lists + phoneme metadata (see `data/index.js`).

## Conventions

- **One entry per HTML file.** Vite's multi-page config keys off these.
- **Thin entries only.** Features live under `features/`. Entries compose, import, and call boot functions — they should not define feature logic inline.
- **Always call `ensureUID()` early.** Every entry that talks to the API needs a canonical UID before any feature boots.
- **Ripple polish last.** `bootRippleButtons()` is called at the bottom of most entries after the page DOM is assembled.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — "Vite multi-page app, not a SPA"
- [vite.config.js](../vite.config.js) — multi-page input wiring
- [features/](../features/)
