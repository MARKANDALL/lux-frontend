# features/onboarding

First-run 4-card onboarding deck. Includes a real microphone-permission step with a live level meter so the mic is actually verified working before the learner hits their first record button. Runs once per browser; seen state lives in `K_ONBOARD_SEEN`. Force-replay with `?onboard=1`.

## Key Files

- `lux-onboarding.js` — Entry. `maybeShowOnboarding()` (gate on `K_ONBOARD_SEEN` + `?onboard=1`) and `showOnboarding()` (build overlay, card, accent, body, skip button, step state machine).
- `onboarding-steps.js` — `STEPS` — the 4-step content (titles, body HTML, primary CTA label/action).
- `onboarding-mic.js` — `requestMic`, `stopMic`, `stopMeterOnly`, `resumeMeterIfPossible`. Builds an `AudioContext` + `AnalyserNode`, updates a visible level meter, and swaps CTA text between "Requesting…", "Allow", "Next".
- `onboarding-actions.js` — `runAction(name, state, card)` — dispatches step primary actions (e.g. `mic:request`).

## Conventions

- **Real mic, not a mock.** The mic step calls `navigator.mediaDevices.getUserMedia` and wires a live analyser. Don't fake it — the whole point is to catch permission/hardware issues up front.
- **Release the mic on unmount.** `stopMic(state)` + `stopMeterOnly` exist so the onboarding doesn't hold the microphone after completion or skip.
- **`?onboard=1` force-open** is a deliberate dev affordance — keep it working.

## See Also

- [features/recorder/](../recorder/) — the downstream consumer that expects mic permission to already be granted
- [app-core/lux-storage.js](../../app-core/lux-storage.js) — `K_ONBOARD_SEEN`
