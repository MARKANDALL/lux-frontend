# features/onboarding

The four-card "do, then explain" onboarding deck shown on a learner's first visit (or via `?onboard=1`). Wraps a tiny live mic meter so the first step actually demonstrates microphone access rather than lecturing about it.

## Key Files

- `lux-onboarding.js` — `maybeShowOnboarding()` — gates on `K_ONBOARD_SEEN` (skipped unless `?onboard=1` forces it) and runs the deck.
- `onboarding-steps.js` — `STEPS` array: the card content/order, and `SEEN_KEY` storage key.
- `onboarding-mic.js` — `stopMic`, `stopMeterOnly`, `resumeMeterIfPossible` — microphone + meter lifecycle used during the first step.
- `onboarding-actions.js` — `runAction(action)` — handler for per-step actions (start mic, advance, finish).

## Conventions

- The deck is one-shot by design: `K_ONBOARD_SEEN` is set on completion and the deck never auto-reopens without the query flag.
- Mic access is acquired inside a user gesture on the mic step; `features/recorder` owns the real practice pipeline and is not driven from here.

## See Also

- [features/recorder/README.md](../recorder/README.md)
- [app-core/lux-storage.js](../../app-core/lux-storage.js) — `K_ONBOARD_SEEN`
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
