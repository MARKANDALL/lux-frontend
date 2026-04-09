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

## Stage 2 — Silent catch fix in features/features/tts/player-core.js
Date: 2026-04-08 16:17 EDT
Task type: silent-catches
Files touched:
 1. features/features/tts/player-core.js (line 41)
What changed: Added warnSwallow call to previously-silent catch in getVoiceCaps() so TTS voice-capability lookup failures now log visibly while preserving the empty-object fallback.
How to revert: git checkout simoishi-s2-pre
Git tags: pre = simoishi-s2-pre, done = simoishi-s2-done
Blast radius: LOW (feature-level file)
Test result: ✅ PASSED
Notes: Second successful single-file run for the silent-catches task type. Trust counter: 1/5 → 2/5. First LOW blast radius run under the ungraduated rules.

## Stage 3 — Silent catch fix in features/features/tts/player-core.js
Date: 2026-04-08 16:34 EDT
Task type: silent-catches
Files touched:
 1. features/features/tts/player-core.js (line 59)
What changed: Added warnSwallow call to previously-silent catch in b64ToBlob() so malformed or invalid TTS base64 audio payloads now log visibly while preserving the empty-blob fallback.
How to revert: git checkout simoishi-s3-pre
Git tags: pre = simoishi-s3-pre, done = simoishi-s3-done
Blast radius: LOW (feature-level file)
Test result: ✅ PASSED
Notes: Third successful single-file run for the silent-catches task type. Trust counter: 2/5 → 3/5.

## Stage 4 — Silent catch fix in features/features/tts/boot-tts.js
Date: 2026-04-09 15:25 EDT
Task type: silent-catches
Files touched:
 1. features/features/tts/boot-tts.js (line 157)
What changed: Added warnSwallow call to previously-silent catch in ensureTTSPlayerMounted() so lazy TTS player boot failures now log visibly while preserving the retry/reset behavior.
How to revert: git checkout simoishi-s4-pre
Git tags: pre = simoishi-s4-pre, done = simoishi-s4-done
Blast radius: LOW (feature-level file)
Test result: ✅ PASSED
Notes: Fourth successful single-file run for the silent-catches task type. Trust counter: 3/5 → 4/5.
