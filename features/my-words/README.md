# features/my-words

The My Words personal vocabulary tracker. Users save words from anywhere in the app (recorder, results, convo) into a side panel + library modal. Authed users sync to Supabase; guests stay local. The corner launcher mounts on every page and lazy-boots the rest of the system on first click.

## Key Files

- `index.js` — `initMyWordsGlobal({ uid, inputEl })`. Mounts panel, library modal, launcher, store wiring, and registers the external API.
- `boot.js` — `bootMyWordsLauncher()`. The wiring entry point that other pages call. Lazy-loads the full system on first launcher click.
- `launcher.js` — corner button on every page; subscribes to `luxBus` for badge counts.
- `store.js` — local store with persistence (`K_MY_WORDS_PREFIX` / `K_MY_WORDS_OPEN_PREFIX`), open-state memory, subscriptions, and entry mutations.
- `service.js` — Supabase persistence (authed users only): `fetchMyWords`, `upsertManyMyWords`, `setPinned`, `setArchived`, `deleteEntry`.
- `panel.js` + `panel-*.js` — side-panel render, events, data, dom, utils, render.
- `library-modal.js` / `library-modal-controller.js` — full-screen library modal that wraps the panel.
- `normalize.js` — `normalizeText`, `splitLines` for word de-duplication.
- `stats.js` — derived counts shown in the launcher and panel header.

## Conventions

- External pages must import from `boot.js` (not `launcher.js` directly) so the lazy wiring stays consistent.
- Local store keys are namespaced by UID via `K_MY_WORDS_PREFIX` — never store a global "all users" list.
- Authed sync goes through `service.js`; guests stay in `store.js`. The two paths must stay in sync via the store's subscription model.

## See Also

- [`src/supabase.js`](../../src/supabase.js) for the shared client
- [`app-core/lux-storage.js`](../../app-core/lux-storage.js) for the My Words key prefixes
