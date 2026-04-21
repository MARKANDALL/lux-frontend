# tools

Developer-only runtime tools. Unlike `scripts/` (build-time data generators), code here runs *while you develop* — typically a local HTTP proxy so the browser can hit something that stands in for the production API.

## Key Files

- `dev-realtime-proxy.mjs` — local Node HTTP proxy on port `8787` that forwards the browser's SDP offer to OpenAI's Realtime API. Lets the Streaming page exchange WebRTC SDP locally without a production admin token. Expects `OPENAI_API_KEY` in the env; optional `OPENAI_REALTIME_MODEL` and `OPENAI_REALTIME_VOICE` overrides. After starting it, set `VITE_API_BASE=http://localhost:8787` and restart Vite.

## Conventions

- **Never ship.** `tools/` is excluded from the production bundle. If a tool hardens into something users need, move it into `_api/` or `scripts/` deliberately.
- **No secrets in code.** Read keys from `process.env` only; do not commit `.env` files here.

## See Also

- [features/streaming/](../features/streaming) — the feature this proxy unblocks in local dev
- [.env.example](../.env.example) — documents the env vars `dev-realtime-proxy.mjs` expects
