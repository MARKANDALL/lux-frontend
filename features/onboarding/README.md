# features/onboarding

First-run guided deck: four cards that introduce the learner to the page, check their microphone, and hand off to real practice. Shown once per browser (keyed by `K_ONBOARD_SEEN`) or on demand via `?onboard=1`.

## Key Files

- `lux-onboarding.js` — deck controller: builds overlay, steps through `STEPS`, manages mic state, gated next-button progression.
- `onboarding-steps.js` — the step catalogue and the `SEEN_KEY`.
- `onboarding-mic.js` — `getUserMedia()` request, analyser setup, level-meter rendering; reusable `stopMic` / `resumeMeterIfPossible` for step transitions.
- `onboarding-actions.js` — `runAction()` dispatch for per-step actions (request mic, play sample, etc.).

## Conventions

- Mic is acquired inside the overlay and released on step-change so the practice recorder can claim it cleanly.
- `?onboard=1` forces the deck open even if the seen flag is set — useful for demos and support.
- Deck text uses `escapeHtml` — never render user-derived strings raw.

## See Also

- [`src/main.js`](../../src/main.js) — calls `maybeShowOnboarding()` at boot
- [`app-core/lux-storage.js`](../../app-core/lux-storage.js) — `K_ONBOARD_SEEN`
