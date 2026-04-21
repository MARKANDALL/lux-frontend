# features

One folder per product surface. Each subfolder is a self-contained feature module — it owns its DOM, its wiring, its styles (if any), and its boot entry. Pages in [src/](../src/) compose features; features do not reach across into each other's internals, they coordinate through [app-core/lux-bus.js](../app-core/lux-bus.js) or through explicit exports.

## Feature Modules

- `balloon/` — animated progress balloon shown during practice.
- `convo/` — AI Conversations page: scenarios, knobs, TTS, picker deck, per-turn flow.
- `dashboard/` — Practice-page "My Progress" drawer and full Progress Hub dashboard.
- `harvard/` — Harvard Sentences picker + library modal.
- `interactions/` — shared UI interaction helpers (hover, phoneme audio, metric modals, legend toggles).
- `life/` — Life Journey: deck-based mission game that hands off to Convo.
- `my-words/` — personal vocabulary tracker with library modal and launcher.
- `next-activity/` — builds and consumes "Next Practice Plan" based on rollups.
- `onboarding/` — first-run 4-card deck and mic-permission flow.
- `passages/` — passage selector and passage-state DOM.
- `practice-highlight/` — renders passage text with phoneme/trouble-word highlighting.
- `progress/` — rollups, trend, wordcloud, attempt detail — everything the Progress Hub shows.
- `recorder/` — microphone capture, Azure assessment orchestration, audio modes.
- `results/` — post-attempt results screen: rows, summary, AI Coach shell.
- `streaming/` — OpenAI Realtime API via WebRTC: transport, audio, prompt, router.
- `voice-mirror/` — voice-clone onboarding + "hear it in my voice" TTS playback.

## Conventions

- Each feature has an `index.js` that is the feature's public surface (typically a `boot*` or `mount*` or `wire*` function).
- Feature CSS lives next to the feature's JS (e.g. `balloon/balloon.css`) or as a top-level `lux-*.css` file in the repo root for legacy reasons.
- Cross-feature communication goes through the bus. Do not `import` from a deep internal path like `features/convo/convo-state.js` — import from `features/convo/index.js`.
- A `features/features/` subfolder exists for legacy reasons (TTS boot, peekaboo self-playback). Treat it as an internal implementation detail.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — page → feature composition
- [src/](../src/) — per-page entry points that wire features together
- [app-core/lux-bus.js](../app-core/lux-bus.js) — the coordination primitive
