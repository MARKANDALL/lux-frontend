# features

Feature modules — each subfolder owns one learner-facing capability (recorder, results, conversations, dashboard, life, …). Features compose the app: page entries in `src/` mount one or more features, and features consume `_api/`, `app-core/`, `core/`, `helpers/`, and `ui/` but not each other's internals.

## Layout

Each direct subfolder below has its own README. Grouped by rough role:

- **Practice loop** — `recorder/`, `passages/`, `results/`, `balloon/`, `practice-highlight/`
- **AI + voice** — `convo/`, `streaming/`, `voice-mirror/`
- **Progress & planning** — `progress/`, `dashboard/`, `my-words/`, `next-activity/`
- **Content & engagement** — `harvard/`, `life/`, `onboarding/`
- **Shared interactions** — `interactions/`
- **Nested primitives** — `features/features/` holds cross-feature audio drawers (self-playback) and TTS. These are treated as shared sub-primitives rather than standalone features.

## Conventions

- **One feature, one folder.** A feature's public surface is its `index.js` (or a named boot function). Other files are considered internal.
- **No horizontal imports between features.** If feature A needs feature B's logic, lift it into `core/`, `helpers/`, or `app-core/` — or expose a minimal public API via B's `index.js`.
- **Lazy-load heavy UI.** Patterns like `features/features/08-selfpb-peekaboo.js` show the "tab eager, body on click" approach for large drawers.
- **Storage keys via `K_*` constants only.** No feature may invent raw storage keys; every key must be registered in `app-core/lux-storage.js` first.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — layering rules and boot order
- [src/](../src) — the page entries that mount these features
