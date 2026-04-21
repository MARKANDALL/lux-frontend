# features/onboarding

First-run onboarding deck — a premium 4-card overlay shown once per user ("do, then explain"). Handles mic permissions live inside the deck so the learner's first experience is recording, not reading.

## Key Files

- `lux-onboarding.js` — public `maybeShowOnboarding()` entry. Respects `?onboard=1` to force-open and `K_ONBOARD_SEEN` to suppress. Renders the overlay and drives per-step state.
- `onboarding-steps.js` — declarative `STEPS[]` array and the `SEEN_KEY` export.
- `onboarding-mic.js` — mic setup / teardown used inside the deck (`stopMic`, `stopMeterOnly`, `resumeMeterIfPossible`).
- `onboarding-actions.js` — `runAction()` dispatcher for per-step CTAs.

## Conventions

- **Force-open via query string.** `?onboard=1` always shows the deck regardless of `K_ONBOARD_SEEN` — use this for QA, not as a user feature.
- **Mic lifecycle lives here.** Onboarding is the only feature that opens a mic stream before the recorder flow; it must stop the stream on teardown to avoid leaking the device.

## See Also

- [app-core/lux-storage.js](../../app-core/lux-storage.js) — `K_ONBOARD_SEEN`
- [features/recorder/media.js](../recorder/media.js) — the "real" mic pipeline used post-onboarding
