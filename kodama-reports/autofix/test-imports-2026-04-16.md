# Autofix: test imports after api→_api rename

- Date: 2026-04-16
- Branch: `claude/kind-bell-55w84`
- Scope: `_api/attempts.test.js`, `_api/identity.test.js`, `_api/util.test.js`

## Rationale

The frontend `api/` directory was renamed to `_api/` (Vercel 12-function limit
workaround). The three colocated test files still performed dynamic imports
from the old path (`await import("../api/XXX.js")`), which no longer exists.
Every such import threw `Cannot find module`, silently wiping out 27 tests.

## Find/replace

Literal string `"../api/` → `"../_api/` (leading double-quote included in the
match so we did not touch `api/` substrings inside comments, URL fragments, or
describe titles).

Per-file replacements (actual vs. task's rough guess):

| file                      | expected (approx) | actual |
|---------------------------|-------------------|--------|
| `_api/attempts.test.js`   | ~9                | 1      |
| `_api/identity.test.js`   | ~13               | 13     |
| `_api/util.test.js`       | ~5                | 13     |
| **total**                 | **27**            | **27** |

Per-file counts differ from the task's rough guess, but the total matches the
hard constraint (27), so the fix proceeded. `git diff --stat` confirms 27
insertions, 27 deletions across the 3 files — no collateral changes.

## Test results

Command: `npm test` (vitest run) at repo root.

### Before

```
Test Files   3 failed | 4 passed (7)
Tests       27 failed | 42 passed (69)
```

All 27 failures were `Error: Cannot find module '/api/XXX.js'`
(`grep -c "Cannot find module"` → 27).

### After

```
Test Files   7 passed (7)
Tests       69 passed (69)
```

`Cannot find module` count: **0**.

## Pre-existing failures unrelated to imports

None. Every one of the 27 previously failing tests now passes. No other tests
were already failing for non-import reasons.

## Constraints honored

- Only the three listed files modified.
- No test logic changed, no tests added/removed.
- `package.json`, vitest config, CI workflows untouched.
- Lint/prettier not run.
- No source files under `_api/*.js` (non-test) touched.
