# tools

Dev-time standalone tools that aren't part of the build or test pipeline. Each tool is a Node script you run yourself when you need it.

Currently small — expect this to grow as local debugging needs appear.

## Key Files

- `dev-realtime-proxy.mjs` — Local HTTP proxy for the OpenAI Realtime WebRTC SDP exchange. Lets the Streaming page talk to OpenAI without going through the Vercel backend in development. Requires `OPENAI_API_KEY`; listens on `PORT` (default 8787); client points at it via `VITE_API_BASE=http://localhost:8787`.

## Conventions

- Tools are standalone Node scripts (`.mjs`). They don't import browser modules.
- Any env-var requirements or run instructions go in the comment header of the file itself.
- If you add a tool, also add an `npm run` entry in `package.json` only if it's a common workflow — otherwise leave it as `node tools/your-tool.mjs`.

## See Also

- [features/streaming/](../features/streaming/) — the client that connects through `dev-realtime-proxy.mjs`
- [scripts/](../scripts/) — build-time scripts (different purpose — those are part of the pipeline)
