# Sweep Report (FULL) — silent-catches

**Date:** 2026-04-07 22:40 EDT  
**Repo:** `C:\dev\LUX_GEMINI`  
**Sweep type:** `silent-catches`  
**Manifest:** approved by Mark before scan  
**Rule checked:** 7 — No Silent Catch Blocks

## Scope used

**In scope**
- `features/`
- `app-core/`
- `ui/`
- `helpers/`
- `_api/`
- `src/`
- `*.js` only

**Out of scope**
- `_ARCHIVE/`
- `node_modules/`
- `dist/`
- `public/vendor/`
- `public/lux-popover.js`
- `src/data/`
- `*.test.js`
- `*.GOLD`
- `lib/`
- `routes/`

**Intentional-swallow wrapper exclusions (only these three files)**
- `app-core/lux-storage.js`
- `app-core/lux-bus.js`
- `ui/lux-warn.js`

**Red-zone scan policy**
- `_api/identity.js` and `_api/util.js` were scanned
- red-zone hits are reported in the rejection log only
- red-zone hits are excluded from any auto-stage per Rule S12

---

## Totals

- **Files scanned:** 317
- **Pattern hits reviewed:** 382
- **Reportable findings:** 19
  - 🔴 Critical: 19
  - 🟡 Advisory: 0
  - 🔵 Note: 0
- **Rejected / excluded entries logged:** 24
- **Red-zone exclusions:** 1

---

## Findings

### Finding 1 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `app-core/state.js`  
**Line:** 141

**Current code:**
```js
navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
```

**Proposed fix:**
```js
navigator.serviceWorker
  .getRegistrations?.()
  .then((rs) => rs.forEach((r) => r.unregister()))
  .catch((err) => globalThis.warnSwallow?.("app-core/state.js", err, "important"));
```

**Why this matters:** promise rejection is silently discarded; if service-worker cleanup fails, there is no visibility.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- app-core/state.js`  
**Smoke test after applying:** run the dev page once and confirm normal startup still works; only failures should emit a warning.

---

### Finding 2 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/features/tts/player-core.js`  
**Line:** 41

**Current code:**
```js
  } catch {
    return {};
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/features/tts/player-core.js", err, "important");
    return {};
  }
```

**Why this matters:** the voice-caps fallback is fine, but the failure is completely silent.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/features/tts/player-core.js`  
**Smoke test after applying:** open TTS UI without a valid token and verify behavior is unchanged except warnings appear on failure.

---

### Finding 3 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/features/tts/player-core.js`  
**Line:** 59

**Current code:**
```js
  } catch {
    return new Blob([], { type: mime || "audio/mpeg" });
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/features/tts/player-core.js", err, "important");
    return new Blob([], { type: mime || "audio/mpeg" });
  }
```

**Why this matters:** invalid base64 decoding is suppressed with no signal.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/features/tts/player-core.js`  
**Smoke test after applying:** synthesize once and confirm normal audio still works.

---

### Finding 4 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/features/tts/boot-tts.js`  
**Line:** 157

**Current code:**
```js
  } catch (_) {
    _playerBooted = false;
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/features/tts/boot-tts.js", err, "important");
    _playerBooted = false;
  }
```

**Why this matters:** player mount failure is hidden except for the boolean reset.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/features/tts/boot-tts.js`  
**Smoke test after applying:** trigger lazy TTS mount and confirm retry behavior still works.

---

### Finding 5 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/streaming/app.js`  
**Line:** 46

**Current code:**
```js
    } catch {
      return false;
    }
```

**Proposed fix:**
```js
    } catch (err) {
      globalThis.warnSwallow?.("features/streaming/app.js", err, "important");
      return false;
    }
```

**Why this matters:** debug flag read failures are hidden.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/streaming/app.js`  
**Smoke test after applying:** load streaming view with and without `?debug=1` and confirm behavior is unchanged.

---

### Finding 6 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/streaming/transport/realtime-webrtc/mic-meter.js`  
**Line:** 53

**Current code:**
```js
  } catch {
    // never fail connect because of a meter
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/streaming/transport/realtime-webrtc/mic-meter.js", err, "important");
    // never fail connect because of a meter
  }
```

