# features/balloon

The tiny celebratory balloon shown in the practice flow. It inflates as parts are completed and "pops" with a confetti animation when the learner reaches the end of a passage or hits a summary milestone. Pure UI polish — no API calls, no scoring logic.

## Key Files

- `index.js` — public surface. Exports `updateBalloon(count, max)` and `popBalloon()`.
- `ui.js` — DOM creation, visual updates, and the confetti pop physics. Builds the wrapper/balloon/core/tip elements on first call and reuses them.
- `balloon.css` — styles for the wrapper, balloon body, and confetti particles.

## Conventions

- **Idempotent DOM.** `ensureDOM()` bails out if the wrapper already exists — safe to call `updateBalloon` repeatedly.
- **Public API is two functions.** Features should only call `updateBalloon` / `popBalloon`; never reach into `ui.js` directly.

## See Also

- [features/passages/index.js](../passages/index.js) — the primary caller that advances the balloon as parts complete
- [features/results/](../results) — triggers `popBalloon()` on summary
