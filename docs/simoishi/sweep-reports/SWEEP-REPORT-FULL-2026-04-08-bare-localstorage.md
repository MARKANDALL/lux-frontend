# Sweep Report (FULL) — bare-localstorage

**Date:** 2026-04-08 16:40 EDT  
**Repo:** `C:\dev\LUX_GEMINI`  
**Sweep type:** `bare-localstorage`  
**Manifest:** pre-approved by Mark  
**Rule checked:** 2 — No Raw localStorage/sessionStorage

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

**Intentional-wrapper exclusion for this sweep**
- `app-core/lux-storage.js` only
- files that import `lux-storage.js` and use only helpers are not findings

**Red-zone scan policy**
- red-zone hits are reported in the rejection log only
- red-zone hits are excluded from any future stage proposal per Rule S12

---

## Totals

- **Mechanical storage hits reviewed:** 28
- **Reportable findings:** 5
  - 🔴 Critical: 5
  - 🟡 Advisory: 0
  - 🔵 Note: 0
- **Rejected / excluded entries logged:** 23
- **Red-zone exclusions:** 12

---

## Findings

### Finding 1 of 5
**Rule:** 2 — No Raw localStorage/sessionStorage  
**Severity:** 🔴 Critical  
**File:** `ui/ui-ai-ai-logic/attempt-policy.js`  
**Lines:** 15, 24, 63, 64

**Current code:**
```js
const LUX_PRACTICE_ATTEMPT_KEY = "lux:practiceAttemptCount";
const LUX_AICOACH_EARLY_CLOSE_KEY = "lux:aicoachEarlyCloseCount";
const LUX_AICOACH_EARLY_CLOSED_A1_KEY = "lux:aicoachEarlyClosedAttempt1";
const LUX_AICOACH_EARLY_CLOSED_A2_KEY = "lux:aicoachEarlyClosedAttempt2";

function getLuxSessionInt(key) {
  try {
    const v = Number(sessionStorage.getItem(key) || 0);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function setLuxSessionInt(key, n) {
  try {
    sessionStorage.setItem(key, String(n));
} catch (err) { globalThis.warnSwallow("ui/ui-ai-logics/attempt-policy.js", err, "important"); }
}
```

**Why this matters:** raw `sessionStorage` access bypasses the canonical wrapper and still relies on bare string keys local to the file.  
**Notes:** this file should move to `sessionGetNum/sessionSetNum` and use `K_` constants from `app-core/lux-storage.js` instead of local literals.

---

### Finding 2 of 5
**Rule:** 2 — No Raw localStorage/sessionStorage  
**Severity:** 🔴 Critical  
**File:** `ui/warp-core.js`  
**Lines:** 51, 58, 59

**Current code:**
```js
const KEY = "luxWarpNext";

export async function warpGo(url, { outMs = 220 } = {}){
  sessionStorage.setItem(KEY, "1");
  await warpOut(outMs);
  window.location.href = url;
}

export function warpInIfNeeded({ inMs = 260 } = {}){
  ensureWarpOverlay();
  const should = sessionStorage.getItem(KEY) === "1";
  if (should) sessionStorage.removeItem(KEY);
  if (should) warpIn(inMs);
}
```

**Why this matters:** raw `sessionStorage` is used directly even though `K_UI_WARP_NEXT`, `sessionGet`, `sessionSet`, and `sessionRemove` already exist in the canonical wrapper.  
**Notes:** this is a clean migration target because the canonical key already exists.

---

### Finding 3 of 5
**Rule:** 2 — No Raw localStorage/sessionStorage  
**Severity:** 🔴 Critical  
**File:** `features/streaming/transport/session-bootstrap.js`  
**Lines:** 13, 20, 21

**Current code:**
```js
function getClientToken() {
  if (typeof window === "undefined") return "";
  
  // Try storage first
  let t = sessionStorage.getItem(K_ADMIN_TOKEN) || localStorage.getItem(K_ADMIN_TOKEN);
  
  // If missing, ASK the user and save it
  if (!t) {
    t = prompt("⚠️ Admin Token required for Streaming. Please paste it here:");
    if (t) {
      t = t.trim();
      sessionStorage.setItem(K_ADMIN_TOKEN, t); // Save for this session
      localStorage.setItem(K_ADMIN_TOKEN, t);   // Save forever
    }
  }
  return t || "";
}
```

**Why this matters:** this duplicates the token-storage logic already centralized in `_api/util.js::getAdminToken()`.  
**Notes:** not red-zone itself, but it is a duplicate raw-storage path for admin token handling.

---

### Finding 4 of 5
**Rule:** 2 — No Raw localStorage/sessionStorage  
**Severity:** 🔴 Critical  
**File:** `features/harvard/modal-favs.js`  
**Lines:** 9, 19, 33, 36

