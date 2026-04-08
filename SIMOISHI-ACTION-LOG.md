## Stage 1 — Silent catch fix in app-core/state.js
Date: 2026-04-08 15:47 EDT
Task type: silent-catches
Files touched:
 1. app-core/state.js (line 144)
What changed: Added warnSwallow call to previously-silent promise catch in nukeSWInDev() so service-worker cleanup failures now log visibly.
How to revert: git checkout simoishi-s1-pre
Git tags: pre = simoishi-s1-pre, done = simoishi-s1-done
Blast radius: HIGH (app-core canary file)
Test result: ✅ PASSED
Notes: First successful single-file run for the silent-catches task type. Trust counter: 0/5 → 1/5.
