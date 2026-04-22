# features/streaming

Real-time spoken interaction via OpenAI's Realtime API. Negotiates a WebRTC session (with a WebSocket fallback), streams learner audio up and model audio down, and hands transcripts over for assessment + attempt saving. Entered from `src/stream.js` (session) and `src/stream-setup.js` (pre-session config).

## Key Files

- `app.js` — `mountStreamingApp({ rootId })` — parses route, creates the state store, builds DOM, wires transport + audio controllers, saves attempts.
- `setup/app.js` — `mountStreamingSetupApp({ rootId })` — the pre-session setup screen mounted by `src/stream-setup.js`.
- `router.js` — `parseStreamRoute()` — URL-driven route parsing.
- `state/store.js` + `state/schema.js` — Minimal reducer-driven store (`createStore`, `reducer`, `ACTIONS`, `createInitialState`).
- `transport/transport-controller.js`, `transport/realtime-webrtc.js`, `transport/realtime-websocket.js`, `transport/session-bootstrap.js` — Transport layer: WebRTC SDP exchange, WebSocket fallback, session token bootstrap.
- `audio/audio-controller.js`, `audio/mode.push-to-talk.js` — Mic capture + PTT mode controller.
- `prompt/contract.js` — `buildStreamingInstructions(...)` — the system prompt contract for the Realtime model.
- `ui/dom.js`, `ui/render.js` — DOM shell and render loop.

## Conventions

- The store is the sole authoritative state for a streaming session; transport and audio controllers dispatch actions, never mutate directly.
- Session tokens and SDP are exchanged via the backend (or `tools/dev-realtime-proxy.mjs` locally) — never call OpenAI directly from the browser.
- Debug mode is driven by `K_DEBUG_STREAM` through `getBool`/`setBool`.

## See Also

- [tools/dev-realtime-proxy.mjs](../../tools/dev-realtime-proxy.mjs) — local SDP proxy
- [src/stream.js](../../src/stream.js), [src/stream-setup.js](../../src/stream-setup.js)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
