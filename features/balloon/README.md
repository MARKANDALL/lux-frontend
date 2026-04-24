# features/balloon

Universal "completion balloon" UI used across practice surfaces. Tracks how many parts of the current passage have been completed and pops with a confetti animation when the user finishes the last one.

## Key Files

- `index.js` — public surface: `updateBalloon(count, max)` and `popBalloon()`. Other features (passages, recorder, results) call only these two.
- `ui.js` — DOM creation (`#lux-balloon-wrapper`, `#lux-balloon`, core, tip), visual updates that scale the balloon as the count climbs, and the confetti-pop physics.
- `balloon.css` — sizing, gradient, and confetti keyframes.

## Conventions

- Self-contained: no imports from other features. Keep it that way so any surface can mount it.
- DOM is created lazily on first call to `updateBalloon` — features can call freely without a setup step.

## See Also

- [`features/passages/index.js`](../passages/index.js) — primary caller (parts-completed driver)
- [`features/results/`](../results/) — pops the balloon on summary view
