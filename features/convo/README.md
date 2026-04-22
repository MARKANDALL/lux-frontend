# features/convo

The AI Conversation feature. Voice conversations with a GPT-powered partner across 25 scenarios (ordering coffee, job interview, doctor visit, etc.), with character selection, CEFR-adaptive knobs (level / tone / length), post-session AI coaching, and the scenario picker. Entered from `convo.html` via `src/convo.js`.

## Key Files

- `index.js` — Public barrel; exports `bootConvo` from `convo-bootstrap.js`.
- `convo-bootstrap.js` — Entrypoint that builds the layout, wires drawers/nav/flow, initializes scene atmosphere, renders messages/suggestions, and mounts the AI coach shell.
- `convo-flow.js` / `convo-handlers.js` / `convo-turn.js` / `convo-recording.js` — The per-turn loop: record → assess → send to `/api/convo-turn` → render assistant reply + suggested replies.
- `convo-api.js` — UI-aware wrappers around `_api/convo.js` and `_api/assess.js`.
- `convo-knobs.js` / `knobs-drawer.js` / `convo-knobs-ui.js` — CEFR level / tone / length knobs (stored via `K_KNOBS_V3`).
- `scenarios.js` — The 25-scenario catalog that drives the picker.
- `convo-layout.js`, `convo-render.js`, `convo-nav.js`, `characters-drawer.js`, `scene-atmo.js` — Layout, rendering, character selection, and ambient-scene visuals.
- `convo-coach.js` / `convo-ai-coach-shell.js` — Post-session AI coaching panel.

## Conventions

- `knobs-drawer.js` is the canonical owner of knob read/write; `convo-knobs.js` is a thin re-exporter kept for import stability.
- Outbound API calls route through `_api/` — no raw `fetch` here.
- Scenario assets (imagery, video) live under `public/convo-img/` and `public/convo-vid/` and are referenced by absolute URL.

## See Also

- [features/streaming/README.md](../streaming/README.md) — real-time voice equivalent
- [_parts/README.md](../../_parts/README.md) — scenario-picker CSS fragments
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
