# features/my-words

Personal vocabulary tracker. Learners save words/phrases into a side panel and a library modal; entries can be pinned, archived, and surfaced back into practice. Stored locally for guest users and in Supabase for authenticated users.

## Key Files

- `index.js` — `initMyWordsGlobal({ uid, inputEl })` — the public mount. Wires the side panel, library modal, launcher, store, and external API.
- `boot.js` — lightweight `bootMyWordsLauncher()` used by non-Practice pages that only need the corner launcher, not the full panel.
- `store.js` — local-only store (add/remove/update/subscribe) persisted via the `K_MY_WORDS_PREFIX` / `K_MY_WORDS_OPEN_PREFIX` key prefixes.
- `service.js` — Supabase persistence for authenticated users: `fetchMyWords`, `upsertManyMyWords`, `setPinned`, `setArchived`, `deleteEntry`.
- `panel.js` + `panel-*.js` — side panel UI (data, DOM, events, render, utils).
- `library-modal.js` + `library-modal-controller.js` — the full-screen library modal.
- `launcher.js` — corner launcher button that opens the panel/modal on demand.
- `normalize.js` — `normalizeText` / `splitLines` shared by store and service.
- `stats.js` — per-user totals and counters.

## Conventions

- **Guest = local, authed = Supabase.** `service.js` is only called when `getAuthedUID()` returns a UID. The two stores are kept in sync on sign-in.
- **Key prefixes, not bare strings.** All local keys must be derived from `K_MY_WORDS_PREFIX` / `K_MY_WORDS_OPEN_PREFIX` in `app-core/lux-storage.js`.
- **Panel is idempotent.** `mountMyWordsPanel` guards against double-mount; safe to call from multiple page entries.

## See Also

- [app-core/lux-storage.js](../../app-core/lux-storage.js) — key prefixes live here
- [src/supabase.js](../../src/supabase.js) — the shared Supabase client
