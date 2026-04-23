# features/convo

AI Conversations — the `convo.html` surface. Voice conversations with a GPT-powered partner across 25 scenarios, with CEFR-adaptive difficulty via the Knobs system (level / tone / length), character drawer, scene atmospherics, per-turn pronunciation assessment, and a post-session report. This is the largest feature folder in the repo.

## Key Files

- `index.js` — Public entry (`export { bootConvo }`).
- `convo-bootstrap.js` — Main boot sequence. Builds layout, wires flow/nav/knobs/picker/modes, initializes scene atmo, mounts the characters drawer and audio-mode switch. Consumes Next-Activity plans and handles `#chat` deep-linking.
- `scenarios.js` — The 25 scenario definitions (id, title, description, character, scene, role cards). Single source of truth for Convo scenes.
- `convo-state.js` — `createConvoState()` shape: `mode` (intro/picker/chat), `scenarioIdx`, `knobs`, `messages`, `turns`, recorder state, next-activity plan.
- `convo-flow.js` / `convo-handlers.js` / `convo-turn.js` — The talk loop: record → assess → `convoTurn` (`_api/convo.js`) → render → suggested replies.
- `convo-knobs.js` / `convo-knobs-system.js` / `convo-knobs-ui.js` / `knobs-drawer.js` — CEFR level / tone / length controls, persisted to `K_CONVO_KNOBS` (v3).
- `convo-layout.js` / `convo-render.js` / `convo-picker-system.js` / `picker-deck/` — Layout shell, message rendering, scenario picker deck.
- `scene-atmo.js` / `characters-drawer.js` — Background video/audio atmo + character portrait drawer.
- `convo-report-ui.js` / `convo-coach.js` / `convo-ai-coach-shell.js` / `phoneme-spelling-map.js` — Post-session report UI, micro-coach prompts during play, phoneme→spelling hints for highlighting.

## Conventions

- **Knobs are a tuple, not a free-form dict.** `{ level, tone, length }` only — see `convo-knobs.js` for the canonical shape. `tone` replaced `mood` in v3.
- **Scenarios are neutral.** Each scenario defines identity + scene only; no hidden conversational steering. Don't add system-prompt nudges here — those belong in the backend prompt contract.
- **Use `luxBus`** for cross-feature state (e.g. `myWordsApi` for highlighted word send-to-practice).
- **Convo routes through `_api/convo.js`**, which validates the shape (non-empty `assistant`, exactly 3 `suggested_replies`) and retries once on timeout.

## See Also

- [scenarios.js](./scenarios.js) — scenario definitions
- [_api/convo.js](../../_api/convo.js) — backend contract (knobs v3, length band semantics)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — CEFR alignment, scenario neutrality, knobs
