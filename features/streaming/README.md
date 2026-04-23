# features/streaming

Real-time spoken interaction via the OpenAI Realtime API. Implements the WebRTC (and a WebSocket fallback) transport, push-to-talk / always-on input modes, and the scenario-aware prompt builder. Mounted from `src/stream.js` on `stream.html`; `src/stream-setup.js` drives the pre-flight picker.

## Key Files

- `app.js` — `mountStreamingApp()`: parses the URL route, creates store (reducer + store), builds DOM, and wires transport + audio controllers.
- `router.js` — URL-param → normalised route config with defaults (input mode, transport, model, voice, speed, max tokens) and scenario lookup.
- `state/schema.js` + `state/store.js` — actions, reducer, and store.
- `transport/` — `transport-controller.js`, `realtime-webrtc.js`, `realtime-websocket.js`, `session-bootstrap.js`. WebRTC is the default.
- `audio/audio-controller.js` + `audio/mode.push-to-talk.js` — capture and PTT logic.
- `prompt/contract.js` — `buildStreamingInstructions()`: assembles system prompt from scenario + knobs.
- `ui/dom.js` + `ui/render.js` — DOM shell and state-driven render.
- `setup/app.js` — drives `stream-setup.html`.
- `util.js` — `clampNumber`, `clampInt`.

## Conventions

- Transport is pluggable — both WebRTC and WebSocket go through `transport-controller.js`; don't call transports directly from `app.js`.
- SDP exchange is proxied via the backend in prod; for local dev use `tools/dev-realtime-proxy.mjs`.
- State mutations always go through the reducer — no ad-hoc `store.state = ...`.

## See Also

- [`tools/dev-realtime-proxy.mjs`](../../tools/dev-realtime-proxy.mjs) — local dev proxy
- [`features/convo/`](../convo/) — the non-realtime sibling that shares `scenarios.js`
