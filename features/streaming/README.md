# features/streaming

Real-time spoken interaction via WebRTC against OpenAI's Realtime API. Lower-latency alternative to `features/convo/` for when fluency practice needs speed. Shares the scenario catalog with `features/convo/` but runs an entirely different transport (SDP over HTTP) and UI flow.

## Key Files

- `app.js` — `mountStreamingApp({ rootId })`. Creates the store, builds DOM, mounts the transport + audio controllers, renders.
- `router.js` — parses URL params (`scenario`, `tone`, `input`, `transport`, `model`, `voice`, `speed`, `maxOutputTokens`) into a normalized route with clamped numeric defaults.
- `state/store.js`, `state/schema.js` — minimal reducer-based store (`createStore`, `reducer`, `ACTIONS`) for streaming UI state.
- `transport/transport-controller.js`, `transport/realtime-webrtc.js`, `transport/realtime-websocket.js`, `transport/session-bootstrap.js` — transport abstraction; WebRTC is the default, WebSocket is a fallback.
- `audio/audio-controller.js` — audio track capture, playback, and level metering.
- `prompt/contract.js` — `buildStreamingInstructions(...)` assembles the system prompt for the Realtime session.
- `ui/dom.js`, `ui/render.js` — DOM scaffolding and state-driven render.
- `setup/` + `setup.css` — the pre-flight setup screen (scenario + voice + transport picker).

## Conventions

- **Scenarios are shared.** `router.js` imports `SCENARIOS` from `features/convo/scenarios.js`; do not duplicate the scenario list here.
- **Idempotent mount.** `root.dataset.luxBooted === "1"` guards a double-mount on route changes.
- **SDP endpoint is abstracted.** The dev proxy (`tools/dev-realtime-proxy.mjs`) stands in for the production admin-token-gated endpoint; transport code must not assume a direct OpenAI URL.

## See Also

- [features/convo/scenarios.js](../convo/scenarios.js) — shared scenario catalog
- [tools/dev-realtime-proxy.mjs](../../tools/dev-realtime-proxy.mjs) — local SDP proxy for development
- [src/stream.js](../../src/stream.js) — page entry that mounts this feature