**Why this matters:** meter startup failure is intentionally non-fatal, but it is completely silent.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/streaming/transport/realtime-webrtc/mic-meter.js`  
**Smoke test after applying:** start a realtime-webrtc session and confirm connect still succeeds even if meter setup fails.

---

### Finding 7 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/life/app.js`  
**Line:** 11

**Current code:**
```js
  } catch (_) {
    return (Date.now() >>> 0) ^ ((Math.random() * 0xffffffff) >>> 0);
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/life/app.js", err, "important");
    return (Date.now() >>> 0) ^ ((Math.random() * 0xffffffff) >>> 0);
  }
```

**Why this matters:** crypto RNG fallback is acceptable, but failure to access crypto is fully hidden.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/life/app.js`  
**Smoke test after applying:** start a Life Journey run and confirm normal run creation still works.

---

### Finding 8 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/next-activity/next-activity.js`  
**Line:** 19

**Current code:**
```js
  } catch (_) {
    try {
      remove(K_NEXT_ACTIVITY);
    } catch (err) { globalThis.warnSwallow("features/next-activity/next-activity.js", err, "important"); }
    return null;
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/next-activity/next-activity.js", err, "important");
    try {
      remove(K_NEXT_ACTIVITY);
    } catch (removeErr) { globalThis.warnSwallow("features/next-activity/next-activity.js", removeErr, "important"); }
    return null;
  }
```

**Why this matters:** corrupted stored plan is silently discarded with no signal.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/next-activity/next-activity.js`  
**Smoke test after applying:** consume a valid plan and confirm normal behavior remains unchanged.

---

### Finding 9 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/next-activity/next-practice.js`  
**Line:** 97

**Current code:**
```js
  } catch {
    return key;
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/next-activity/next-practice.js", err, "important");
    return key;
  }
```

**Why this matters:** DOM lookup / CSS.escape failures are silently swallowed.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/next-activity/next-practice.js`  
**Smoke test after applying:** build a next-practice plan and confirm labels still resolve.

---

### Finding 10 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/harvard/index.js`  
**Line:** 22

**Current code:**
```js
  } catch {
    return fallback;
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/harvard/index.js", err, "important");
    return fallback;
  }
```

**Why this matters:** JSON parse failure in helper is hidden.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/harvard/index.js`  
**Smoke test after applying:** use Harvard picker random bag flow and verify normal behavior remains.

---

### Finding 11 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/harvard/index.js`  
**Line:** 44

**Current code:**
```js
  } catch {
    return [];
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/harvard/index.js", err, "important");
    return [];
  }
```

**Why this matters:** bag-read failures are silently converted to an empty bag.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/harvard/index.js`  
**Smoke test after applying:** click Harvard random and confirm it still picks correctly.

---

### Finding 12 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/harvard/modal-favs.js`  
**Line:** 14

**Current code:**
```js
  } catch {
    favs = new Set();
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/harvard/modal-favs.js", err, "important");
    favs = new Set();
  }
```

**Why this matters:** Harvard favorites parse/load failures are hidden.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/harvard/modal-favs.js`  
**Smoke test after applying:** open the Harvard modal and verify favorites still load.

---

### Finding 13 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/harvard/modal-favs.js`  
**Line:** 24

**Current code:**
```js
  } catch {
    favKeys = new Set();
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/harvard/modal-favs.js", err, "important");
    favKeys = new Set();
  }
```

**Why this matters:** passage favorites parse/load failures are hidden.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/harvard/modal-favs.js`  
**Smoke test after applying:** verify passage favorites still render in the modal.

---

### Finding 14 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/my-words/service.js`  
**Line:** 12

**Current code:**
```js
  } catch {
    return null;
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/my-words/service.js", err, "important");
    return null;
  }
```

**Why this matters:** auth-user lookup failure is silently treated as unauthenticated.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/my-words/service.js`  
**Smoke test after applying:** open My Words signed in and signed out; behavior should stay the same.

---

### Finding 15 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/progress/wordcloud/side-drawers.js`  
**Line:** 11

**Current code:**
```js
  } catch {
    return fallback;
  }
```

**Proposed fix:**
```js
  } catch (err) {
    globalThis.warnSwallow?.("features/progress/wordcloud/side-drawers.js", err, "important");
    return fallback;
  }
```

