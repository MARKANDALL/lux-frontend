# features/my-words

The learner's personal vocabulary tracker: a bottom-left side panel (on Practice) and a full library modal (from Progress Hub) for saving, pinning, archiving, and re-practicing trouble words. Integrates with the dashboard and attempts history.

## Key Files

- `index.js` — `initMyWordsGlobal({ uid, inputEl })` — mounts the side panel, library modal, launcher, and store wiring.
- `boot.js` — `bootMyWordsLauncher()` — lightweight entrypoint used on pages that only need the corner launcher.
- `store.js` / `service.js` — State store and backend service (fetch, upsert, pin, archive, delete against `/api/my-words*`).
- `panel.js` + `panel-*.js` — Side panel: DOM, data, events, render, utils.
- `library-modal.js` / `library-modal-controller.js` — Full library modal surface.
- `launcher.js` — Corner launcher button that opens the panel/library.
- `normalize.js` — Word-key normalization used by store and stats.
- `stats.js` — Counts and summaries consumed by the panel.

## Conventions

- Storage keys for My Words use prefix-based dynamic keys; the prefixes are declared in `app-core/lux-storage.js` and consumed here.
- The panel layout hugs the bottom-left corner relative to the self-playback drawer and the practice input — see `layoutPanel` in `index.js` for the exact geometry.
- Guest and authed UIDs are supported; migration happens in `ui/auth-dom.js` on login.

## See Also

- [features/dashboard/README.md](../dashboard/README.md) — Progress Hub gateway
- [_api/README.md](../../_api/README.md)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
