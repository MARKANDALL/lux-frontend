# features/convo

AI Conversations — the largest feature in the repo. Boots the scenario picker, character/knobs drawers, chat UI, recording + assessment loop, and the post-session AI Coach drawer. Wired from `src/convo.js`.

## Key Files

- `index.js` — public barrel; exports `bootConvo` from `convo-bootstrap.js`.
- `convo-bootstrap.js` — the orchestrator: builds layout, wires drawers / nav / flow, initialises the picker, coach, audio mode switch, and mode controller.
- `convo-flow.js` / `convo-turn.js` / `convo-recording.js` / `convo-handlers.js` — per-turn chat loop: record → assess → request next turn → render.
- `convo-modes.js` — `intro` / `picker` / `chat` screen-mode transitions with `history.pushState` sync.
- `convo-knobs.js` / `convo-knobs-ui.js` / `convo-knobs-system.js` / `knobs-drawer.js` — CEFR-adaptive Level / Tone / Length knobs and persistence.
- `convo-render.js` — message + suggestion rendering into the chat DOM.
- `scenarios.js` (imported) — the 25-scenario catalogue with character + scene metadata.
- `picker-deck/` — scenario-picker deck: card rendering, thumb hydration, CEFR hint badge.

## Conventions

- State flows through an internal `state` object plus `luxBus` — modules receive the state and render hooks by parameter rather than reading globals.
- Scenarios are "identity + scene function only" by design (no hidden behavioural steering) — do not add scripted conversational hooks.
- The AI coaching drawer shell lives here (`convo-ai-coach-shell.js`) but its render logic reuses `ui/ui-ai-ai-*`.

## See Also

- [`src/convo.js`](../../src/convo.js) — page entrypoint
- [`_api/convo-report.js`](../../_api/convo-report.js) / [`_api/assess.js`](../../_api/assess.js) — network layer
- [`features/streaming/`](../streaming/) — the Realtime API sibling page