**Why this matters:** drawer-state parse failure is suppressed silently.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/progress/wordcloud/side-drawers.js`  
**Smoke test after applying:** toggle wordcloud drawers and confirm state still persists.

---

### Finding 16 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/interactions/ph-hover/tooltip-modal.js`  
**Line:** 75

**Current code:**
```js
    } catch (_) {
      try {
        v.muted = true;
        await v.play();
} catch (err) { globalThis.warnSwallow("features/interactions/ph-hover/tooltip-modal.js", err); }
    }
```

**Proposed fix:**
```js
    } catch (err) {
      globalThis.warnSwallow?.("features/interactions/ph-hover/tooltip-modal.js", err, "important");
      try {
        v.muted = true;
        await v.play();
      } catch (fallbackErr) { globalThis.warnSwallow("features/interactions/ph-hover/tooltip-modal.js", fallbackErr); }
    }
```

**Why this matters:** first play attempt failure is hidden before muted fallback is tried.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/interactions/ph-hover/tooltip-modal.js`  
**Smoke test after applying:** play modal videos with sound on and confirm muted fallback still works when autoplay is blocked.

---

### Finding 17 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/interactions/ph-hover/tooltip-video.js`  
**Line:** 106

**Current code:**
```js
    } catch (_) {
      // Fallback: browsers may block sound
      try {
        v.muted = true;
        await v.play();
      } catch (err) { globalThis.warnSwallow("features/interactions/ph-hover/tooltip-video.js", err); }
    }
```

**Proposed fix:**
```js
    } catch (err) {
      globalThis.warnSwallow?.("features/interactions/ph-hover/tooltip-video.js", err, "important");
      try {
        v.muted = true;
        await v.play();
      } catch (fallbackErr) { globalThis.warnSwallow("features/interactions/ph-hover/tooltip-video.js", fallbackErr); }
    }
```

**Why this matters:** same pattern as the modal variant: the primary failure path is silent.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/interactions/ph-hover/tooltip-video.js`  
**Smoke test after applying:** use hover video playback and verify the fallback still works.

---

### Finding 18 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `ui/components/trouble-chips.js`  
**Line:** 168

**Current code:**
```js
    } catch (_) { /* safe */ }
```

**Proposed fix:**
```js
    } catch (err) {
      globalThis.warnSwallow?.("ui/components/trouble-chips.js", err, "important");
    }
```

**Why this matters:** comment-only catch still swallows runtime failures with no signal.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- ui/components/trouble-chips.js`  
**Smoke test after applying:** click trouble chips and verify scrolling behavior remains unchanged.

---

### Finding 19 of 19
**Rule:** 7 — No Silent Catch Blocks  
**Severity:** 🔴 Critical  
**File:** `features/recorder/audio-mode.js` and `features/recorder/audio-mode-core.js`  
**Lines:** `audio-mode.js:52`, `audio-mode-core.js:51`, `audio-mode-core.js:64`

**Current code:**
```js
// features/recorder/audio-mode.js
  } catch {
    return {};
  }

// features/recorder/audio-mode-core.js
  } catch {
    return AUDIO_MODES.NORMAL;
  }

  } catch {
    // ignore storage failures (private mode etc.)
  }
```

**Proposed fix:**
```js
// features/recorder/audio-mode.js
  } catch (err) {
    globalThis.warnSwallow?.("features/recorder/audio-mode.js", err, "important");
    return {};
  }

// features/recorder/audio-mode-core.js
  } catch (err) {
    globalThis.warnSwallow?.("features/recorder/audio-mode-core.js", err, "important");
    return AUDIO_MODES.NORMAL;
  }

  } catch (err) {
    globalThis.warnSwallow?.("features/recorder/audio-mode-core.js", err, "important");
  }
```

**Why this matters:** recorder audio-mode fallbacks are silent in three places. They are all the same change type and low-risk, but they live in two separate files, so they still need single-file staging while the task type is ungraduated.  
**Risk level of fix:** LOW  
**How to revert:** `git checkout -- features/recorder/audio-mode.js features/recorder/audio-mode-core.js`  
**Smoke test after applying:** toggle audio mode and verify mode persistence + dataset stamping still work.

