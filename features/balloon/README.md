# features/balloon

The practice-progress balloon: a small visual that inflates as a learner completes parts of a passage and triggers a confetti pop when they finish. Purely cosmetic feedback; emits no state beyond its own DOM.

## Key Files

- `index.js` — Public surface: `updateBalloon(count, max)` and `popBalloon()`.
- `ui.js` — DOM creation, per-step visual updates, and the "Confetti Pop" physics animation on completion.
- `balloon.css` — Balloon sizing, colors, and pop keyframes.

## Conventions

- The feature is pull-based: other features call `updateBalloon`/`popBalloon` — balloon does not subscribe to the bus.
- DOM is created lazily on first update and reused across practice runs.

## See Also

- [features/passages/](../passages/) — caller that drives balloon inflation/pop
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
