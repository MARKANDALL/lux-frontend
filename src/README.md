# src

Per-page Vite entry points. Lux is a multi-page app (MPA), so each HTML file at the repo root (`index.html`, `convo.html`, `life.html`, …) is paired with one entry script here. These files are intentionally thin — they do UID bootstrapping, mount the right feature(s), and wire page-level auth/ripple UI, then get out of the way.

## Key Files

- `main.js` — Practice Skills page entry. Boots recorder, onboarding, dashboard, auth, TTS, audio sink, and the results flow. The biggest entry by far.
- `convo.js` — AI Conversations page entry. Calls `bootConvo()`, wires auth, TTS, self-playback, My Words launcher.
- `stream.js` — Real-Time Streaming page entry. Mounts `features/streaming/app.js` into `#lux-stream-root`.
- `life.js` — Life Journey page entry. Mounts `features/life/app.js` into `#lux-life-root`.
- `progress.js` — Progress Hub entry. Mounts the dashboard in full-page mode plus the global My Words panel.
- `stream-setup.js` — setup screen for the streaming feature (scenario + voice + transport picker).
- `wordcloud.js` — standalone wordcloud page entry.
- `supabase.js` — single Supabase client used across pages for magic-link OTP auth.
- `data/` — static data dictionaries consumed at runtime: `passages.js`, `harvard.js`, `harvard-phoneme-meta.js`, `passage-phoneme-meta.js`, `phonemes/`, and the `index.js` barrel.

## Conventions

- **Thin entries.** Page scripts should mount features and wire page-wide UI, not contain business logic. If it grows, push it into `features/`.
- **Always `ensureUID()` first.** Every page entry imports from `_api/identity.js` and calls `ensureUID()` before any API-using code.
- **One entry per HTML.** Do not share entry files between pages — each page gets its own file so the bundler can split cleanly.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — page/entry map
- [features/](../features) — the actual feature modules each entry mounts
- [vite.config.js](../vite.config.js) — multi-page input wiring
