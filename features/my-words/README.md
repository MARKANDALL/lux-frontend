# features/my-words

Personal vocabulary tracker. The learner saves words they want to practice; those words surface in a corner launcher, a side panel (compact + full views), a library modal with Active/Archived tabs, and they feed back into Practice Skills as targeted drills.

Persists per-user via Supabase-authed UID; falls back to a local store for guest users. Heavy module — split into data/rendering/events/DOM files.

## Key Files

- `index.js` — `initMyWordsGlobal`, public store bootstrap. Mounts panel + library modal + launcher.
- `panel.js` — the side panel: compact + Active/Archived tabs + library gateway button.
- `library-modal.js` / `library-modal-controller.js` — the full-screen library modal.
- `launcher.js` — corner launcher button with count badge.
- `service.js` — Supabase-backed API (`fetchMyWords`, `upsertManyMyWords`, `setPinned`, `setArchived`, `deleteEntry`).
- `store.js` — in-memory cache + reactive updates via `luxBus`.
- `panel-data.js` / `panel-dom.js` / `panel-events.js` / `panel-render.js` — split-responsibility files for the panel.
- `normalize.js` / `stats.js` — word normalization and count computation.

## Conventions

- Authed users go to Supabase via `service.js`. Guests use prefix-based keys in localStorage (prefixes exported from [app-core/lux-storage.js](../../app-core/lux-storage.js)).
- Archived ≠ deleted — archiving hides from Active without losing history. Only Delete actually removes.
- Panel splits: `-data` (queries/derivations), `-dom` (markup), `-events` (handlers), `-render` (mount/update). Keep that split when editing.

## See Also

- [app-core/lux-storage.js](../../app-core/lux-storage.js) — key prefixes for guest storage
- [features/progress/](../progress/) — Progress Hub surfaces the "My Words Library" gateway button