---

## Rejection Log

### Rejected because: looked like a violation but isn't

| # | File | Line | Pattern matched | Why I rejected it |
|---|------|------|-----------------|-------------------|
| 1 | `app-core/lux-storage.js` | 23 | `catch { return null; }` | Approved wrapper exclusion for this sweep. |
| 2 | `app-core/lux-storage.js` | 63 | `catch { return fallback; }` | Approved wrapper exclusion for this sweep. |
| 3 | `app-core/lux-bus.js` | 23 | `catch (err)` | Approved wrapper exclusion for this sweep. |
| 4 | `app-core/lux-bus.js` | 73 | `catch (err)` | Approved wrapper exclusion for this sweep. |
| 5 | `ui/lux-warn.js` | 11 | `catch (e)` | Approved wrapper exclusion for this sweep. |
| 6 | `ui/lux-warn.js` | 21 | `catch (e)` | Approved wrapper exclusion for this sweep. |
| 7 | `ui/lux-warn.js` | 29 | `catch (err)` | Approved wrapper exclusion for this sweep. |
| 8 | `ui/lux-warn.js` | 39 | `catch (err)` | Approved wrapper exclusion for this sweep. |
| 9 | `ui/lux-warn.js` | 51 | `catch (err)` | Approved wrapper exclusion for this sweep. |
| 10 | `ui/lux-warn.js` | 72 | `catch (e)` | Approved wrapper exclusion for this sweep. |
| 11 | `ui/lux-warn.js` | 88 | `catch (err)` | Approved wrapper exclusion for this sweep. |

### Rejected because: red-zone file (Rule S12)

| # | File | Line | Pattern matched |
|---|------|------|-----------------|
| 1 | `_api/util.js` | 25 | `catch { ... }` |

**Red-zone handling:** scanned and logged, but excluded from any auto-stage. Mark as **🛑 RED-ZONE — MANUAL REVIEW ONLY**.

### Rejected because: ambiguous or judgment call

| # | File | Line | Pattern matched | Reason for hesitation |
|---|------|------|-----------------|----------------------|
| 1 | `ui/warp-nav.js` | 19 | `catch { return; }` | Early-return URL-parse guard; silent, but plausibly intentional navigation filter. |
| 2 | `ui/ui-ai-ai-logic/attempt-policy.js` | 17 | `catch { return 0; }` | Session-storage fallback to zero may be intentional recovery. |
| 3 | `features/convo/picker-deck/cefr-hint-badge.js` | 67 | `catch { return "B1"; }` | Explicit default level fallback; silent but plausibly by design. |
| 4 | `features/life/storage.js` | 10 | `catch (_) { return null; }` | Storage read fallback may be intended API behavior. |
| 5 | `features/streaming/transport/realtime-webrtc/message-handler.js` | 37 | `catch { return; }` | Invalid event JSON is ignored; may be intended hardening behavior. |
| 6 | `features/results/header.js` | 318 | `catch { return false; }` | Session-storage read helper pattern; silent but likely intended UX fallback. |

### Rejected because: out of scope per manifest

| # | File | Line | Pattern matched | Manifest exclusion |
|---|------|------|-----------------|-------------------|
| 1 | `public/lux-popover.js` | 22 | `catch` | Explicitly excluded by manifest. |
| 2 | `public/lux-popover.js` | 91 | `catch` | Explicitly excluded by manifest. |
| 3 | `public/lux-popover.js` | 132 | `.catch(() => {})` | Explicitly excluded by manifest. |
| 4 | `public/vendor/wavesurfer-7.8.11.min.js` | 1 | `catch` | Vendor path excluded by manifest. |
| 5 | `src/data/index.js` | 23 | `.catch(...)` | `src/data/` excluded by manifest. |
| 6 | `src/data/index.js` | 45 | `.catch(...)` | `src/data/` excluded by manifest. |

---

## Notes

- This sweep was intentionally conservative.
- I only reported **clear silent-catch findings**.
- I did **not** extend wrapper exclusions beyond the three files you named.
- I scanned red-zone files but did **not** include them in any future auto-stage.
- One repo-level observation: the silent-catch pattern is concentrated in UI fallback code, storage fallback code, and media/autoplay fallback code.
