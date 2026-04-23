# features/balloon

The universal celebratory balloon widget. Tracks a count vs. a max, animates growth, and plays a confetti-pop on completion. Used as a small motivation cue across Practice Skills.

## Key Files

- `index.js` — public surface: `updateBalloon(count, max)` and `popBalloon()`. Both are thin passthroughs to `ui.js`.
- `ui.js` — DOM creation (wrapper / balloon / core / tip), visual updates, and the confetti-pop physics.
- `balloon.css` — balloon shell, tip, and pop-animation styles.

## Conventions

- Only `index.js` is public — features should import `updateBalloon` / `popBalloon` from here and never touch the DOM directly.
- Single balloon instance per page; `ui.js` memoises the wrapper element.

## See Also

- [`features/passages/`](../passages/) — primary caller, invokes the balloon on part completion and summary
