# features/balloon

The animated progress balloon shown during practice. Fills as the learner completes parts of a passage, "pops" (confetti physics) when they reach the end.

Small and self-contained — two files plus a stylesheet. Called from [features/passages/](../passages/) and [features/recorder/](../recorder/).

## Key Files

- `index.js` — public surface: `updateBalloon(count, max)` and `popBalloon()`.
- `ui.js` — DOM creation, visual updates, and the confetti pop physics.
- `balloon.css` — all balloon styles (imported from `ui.js`).

## Conventions

- Callers never touch the DOM — they only call `updateBalloon`/`popBalloon` from `index.js`.
- DOM is lazily created on first call (`ensureDOM`). Safe to import from multiple pages.

## See Also

- [features/passages/](../passages/) — primary caller on the practice page
- [features/recorder/](../recorder/) — calls `popBalloon()` on successful attempts
