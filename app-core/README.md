# app-core

Architectural spine of the Lux frontend. Every cross-feature primitive — pub/sub bus, storage registry, runtime state, listener registry, debug logging — lives here. Features import from `app-core/` but `app-core/` never imports from features.

This folder is what the protection-ring Vitest suite covers most heavily; changes here ripple across every page.

## Key Files

- `lux-bus.js` — canonical pub/sub service bus (`luxBus.set/get/on/update`). Replaces `window.*` globals as the source of truth for shared state. Window globals survive only as frozen compatibility mirrors.
- `lux-storage.js` — registry of every localStorage / sessionStorage key as a named constant (`K_*`) plus typed helpers (`getJSON`, `getBool`, `setString`, etc.). No bare `localStorage.getItem` allowed elsewhere.
- `runtime.js` — runtime contract for the "current run" (`lastAttemptId`, `lastRecording` blob/meta), kept in sync with the bus and legacy `window.lastAttemptId`.
- `state.js` — passage / part / session state for the Practice Skills page (current passage, part index, custom text, session id).
- `lux-listeners.js` — `guardedListener` registry that prevents duplicate document/window listeners across hot-reloads and repeated boot calls.
- `audio-sink.js` — single hidden `<audio id="playbackAudio">` element shared by Self-Playback, TTS, and Voice Mirror.
- `lux-utils.js` — `[LUX]`-prefixed `logStatus` / `logError` / `debug` and small DOM helpers (`qs`, `setText`, `setVisible`).

## Conventions

- Side-effect-free import is required — modules expose functions; they do not boot themselves.
- Every new localStorage key MUST be added to `lux-storage.js` as a `K_*` constant before use.
- Cross-feature shared state goes through `luxBus`, not new globals.
- Tests (`*.test.js`) sit beside source and form the protection-ring contract suite — keep them green.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — bus-first state and centralized storage are described in detail
- [docs/system-health-bill-of-rights.frontend.md](../docs/system-health-bill-of-rights.frontend.md)
