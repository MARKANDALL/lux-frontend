# app-core

The architectural spine of the Lux frontend. Everything that multiple features need to agree on — the pub/sub bus, storage keys, runtime state, listener hygiene, logging — lives here. Features import from `app-core/`; `app-core/` never imports from a feature.

## Key Files

- `lux-bus.js` — Tiny pub/sub service bus (`luxBus.set/get/on/update`). The sole source of truth for cross-module state; window globals survive only as back-compat mirrors.
- `lux-storage.js` — Canonical registry of every localStorage/sessionStorage key as a named `K_*` constant, plus typed helpers (`getString`, `getJSON`, `getBool`, `setBool`, `sessionGet`, etc.). No feature may read storage with a raw string key.
- `runtime.js` — Single source of truth for "current run" state: `lastAttemptId`, `lastRecordingBlob`, `lastRecordingMeta`. Publishes to `luxBus`; keeps legacy window globals in sync.
- `state.js` — Practice-page passage/part/session state. Wraps the passages data barrel and publishes selection changes.
- `lux-listeners.js` — `guardedListener(key, target, event, handler)` — a keyed registry that prevents duplicate document/window listeners from stacking across boots or hot reloads.
- `audio-sink.js` — Owns the hidden `#playbackAudio` element and the learner-blob attach lifecycle.
- `lux-utils.js` — `[LUX]`-prefixed `logStatus`/`logError`/`debug` console wrappers.

## Conventions

- New cross-feature state goes on `luxBus`, not on `window`. If you need a window global for back-compat, mirror it from the bus — do not treat the global as authoritative.
- New storage keys must be added to `lux-storage.js` as a `K_*` constant and accessed through the typed helpers.
- Tests are colocated (`lux-bus.test.js`, `lux-storage.test.js`, `runtime.test.js`) — this folder is part of the protection-ring test ring.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — bus/storage/runtime discipline in context
- [core/](../core/) — shared business logic (scoring, prosody) that layers on top of this spine
