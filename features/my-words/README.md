# features/my-words

My Words — a personal vocabulary tracker. A corner-launcher button mounts on every page; clicking it lazy-boots the full feature: a side panel, a library modal, and Supabase-backed persistence. Entries can be pinned, archived, and "sent" into Practice Skills or Convo via the `?mw=` URL prefill.

## Key Files

- `index.js` — `initMyWordsEverywhere()` / `initMyWordsGlobal()`. Mounts the side panel, the library modal, and the corner launcher. Lays out the panel to hug the Self-Playback drawer and the practice input.
- `boot.js` — `bootMyWordsLauncher()`. Mounts only the corner button synchronously and dynamically imports `index.js` on first click — avoids a circular import by keeping `index.js` ignorant of this file.
- `launcher.js` — The corner launcher button.
- `store.js` — In-memory store with pub/sub subscriptions. Persists to `K_MY_WORDS_PREFIX + uid` and remembers open state via `K_MY_WORDS_OPEN_PREFIX + uid` (prefix-based dynamic keys; the prefixes themselves are registered in `app-core/lux-storage.js`).
- `service.js` — Supabase CRUD: `fetchMyWords`, `upsertManyMyWords`, `setPinned`, `setArchived`, `deleteEntry`, `getAuthedUID`.
- `panel.js` / `panel-dom.js` / `panel-render.js` / `panel-events.js` / `panel-data.js` / `panel-utils.js` — The side panel shell, rendering, and events.
- `library-modal.js` / `library-modal-controller.js` — The full-library modal (search, pin/archive, send-to-practice).
- `normalize.js`, `stats.js`, `my-words.css` — Text normalization, per-word stats, styling.

## Conventions

- **Prefix-keyed storage.** Every entry key is `K_MY_WORDS_PREFIX + uid`. Don't introduce per-word keys — entries live inside the single JSON array.
- **Lazy launcher ↔ feature boundary.** `boot.js` is the only file that knows both `launcher.js` and `index.js`. External callers (`main.js`, `convo.js`, `stream.js`) must import from `boot.js`, not `launcher.js`.
- **Integration via `luxBus`.** The feature publishes its API on `luxBus.get('myWordsApi')` (`toggle`, `openLibrary`, …) so other features (Progress actions, Convo highlight) can drive it without importing it directly.

## See Also

- [app-core/lux-storage.js](../../app-core/lux-storage.js) — `K_MY_WORDS_PREFIX`, `K_MY_WORDS_OPEN_PREFIX`
- [src/main.js](../../src/main.js) — `?mw=` URL prefill handler
