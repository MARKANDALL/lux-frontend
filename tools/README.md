# tools

Developer-only tooling that runs outside the browser build. Unlike `scripts/` (build-time and CI guardrails), `tools/` is for long-running dev servers or local proxies you start by hand during development.

## Key Files

- `dev-realtime-proxy.mjs` — Local HTTP proxy that brokers the OpenAI Realtime WebRTC SDP exchange. Needed when developing the streaming feature without the production Vercel backend. Run with `$env:OPENAI_API_KEY="..."; node tools/dev-realtime-proxy.mjs` and point the app at it by setting `VITE_API_BASE=http://localhost:8787` before restarting Vite.

## Conventions

- Tools read secrets from the environment; never commit keys.
- Each tool's usage comment at the top of the file is authoritative. Keep those comments current when ports, env vars, or endpoints change.

## See Also

- [features/streaming/README.md](../features/streaming/README.md) — the feature that consumes this proxy
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
