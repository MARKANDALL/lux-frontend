# features/onboarding

First-run 4-card onboarding deck. Demonstrates the core workflow (do > explain), handles microphone permissions, and records that the user has seen it so it won't show again.

Can be force-opened via `?onboard=1` in the URL for testing.

## Key Files

- `lux-onboarding.js` — `maybeShowOnboarding`. Checks `K_ONBOARD_SEEN`, builds the 4-card overlay, drives step-by-step progression.
- `onboarding-steps.js` — the card manifest: copy, visuals, per-step actions.
- `onboarding-mic.js` — microphone permission + meter: `stopMic`, `stopMeterOnly`, `resumeMeterIfPossible`.
- `onboarding-actions.js` — `runAction`. Dispatches a step's action (request mic, try-recording, etc.).

## Conventions

- The `seen` flag persists in localStorage (`K_ONBOARD_SEEN`) — clear it to re-show, or append `?onboard=1`.
- Mic state must be torn down on close — `stopMic` releases the stream, `stopMeterOnly` just stops the meter loop without releasing.
- Styles live in the root `lux-onboarding.css`, not in this folder (legacy positioning).

## See Also

- [src/main.js](../../src/main.js) — calls `maybeShowOnboarding()` at boot
- [app-core/lux-storage.js](../../app-core/lux-storage.js) — `K_ONBOARD_SEEN` constant
