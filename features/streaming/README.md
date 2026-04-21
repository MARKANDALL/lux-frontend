# features/streaming

Real-time spoken interaction via OpenAI's Realtime API over WebRTC (with a WebSocket fallback path). Lower-latency than the Convo turn-taking flow — for when fluency practice needs speed.

Split into five sub-concerns: router, state, transport, audio, prompt, ui. `app.js` is the composition root.

## Key Files

- `app.js` — `mountStreamingApp`. Composes store + transport + audio + UI into a running page.
- `router.js` — parses URL params (scenario, tone, stress, pace, transport, input, model, voice, speed) into a normalized route config. Backed by [features/convo/scenarios.js](../convo/scenarios.js).
- `state/store.js` + `state/schema.js` — reducer-based store with `ACTIONS` enum.
- `transport/transport-controller.js` — picks WebRTC (`realtime-webrtc.js`) or WebSocket (`realtime-websocket.js`) and manages session bootstrap.
- `audio/audio-controller.js` — input capture + output playback. Push-to-talk lives in `mode.push-to-talk.js`.
- `prompt/contract.js` — `buildStreamingInstructions`. The system-prompt builder that applies the same scenario design rules as Convo.
- `ui/dom.js` / `ui/render.js` — DOM building + reactive render.
- `setup/` — the companion setup page (`stream-setup.html`) for configuring a streaming session before launch.

## Conventions

- Same "identity and scene function only" scenario rule as Convo — the prompt contract enforces it.
- Transport fallback: WebRTC first; WebSocket only as a deliberate debug path. Keep the split clean so either can be exercised in isolation.
- Dev-only: route through [tools/dev-realtime-proxy.mjs](../../tools/dev-realtime-proxy.mjs) to avoid shipping OpenAI keys to the browser.
- Audio controller owns the mic stream — never open `getUserMedia` elsewhere on this page.

## See Also

- [tools/dev-realtime-proxy.mjs](../../tools/dev-realtime-proxy.mjs) — local dev proxy for the SDP exchange
- [features/convo/scenarios.js](../convo/scenarios.js) — the shared scenario manifest
- [src/stream.js](../../src/stream.js) / [src/stream-setup.js](../../src/stream-setup.js) — page entries
