# features/balloon

The inflating-balloon visual that tracks multi-part passage progress. As the learner completes each part of a recorded passage, the balloon swells and rises; on the final part it pops into a confetti animation. Zero state outside this folder — the feature exposes just `updateBalloon(count, max)` and `popBalloon()`.

## Key Files

- `index.js` — Public entry. Re-exports `updateBalloon` → `ui.updateVisuals` and `popBalloon` → `ui.popAnimation`.
- `ui.js` — Builds the DOM (`#lux-balloon-wrapper`, `#lux-balloon`, `#lux-balloon-core`, `#lux-balloon-tip`), drives CSS custom properties (`--scale`, `--inflateDur`, hsl background), and spawns 50 confetti particles with randomized arc trajectories on pop.
- `balloon.css` — Keyframes (`lux-balloon-inflating`, `confettiFall`) and the wrapper/core/tip layout.

## Conventions

- **Feature-local DOM.** The balloon is appended to `document.body` lazily on first call to `updateVisuals` — no HTML markup required in `index.html`.
- **Reflow trick:** `void balloon.offsetWidth` is used to retrigger the inflate animation on each step. Don't "clean it up" — it's load-bearing.
- **Called from `features/passages/`** to report part completion and from `features/results/` to trigger the pop on summary display.

## See Also

- [features/passages/index.js](../passages/index.js) — primary caller
- [features/README.md](../README.md)
