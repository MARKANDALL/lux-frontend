# tools

Local developer tools that are **not** part of the frontend build and are not shipped to the browser. Intended for manual dev-loop use.

## Key Files

- `dev-realtime-proxy.mjs` — local HTTP proxy for the OpenAI Realtime WebRTC SDP exchange. Run with `OPENAI_API_KEY` in env; point the frontend at it via `VITE_API_BASE=http://localhost:8787`. Lets you exercise the streaming page without routing through the deployed backend.

## Conventions

- Node ESM only. No bundler, no TypeScript.
- Scripts here may require secrets in the developer's local environment — never commit keys; the files read from `process.env`.
- If a tool becomes part of the build or CI, move it to `scripts/`.

## See Also

- [`features/streaming/`](../features/streaming/) — the frontend side of the Realtime flow
- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — streaming and Realtime API
