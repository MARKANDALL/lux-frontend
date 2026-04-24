# tools

Local developer tools that aren't part of the build and aren't shipped to users. Currently houses a single dev-only proxy.

## Key Files

- `dev-realtime-proxy.mjs` — minimal Node HTTP server that mints OpenAI Realtime SDP session tokens locally so the streaming page can be exercised without going through the production backend. Run with:

  ```bash
  $env:OPENAI_API_KEY="..."
  node tools/dev-realtime-proxy.mjs
  ```

  Then point the app at it by setting `VITE_API_BASE=http://localhost:8787` and restarting Vite.

## Conventions

- Files here are run with plain `node`; they have no build step.
- Required secrets come from the environment and the script exits non-zero if they're missing — never embed keys in source.
- This folder should stay tiny. If a script is part of the build pipeline, it belongs in [`scripts/`](../scripts/) instead.

## See Also

- [`features/streaming/`](../features/streaming/) — the consumer of the realtime SDP exchange
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
