# R12 — `lux-test-scaffold`

<!-- Path: docs/routines/registry/R12-test-scaffold-generator.md — Live registry entry for the test scaffold generator (paused). Index at docs/routines/registry/INDEX.md. -->

- **Rename →** Test Scaffold Generator
- 🟡 Paused · `lux-frontend` · testing · reactivation-candidate
- Wednesdays 4:00 AM EDT (`0 4 * * 3`) · Opus 4.7 (standard, not 1M) · cron
- **Output:** test files at `tests/[module-name].test.js` + draft PR "test: scaffold tests for top 5 critical modules — Week WW" + comment on **issue #23**
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-16 17:00 (manual — only run; paused before first scheduled fire)
- **Depends on:** —

## Prompt

```
Generate starter test files for the Lux Pronunciation Tool's most critical untested modules.

PROCESS:
1. Find the 5 .js files with the MOST inbound imports (i.e., most other files depend on them) — these are the highest-value test targets
2. Skip files that already have a corresponding .test.js or .spec.js file
3. For each file, generate a test file with:
   - Basic smoke test: does the module export what it claims to?
   - For functions: test with valid input, test with null/undefined, test with edge cases
   - For UI mount functions: test that they don't throw when called with a mock DOM
   - Use simple assert-style tests (no framework assumed — use console.assert or basic if/throw)

OUTPUT:
- Create test files at tests/[module-name].test.js
- Open a draft PR titled "test: scaffold tests for top 5 critical modules — Week WW"
- Comment on issue #23 listing which modules got tests and why they were selected

RULES:
- Do not modify source files
- Tests should actually run with `node tests/[name].test.js` if possible
- If a module has side effects on import (DOM manipulation, fetch calls), note it and write the test to handle or skip those
- Mark any test you're unsure about with a // TODO: verify this test comment
```

## Notes

Posts to **issue #23** — which per the INDEX Quick Index is R03's Frontend Architecture Audit tracker. Another issue-number collision to resolve during Schedule Calibration (either give this routine its own issue, or confirm #23 is actually a shared multi-routine tracker).

Scaffolded 79 tests on initial manual run per handover.

Design choice worth preserving on any reactivation: **no framework assumed — uses `console.assert` or basic `if/throw`** so scaffolded tests run with a bare `node tests/[name].test.js`, no Vitest/Jest/Mocha setup required. That said: the repo is now on Vitest (164 tests passing as of 2026-04-19), so if R12 is reactivated it may make more sense to generate Vitest-style tests directly rather than bare `console.assert`. Flag for the prompt-sharpening pass.

The `// TODO: verify this test` escape hatch for uncertain cases is a nice humility guard — prevents the routine from committing tests it's not sure about.

**⚠️ No activity gate.** Same pattern as R11 — every Wednesday fires the "find top 5 untested files" scan regardless of whether anything's changed. Add a gate before unpause.

Pivot candidate: "lowest-coverage file → test PR generator" pattern (Backlog 🔵 Testing) — now that Vitest coverage is wired up, this routine could walk coverage up one file per week autonomously rather than generating scaffolds once.

Model is Opus 4.7 **standard, not 1M** — top-5 inbound-import analysis is bounded.
