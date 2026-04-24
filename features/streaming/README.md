# features/streaming

The OpenAI Realtime streaming surface (`stream.html` and `stream-setup.html`). Lower-latency spoken interaction over WebRTC (with a WebSocket fallback). Reuses scenarios from [`features/convo/`](../convo/) but bypasses the per-turn record-and-assess loop in favor of a continuous voice channel.

## Key Files

- `app.js` — `mountStreamingApp({ rootId })`. Boots the route, store, transport controller, audio controller, and the prompt-instructions builder.
- `router.js` — `parseStreamRoute(url)`. Reads URL params (`scenario`, `input`, `transport`, `model`, `voice`, `speed`, `maxOutputTokens`) into a normalized route config with defaults and bounded numeric clamps.
- `util.js` — `clampNumber`, `clampInt` for the router's numeric guards.
- `state/` — `schema.js` (`createInitialState`, `reducer`, `ACTIONS`) and `store.js` (`createStore`).
- `transport/` — `transport-controller.js` plus `realtime-webrtc.js` and `realtime-websocket.js` adapters and `session-bootstrap.js` for SDP exchange.
- `audio/` — `audio-controller.js` and `mode.push-to-talk.js`.
- `prompt/contract.js` — `buildStreamingInstructions(scenario, knobs, …)` builds the system prompt.
- `ui/` — `dom.js` (shell builder) and `render.js` (state → DOM).
- `setup/app.js` — `mountStreamingSetupApp` for the configuration page.
- CSS: `stream.css`, `setup.css`.

## Conventions

- The store is a plain reducer + dispatch; transports/audio/UI all subscribe to it. Mutating store state outside the reducer is forbidden.
- WebRTC SDP exchange goes through the backend (or [`tools/dev-realtime-proxy.mjs`](../../tools/dev-realtime-proxy.mjs) in dev) — never embed the OpenAI API key.
- Scenarios are imported from [`features/convo/scenarios.js`](../convo/scenarios.js); do not duplicate the list.
- `K_DEBUG_STREAM` toggles verbose transport logging.

## See Also

- [`tools/dev-realtime-proxy.mjs`](../../tools/dev-realtime-proxy.mjs) — local SDP proxy
- [`features/convo/`](../convo/) — turn-based sibling that shares scenarios + knobs
