# tests

Cross-cutting Vitest protection-ring tests. Feature- and module-local tests are colocated with source (e.g. `app-core/lux-bus.test.js`, `_api/attempts.test.js`); this folder holds tests that span several modules or guard architectural invariants.

## Key Files

- `scoring.test.js` — Smoke + edge-case coverage for `core/scoring/index.js`, the highest-inbound-imports module in the repo (24+). Pins the Blue/Yellow/Red and coaching-tier constitution.
- `helpers-core.test.js` — Covers `helpers/core.js` (12 inbound imports), including the `typeof window !== "undefined"` guard that keeps it safe to import in Node.
- `attempt-pickers.test.js` — Covers `features/progress/attempt-pickers.js` (13 inbound imports): `pickTS`, `pickPassageKey`, `pickSessionId`, `pickSummary`, `pickAzure`.
- `phonemes-core.test.js` — Covers `src/data/phonemes/core.js` (`norm`, `normalizePhoneSequence`).
- `escape-html.test.js`, `md-to-html.test.js` — HTML-sanitization primitives used on every AI coaching render.

## Conventions

- Run via `npx vitest` or `npm test`. No jsdom by default — tests must work in plain Node unless they explicitly opt in.
- This folder is for protection-ring style tests: high-inbound or architecturally load-bearing modules. Feature-internal tests stay next to source.
- Each test file begins with a short comment explaining the inbound-imports surface it protects and any side-effect caveats on import.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — testing posture
- Colocated tests: `app-core/*.test.js`, `_api/*.test.js`, `features/features/selfpb/*.test.js`