**Current code:**
```js
try {
  const raw = localStorage.getItem(K_HARVARD_FAVS);
  const arr = raw ? JSON.parse(raw) : [];
  favs = new Set(
    (Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter(Boolean)
  );
} catch {
  favs = new Set();
}

try {
  const raw = localStorage.getItem(K_PASSAGES_FAVS);
  const arr = raw ? JSON.parse(raw) : [];
  favKeys = new Set(
    (Array.isArray(arr) ? arr : []).map((x) => String(x)).filter(Boolean)
  );
} catch {
  favKeys = new Set();
}

try {
  localStorage.setItem(K_HARVARD_FAVS, JSON.stringify(Array.from(favs || [])));
} catch (err) { globalThis.warnSwallow("features/harvard/modal-favs.js", err, "important"); }
try {
  localStorage.setItem(K_PASSAGES_FAVS,
    JSON.stringify(Array.from(favKeys || []))
  );
} catch (err) { globalThis.warnSwallow("features/harvard/modal-favs.js", err, "important"); }
```

**Why this matters:** the file uses canonical key constants but still bypasses the canonical storage helper layer.  
**Notes:** this is a straightforward helper migration candidate.

---

### Finding 5 of 5
**Rule:** 2 — No Raw localStorage/sessionStorage  
**Severity:** 🔴 Critical  
**File:** `features/results/header.js`  
**Lines:** 312, 318

**Current code:**
```js
const markSeen = (k) => {
  try { sessionStorage.setItem(k, "1"); } catch (err) {
    globalThis.warnSwallow("features/results/header.js", err);
  }
};

const isSeen = (k) => {
  try { return sessionStorage.getItem(k) === "1"; } catch { return false; }
};
```

**Why this matters:** this is raw `sessionStorage` access plus ad-hoc key management instead of the wrapper helpers.  
**Notes:** the keys here are dynamic function inputs, so this is a good example of a likely real finding but still one that needs a careful migration plan.

---

## Rejection Log

### Rejected because: looked like a violation but isn't

| # | File | Line | Pattern matched | Why I rejected it |
|---|------|------|-----------------|-------------------|
| 1 | `app-core/lux-storage.js` | 20 | `storage.getItem(...)` | This file is the canonical wrapper; internal storage calls are intentional for this sweep. |
| 2 | `app-core/lux-storage.js` | 25 | `storage.setItem(...)` | This file is the canonical wrapper; internal storage calls are intentional for this sweep. |
| 3 | `app-core/lux-storage.js` | 30 | `storage.removeItem(...)` | This file is the canonical wrapper; internal storage calls are intentional for this sweep. |
| 4 | `features/recorder/audio-inspector.js` | 4 | `localStorage.setItem("luxAudioInspector","1")` | Comment/example only; not executable code. |

### Rejected because: red-zone file (Rule S12)

| # | File | Line | Pattern matched |
|---|------|------|-----------------|
| 1 | `_api/util.js` | 53 | `sessionStorage.getItem(K_ADMIN_TOKEN)` |
| 2 | `_api/util.js` | 54 | `localStorage.getItem(K_ADMIN_TOKEN)` |
| 3 | `_api/util.js` | 61 | `sessionStorage.setItem(K_ADMIN_TOKEN, t)` |
| 4 | `_api/util.js` | 62 | `localStorage.setItem(K_ADMIN_TOKEN, t)` |
| 5 | `_api/identity.js` | 59 | `localStorage.getItem(KEY)` |
| 6 | `_api/identity.js` | 60 | `localStorage.getItem(ALIAS_KEY)` |
| 7 | `_api/identity.js` | 61 | `localStorage.getItem(LEGACY_KEY)` |
| 8 | `_api/identity.js` | 87 | `localStorage.setItem(KEY, finalUID)` |
| 9 | `_api/identity.js` | 88 | `localStorage.setItem(ALIAS_KEY, finalUID)` |
| 10 | `_api/identity.js` | 90 | `localStorage.setItem(LEGACY_KEY, finalUID)` |
| 11 | `_api/identity.js` | 127 | `localStorage.setItem(KEY, u)` |
| 12 | `_api/identity.js` | 128-129 | `localStorage.setItem(ALIAS_KEY, u)` / `localStorage.setItem(LEGACY_KEY, u)` |

**Red-zone handling:** scanned and logged, but excluded from any future stage proposal. Mark as **🛑 RED-ZONE — MANUAL REVIEW ONLY**.

### Rejected because: ambiguous or judgment call

| # | File | Line | Pattern matched | Reason for hesitation |
|---|------|------|-----------------|----------------------|
| 1 | `ui/ui-ai-ai-logic/attempt-policy.js` | 7-10 | bare string session keys | File also imports some canonical helpers, but no `K_` constants exist yet for these specific session keys; migration shape is obvious, but constant ownership would need review. |
| 2 | `features/results/header.js` | 299-304 | dynamic session keys (`lux:nudge:*`) | Raw storage usage is a clear finding, but the key-set itself may also want consolidation into the canonical key registry. |

### Rejected because: out of scope per manifest

| # | File | Line | Pattern matched | Manifest exclusion |
|---|------|------|-----------------|-------------------|
| 1 | `public/lux-popover.js` | 5 | `localStorage.getItem(KEY)` | Explicitly excluded by manifest. |

---

## Notes

- This sweep only reports **raw browser storage access**, not helper use.
- The repo has two patterns:
  1. files that use canonical `K_` keys but bypass helper functions
  2. files that use raw storage **and** local bare-string key definitions
- The highest-risk cluster is admin-token storage, but those hits are currently red-zone and were logged only.
- Per Mark’s overnight rule, **no stages are proposed in this report**.
