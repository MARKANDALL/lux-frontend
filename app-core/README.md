# app-core

The architectural spine of Lux. Cross-feature primitives that must exist before any feature boots: the service bus, storage key registry, runtime state, shared state, listener guards, audio sink, and tiny logging helpers. Anything imported here should be tiny, stable, and low-churn — features depend on `app-core`, never the other way around.

## Key Files

- `lux-bus.js` — tiny pub/sub bus (`set` / `get` / `on` / `update`) used as the primary source of truth for cross-module state; window globals are backward-compatible mirrors only.
- `lux-storage.js` — canonical registry of every localStorage/sessionStorage key the app uses, plus typed helpers (`getString`, `getJSON`, `getBool`, …). Features import the `K_*` constants, never raw strings.
- `runtime.js` — single source of truth for the "current run" (`lastAttemptId`, `lastRecording` blob/meta). Publishes to `luxBus` and keeps legacy window globals in sync.
- `state.js` — mutable app state for the practice flow (current passage, part index, results). Imports passages from `src/data/index.js`.
- `lux-listeners.js` — `guardedListener()` / `removeGuardedByPrefix()` registry that prevents duplicate document/window listeners stacking across hot reloads or repeated boot calls.
- `audio-sink.js` — creates and owns the single hidden `<audio id="playbackAudio">` element and wires it to WaveSurfer for self-playback.
- `lux-utils.js` — minimal `[LUX]`-prefixed `logStatus` / `logError` / `debug` console helpers and DOM micro-helpers (`qs`, `setText`, `setVisible`).

## Conventions

- **No feature-level imports.** Code here must not import from `features/` — that would create a cycle.
- **Use `K_*` constants.** Any new localStorage key must be added to `lux-storage.js` first; never use bare string literals.
- **Prefer `luxBus` over window globals.** Globals are tolerated for back-compat, but new code should `set`/`on` through the bus.
- Sibling `*.test.js` files are Vitest unit tests (`lux-bus`, `lux-storage`, `runtime`).

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — boot order, bus topics, and the layering rule
- [_api/](../_api) — the other folder no feature is allowed to bypass
