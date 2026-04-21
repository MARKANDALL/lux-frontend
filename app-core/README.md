# app-core

The architectural spine of the frontend. Everything feature code depends on for cross-cutting state, events, and persistence lives here. This is the layer that replaces `window.*` globals with an explicit, testable API.

Changes here ripple everywhere — modifications should be mechanical, justified, and covered by the protection-ring tests in [tests/](../tests/).

## Key Files

- `lux-bus.js` — Tiny pub/sub service bus. The canonical coordinator for cross-feature shared state (`set`/`get`/`on`/`update`/`watch`). Replaces window globals as the primary source of truth.
- `lux-storage.js` — Centralized localStorage key registry. Every key the app uses is a named constant (`K_*`) with typed helpers (`getString`, `getJSON`, `getBool`, etc.). Features never touch raw strings.
- `runtime.js` — Per-session "current run" state — `lastAttemptId`, `lastRecording` blob + meta. Mirrors to `window.*` for back-compat but the bus is authoritative.
- `state.js` — Practice-page passage state: `currentPassageKey`, `currentParts`, `currentPartIdx`, session bookkeeping.
- `audio-sink.js` — Hidden `<audio id="playbackAudio">` sink that every feature (Convo, Results, Voice Mirror) plays through.
- `lux-utils.js` — DOM micro-helpers (`qs`, `setText`, `setVisible`) and the debug logger.

## Conventions

- Every localStorage key lives in `lux-storage.js`. No bare `localStorage.getItem` anywhere in the app.
- Every cross-feature value lives on `luxBus`. Window globals are frozen compatibility mirrors, not the source of truth.
- Swallowed errors go through `globalThis.warnSwallow?.(...)` so `ui/lux-warn.js` can centrally toggle noise.
- Anything in this folder should have a sibling `*.test.js` — these are protection-ring modules.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — canonical reference for the bus/storage/runtime contracts
- [tests/](../tests/) — protection-ring tests that lock this API in place
- [ui/lux-warn.js](../ui/lux-warn.js) — the warn-mode toggle that consumes `warnSwallow`
