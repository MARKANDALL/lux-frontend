# features

The product surfaces. Each direct subfolder is a self-contained feature module that `src/*.js` page entrypoints import and mount. Features depend on `app-core/`, `core/`, `helpers/`, `ui/`, and `_api/`; they should not reach into each other's internals except through documented exports.

## Subfolders

- `balloon/` — celebratory balloon widget with confetti-pop physics
- `convo/` — AI Conversations: scenario picker, chat UI, knobs, coaching, reports
- `dashboard/` — practice-page and progress-hub dashboard bootstrap
- `harvard/` — Harvard sentences picker and library modal
- `interactions/` — shared UI interaction behaviours (hover, phoneme audio, metric modals, legends)
- `life/` — Life Journey mission-driven practice surface
- `my-words/` — personal vocabulary tracker (side panel + library modal)
- `next-activity/` — "Next Practice Plan" targeting from rollups
- `onboarding/` — first-run guided deck (mic check, tour cards)
- `passages/` — passage state controller for Practice Skills
- `practice-highlight/` — phoneme-aware passage text highlighter
- `progress/` — attempts, rollups, wordcloud, attempt-detail modal
- `recorder/` — mic capture, audio mode, upload orchestration
- `results/` — prettified pronunciation results and summary shells
- `streaming/` — Realtime API streaming (WebRTC / WebSocket)
- `voice-mirror/` — learner-voice clone TTS tile and onboarding
- `features/` — nested sub-features: `selfpb/` (self playback), `tts/` (text-to-speech). Legacy nested path kept for import stability.

## Conventions

- Each feature has an `index.js` that exports its public mount/boot function. Callers should import from the feature's `index.js`, not from internal files.
- Cross-feature communication goes through `luxBus` — do not import sibling feature internals directly.
- CSS colocated with the feature (`*.css`) is imported from JS; CSS fragments in `_parts/` are for shared CSS pipelines.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — feature boundaries and ownership
- [`src/`](../src/) — page entrypoints that wire features together
