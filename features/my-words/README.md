# features/my-words

Personal vocabulary tracker. Lives as a bottom-left drawer plus a full Library modal (Active / Archived tabs). Words can be sent to practice, looked up on Word Reference / Youglish, pinned, archived, or deleted, and sync through Supabase for signed-in users.

## Key Files

- `index.js` — mount point: wires the store, panel, library modal, corner launcher, and registers the external API (`fetchMyWords`, `upsertManyMyWords`, pin/archive/delete).
- `store.js` — local store with persistence (`K_MY_WORDS_PREFIX` dynamic keys), subscriptions, and entry mutations.
- `panel.js` + `panel-dom.js` / `panel-render.js` / `panel-events.js` / `panel-data.js` / `panel-utils.js` — compact drawer rendering & event binding.
- `library-modal.js` / `library-modal-controller.js` — full library overlay with tabs and row actions.
- `service.js` — Supabase CRUD (`getAuthedUID`, `fetchMyWords`, `upsertManyMyWords`, pinning, archiving).
- `boot.js` / `launcher.js` — the lazy corner launcher that loads the full feature on click.
- `normalize.js` / `stats.js` — text normalisation + count helpers.

## Conventions

- Dynamic storage keys use the `K_MY_WORDS_PREFIX` / `K_MY_WORDS_OPEN_PREFIX` constants — do not hand-build prefixes.
- Drawer anchors to the Self Playback panel top edge and hugs the left edge of `#referenceText`; layout is recalculated on viewport changes.
- Corner launcher is loaded eagerly; the full panel + modal are behind the launcher to keep the first paint lean.

## See Also

- [`src/supabase.js`](../../src/supabase.js) — the Supabase client
- [`features/convo/`](../convo/) — uses the My Words launcher on the conversation page
