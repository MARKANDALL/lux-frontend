# features/convo

The AI Conversations feature. A learner picks a scenario (ordering coffee, job interview, doctor visit…), the app renders a character-driven dialog with suggested replies, and each turn is scored by Azure pronunciation assessment while GPT drives the conversation. The largest feature by file count — the logic is split into bootstrap, layout, flow, rendering, knobs, picker, and persistence concerns.

## Key Files

- `index.js` — public `bootConvo()` entry called from `src/convo.js`.
- `convo-bootstrap.js` — builds the layout, wires drawers/nav/flow, boots picker + scene atmosphere, mounts the AI Coach shell and audio-mode switch.
- `convo-flow.js` — per-turn orchestration: attach handlers, create recording, create turn, advance state.
- `convo-api.js` — wraps `_api/convo.js` with a UI-friendly fallback (`convoTurnWithUi` never throws).
- `convo-knobs.js` + `knobs-drawer.js` — the Knobs system (level / tone / length). `knobs-drawer.js` is the canonical owner; `convo-knobs.js` is a thin re-exporter for older importers.
- `scenarios.js` — the scenario catalog consumed by the picker and the streaming router.
- `convo-render.js`, `convo-layout.js`, `convo-nav.js` — message rendering, chat layout, and navigation between scenarios/chat.
- `picker-deck.js` + `picker-deck/` — the 3D scenario-picker deck behavior.
- `convo-coach.js`, `convo-ai-coach-shell.js` — in-conversation AI coaching.
- `convo-persistence.js`, `convo-state.js` — chat state and local persistence.

## Conventions

- **Scenario neutrality.** Scenarios define character + scene only. No hidden steering in prompts. Any change to `scenarios.js` should preserve the four-axes audit (length / emotion / CEFR / perspective).
- **Knobs via `knobs-drawer.js`.** `convo-knobs.js` is a back-compat shim; new code should import from `knobs-drawer.js` directly.
- **`convoTurnWithUi` never throws.** UI callers can count on a rendered fallback message instead of an exception.

## See Also

- [_parts/](../../_parts) — the CSS fragments that style the picker
- [features/streaming/](../streaming) — reuses `SCENARIOS` from this folder
- [_api/convo.js](../../_api/convo.js) — backend client this feature wraps
