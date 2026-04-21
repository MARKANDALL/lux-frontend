# features/convo

The AI Conversations surface. A picker deck of 25 scenarios (coffee shop, job interview, doctor visit, etc.), character-based NPCs, CEFR-adaptive difficulty via the Knobs system, per-turn scoring, and a post-session report.

This is the largest feature module. It owns its own layout, state, picker UI, knobs system, TTS context, and per-turn flow — all coordinated from `convo-bootstrap.js`.

## Key Files

- `index.js` — public surface: `bootConvo` only.
- `convo-bootstrap.js` — the single entry. Builds the layout, wires flow/drawers/nav, initializes the picker and state.
- `scenarios.js` — the 25-scenario manifest (id, character, scene, media, CEFR bias audits).
- `convo-flow.js` / `convo-turn.js` — per-turn state machine: record → assess → AI reply → TTS.
- `convo-knobs*.js` — the Knobs system (level / tone / length) that adapts AI output to CEFR target.
- `convo-api.js` — wraps `_api/convo-report.js` and `_api/assess.js` with per-turn UI hooks.
- `picker-deck/` + `convo-picker-system.js` — the scenario picker UI with thumbs, nav arrows, deck transitions.
- `convo-state.js` / `convo-persistence.js` — session state and localStorage persistence.

## Conventions

- Scenarios in `scenarios.js` are designed around **identity and scene function only** — no hidden conversational steering. Each scenario is audited against four axes of bias (length, emotion, CEFR, perspective). Preserve that when adding new ones.
- The Knobs system is the only way to change AI difficulty. Don't hardcode prompt variants per scenario.
- Trouble-sound weaving happens *where natural* — the AI is steered, not drilled. Don't change that tone.
- Boot from `bootConvo` only. Internal modules are implementation detail.

## See Also

- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — scenario design + Knobs system
- [_api/convo-report.js](../../_api/convo-report.js) — post-session report backend
- [features/streaming/](../streaming/) — the Realtime-API sibling surface
