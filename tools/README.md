# tools

Developer-only tools that run outside the browser. Unlike `scripts/`, which is biased toward CI and build-time generation, this folder is for local dev-loop helpers (proxies, mocks, inspectors).

## Key Files

- `dev-realtime-proxy.mjs` — Local Node HTTP proxy that forwards OpenAI Realtime WebRTC SDP exchanges. Use when you want to run `stream.html` locally without going through the production backend. Reads `OPENAI_API_KEY` and `OPENAI_REALTIME_MODEL` / `OPENAI_REALTIME_VOICE` from env, listens on `PORT` (default `8787`), and answers `POST /realtime/webrtc/session` with the OpenAI SDP answer.

## Conventions

- **Never shipped.** Nothing under `tools/` should be imported by any `src/` or `features/` file.
- **Env-driven config.** API keys and model choices come from `process.env`, never from committed files.
- **Run instructions live in the file header** so a new dev can start a tool by reading the first ten lines.

## See Also

- [src/stream.js](../src/stream.js) — the streaming client that talks to the proxy or the production backend
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
