# features/onboarding

The premium 4-card onboarding deck shown to first-time users on the Practice page. "Do > explain" — instead of a passive walkthrough, each card has a real action (request mic, try a sample phrase) before continuing.

## Key Files

- `lux-onboarding.js` — `maybeShowOnboarding()` (gated by `K_ONBOARD_SEEN` and `?onboard=1`), `showOnboarding()`. Owns the deck shell and per-step rendering.
- `onboarding-steps.js` — the `STEPS` array (welcome, mic, sample-phrase, done). Each step: `key`, `stepLabel`, `title`, `bodyHtml`, `primary`, `secondary`.
- `onboarding-mic.js` — `requestMic()`, `setupAnalyser`, `stopMic`, `stopMeterOnly`, `resumeMeterIfPossible`. Live mic-level meter built off `getUserMedia` + AnalyserNode.
- `onboarding-actions.js` — `runAction(action, ctx)` dispatcher (`requestMic`, `samplePhrase`, …) called by the deck primary buttons.

## Conventions

- "Seen" state is persisted via `K_ONBOARD_SEEN` from `app-core/lux-storage` — not a raw `localStorage` key.
- Force the flow with `?onboard=1` for screenshots and QA.
- Mic state is owned by `onboarding-mic.js`; do not start a parallel `getUserMedia` from another step.
- The deck calls back into the recorder for the sample-phrase step — keep that import path stable.

## See Also

- [`features/recorder/`](../recorder/) — used by the sample-phrase action
- [`app-core/lux-storage.js`](../../app-core/lux-storage.js)
