# features/convo

The AI Conversations surface (the `convo.html` page). Owns the scenario picker, the chat layout, the Knobs system (level / tone / length), per-turn recording + assessment, the AI Coach drawer, and post-session reporting. 25 scenarios are defined in `scenarios.js` and steered through the knobs to stay CEFR-aligned and bias-neutral.

## Key Files

- `index.js` — single export `bootConvo` (re-export of `convo-bootstrap`).
- `convo-bootstrap.js` — builds the layout, mounts the picker, wires drawers + flow, initializes mode controller and scene atmo.
- `scenarios.js` — source of truth for all 25 scenarios. Each scenario carries `id`, `title`, `desc`, `more` bullets, and `roles` with NPC identity-only descriptions (no behavioral steering).
- `convo-flow.js` — turn loop: hands off to `convo-recording.js`, `convo-turn.js`, and the renderer.
- `convo-modes.js` — mode controller (`intro` / `picker` / `chat`) and history/popstate sync.
- `knobs-drawer.js` — canonical owner of Knobs read/write (`getKnobs`, `setKnobs`, `TONE_EMOJI`); `convo-knobs.js` is a thin re-exporter for legacy import paths.
- `convo-api.js` — wraps `_api/convo.js` with UI-side coaching/highlighting plumbing.
- `convo-render.js`, `convo-highlight.js` — message rendering and trouble-word highlighting.
- `picker-deck/`, `characters-drawer.js`, `scene-atmo.js` — scenario-picker UI, character drawer, ambient scene visuals.
- `convo-persistence.js` — session state save/restore.

## Conventions

- The Knobs (`level`, `tone`, `length`) are the only steering surface — NPC role text in `scenarios.js` deliberately avoids method/behavior scripting (length-, emotion-, CEFR-, perspective-neutral).
- New scenarios go in `scenarios.js` and need matching assets under `public/convo-img/`, `public/convo-vid/`, and `public/assets/characters/`.
- All HTML interpolation must use `escapeHtml` from `helpers/escape-html.js`.
- Tests in [`tests/convo-core.test.js`](../../tests/convo-core.test.js) mock `_api/convo.js` — keep the mock in sync if request shapes change.

## See Also

- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- [`features/streaming/`](../streaming/) — the lower-latency Realtime sibling of Convo
