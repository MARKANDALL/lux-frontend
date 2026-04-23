# app-core

The architectural spine of the Lux frontend. Everything that cross-cuts features — the pub/sub bus, the storage key registry, the runtime contract, the page-level state mutables, and the guarded DOM-listener registry — lives here. Features consume these primitives; nothing in `app-core/` imports a feature.

## Key Files

- `lux-bus.js` — Tiny pub/sub service bus (`set` / `get` / `update` / `on` / `watch`). Canonical source of truth for cross-module shared state; window globals are kept as back-compat mirrors only.
- `lux-storage.js` — Registry of every `localStorage` / `sessionStorage` key the app reads or writes, plus typed helpers (`getJSON`, `setBool`, `sessionGetNum`, …). After the Pass-B migration, bare string keys should not appear outside this file.
- `runtime.js` — Runtime contract for "current run" state (`lastAttemptId`, `lastRecording` blob + meta). Writes to bus and legacy `window.*` globals so older callers keep working.
- `state.js` — Page-level mutables for the Practice Skills flow: `currentPassageKey`, `currentParts`, `currentPartIdx`, `allPartsResults`, session-id generator, practice-run grouping.
- `lux-listeners.js` — `guardedListener(key, target, event, handler)` — prevents duplicate document/window listeners across hot reloads and repeated boot calls.
- `audio-sink.js` — Hidden learner-audio `<audio>` element + wiring to Self-Playback / WaveSurfer via `luxBus.get('selfpbApi')`.
- `lux-utils.js` — `[LUX]`-prefixed console helpers and a handful of trivial DOM helpers.

## Conventions

- **Bus-first state.** When two features need to share state, use `luxBus.set(key, value)` — do not introduce a new `window.*` global.
- **Keys live here.** Add new localStorage keys to `lux-storage.js` as `K_<CATEGORY>_<PURPOSE>` exports. Never write a bare string literal.
- **No feature imports.** This folder must not `import` from `features/` or `ui/`. Dependencies flow downward only.
- Tests for `lux-bus`, `lux-storage`, and `runtime` are part of the protection-ring suite.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — bus-first state, centralized storage, protection ring
- [tests/](../tests/) — Vitest contract suite covering this folder's primitives
