# features

Every user-facing feature module in the Lux frontend. Each direct subfolder is one product surface (Practice Skills pieces, AI Convo, Life Journey, Streaming, etc.) and owns its own DOM wiring, CSS, and local state. Features import shared primitives from `app-core/`, `core/`, `helpers/`, `_api/`, and `ui/` — they do **not** import each other freely. Page entry points in `src/` compose features into a running app.

## Subfolders

- `balloon/` — The inflating-balloon visual that tracks multi-part passage progress.
- `convo/` — AI Conversations (25 scenarios, CEFR knobs, character drawer, per-turn TTS/record).
- `dashboard/` — The "My Progress" drawer on Practice Skills and the full dashboard on `progress.html`.
- `features/` — Shared sub-surfaces that don't belong to one feature: Self-Playback (`selfpb/`) and Text-to-Speech (`tts/`) drawers.
- `harvard/` — Harvard Sentences library picker + library modal (filter by phoneme, favorites).
- `interactions/` — Cross-cutting interaction wiring: phoneme hover, chips, YouGlish, legend toggle, metric modals.
- `life/` — Life Journey — mission-driven practice scenarios that hand off to Convo.
- `my-words/` — Personal vocabulary tracker (panel + library modal + prefix-keyed persistence).
- `next-activity/` — Builds and consumes a "Next Practice Plan" (phoneme-targeted Harvard list or passage).
- `onboarding/` — First-run 4-card deck with mic permission step.
- `passages/` — Passage picker + multi-part navigation + info tooltip state.
- `practice-highlight/` — Renders practice text with phoneme/trouble highlighting.
- `progress/` — History rollups, attempt-detail modal, Next-Practice, render, and Wordcloud.
- `recorder/` — Mic capture, level meter, MediaRecorder lifecycle, quality guardrails.
- `results/` — Results table/header/summary renderer for Practice Skills.
- `streaming/` — Real-time WebRTC / Realtime-API voice chat surface.
- `voice-mirror/` — 5-recording consent flow and "hear it in my voice" synthesis.

## Conventions

- **One feature per folder.** An `index.js` (or `<feature>.js`) is the public entrypoint. Call sites import only from that entrypoint.
- **No feature ↔ feature imports** unless going through a well-defined seam (e.g. `convo-bootstrap.js` consuming `next-activity`'s plan helpers).
- **CSS belongs with the feature.** Side-loaded via `import "./foo.css"` or top-level root CSS; see `_parts/` for the partial-stylesheet convention used by the Convo picker.
- **Use `app-core/lux-bus.js`** for cross-feature state instead of creating new globals.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [src/](../src/) — page entry points that boot features
- Each feature's own `README.md` for its specific structure
