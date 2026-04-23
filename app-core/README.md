# app-core

The architectural spine. Every cross-feature primitive lives here: the pub/sub bus, the storage key registry, the runtime state contract, the global audio sink, and the guarded listener registry. Features depend on `app-core/`; `app-core/` depends on nothing inside `features/`.

## Key Files

- `lux-bus.js` — canonical pub/sub service bus (`luxBus.set/get/on/update`). The single source of truth for cross-module state; window globals survive only as frozen compat mirrors.
- `lux-storage.js` — every `localStorage`/`sessionStorage` key registered as a `K_*` constant, plus typed helpers (`getJSON`, `getBool`, `setString`, …). New storage access must go through this file.
- `runtime.js` — "current run" state: `lastAttemptId`, `lastRecording` blob/meta. Keeps legacy `window.*` mirrors in sync.
- `state.js` — shared practice-session state (passages, parts, results, session id).
- `audio-sink.js` — attaches the hidden `#playbackAudio` element and wires the learner-blob pipeline into the self-playback waveform.
- `lux-listeners.js` — `guardedListener()` / `removeGuardedByPrefix()` — prevents duplicate document/window listeners across hot reloads.
- `lux-utils.js` — tiny shared utilities (`logStatus`, `logError`, `qs`, `setText`, `setVisible`).

## Conventions

- Never read `localStorage.getItem` directly — import a `K_*` constant and a typed helper.
- Read/write cross-feature state only through `luxBus`; do not add new `window.*` properties.
- Most files in this folder have colocated `.test.js` files and are covered by the Vitest protection ring — keep them that way when editing.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — "Core principles: bus-first state, centralized storage"
- [`tests/`](../tests/) — cross-cutting contract tests
