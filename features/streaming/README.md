# features/streaming

Real-time WebRTC / OpenAI Realtime API voice chat — the `stream.html` surface. Lower-latency spoken interaction for fluency practice. Self-contained: mounts into a single `#lux-stream-root` element, builds its own DOM, and manages its own Redux-shaped state store.

## Key Files & Subfolders

- `app.js` — `mountStreamingApp({ rootId })`. Parses the route, creates the store, builds the DOM, wires transport + audio controllers, saves attempts via `_api/attempts.saveAttempt`, feeds instructions from `prompt/contract.js`.
- `router.js` — URL-param → route config. Reads `scenario`, `tone`, `stress`, `pace`, `transport`, `input` (tap/auto), `model`, `voice`, `speed`, `maxOutputTokens`, with bounded numeric clamps.
- `setup/app.js` — Mounts the streaming setup UI (pre-session knobs) into `#lux-stream-setup-root`.
- `state/schema.js` — State shape, `createInitialState({ route })`, `reducer`, `ACTIONS` constants.
- `state/store.js` — Tiny redux-ish store: `{ getState, dispatch, subscribe }`.
- `transport/` — WebRTC (`realtime-webrtc.js` + sub-module) and WebSocket (`realtime-websocket.js`) implementations, `session-bootstrap.js`, `transport-controller.js`.
- `audio/` — `audio-controller.js` (mic + playback) and `mode.push-to-talk.js`.
- `ui/dom.js`, `ui/render.js` — DOM construction and reactive rendering against the store.
- `prompt/contract.js` — Builds the Realtime API system instructions from scenario + knobs.
- `util.js` — `clampNumber`, `clampInt`.
- `setup.css`, `stream.css` — Scoped styling.

## Conventions

- **Single-mount guard.** `root.dataset.luxBooted === "1"` prevents double-mount on hot reload.
- **Store-driven rendering.** Don't poke DOM directly; dispatch an action and let the reducer update state, then let the subscriber re-render.
- **Dev-only health panel.** The `healthDetails` element is hidden in production (`import.meta.env.PROD`) — keep this guarded so internals don't leak.
- **Transport selection is URL-first.** `?transport=webrtc|websocket` controls which transport module loads.

## See Also

- [tools/dev-realtime-proxy.mjs](../../tools/dev-realtime-proxy.mjs) — local OpenAI Realtime SDP proxy
- [features/convo/scenarios.js](../convo/scenarios.js) — reused scenario definitions
- [src/stream.js](../../src/stream.js), [src/stream-setup.js](../../src/stream-setup.js)
