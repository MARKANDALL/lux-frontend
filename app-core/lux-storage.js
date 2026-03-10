// app-core/lux-storage.js — Canonical storage key registry + typed helpers.
//
// WHY: 39 unique keys across 36 files, 13 used as bare string literals,
// 4 bare-literal keys shared across multiple files, 1 duplicate constant
// definition (lux_knobs_v3 in convo-knobs.js AND knobs-drawer.js).
// One typo in any of those strings = a silent bug nobody will ever see.
//
// DESIGN:
//   - Every key the app uses lives here as a named constant.
//   - Typed helpers (getString, getJSON, getBool, etc.) wrap try/catch.
//   - Features import the key constant + helper, never touch raw strings.
//   - My Words has its own prefix-based dynamic keys — those stay in
//     features/my-words/store.js but use the prefixes exported here.
//
// MIGRATION:
//   This is Pass A — constants + helpers only. No call sites are changed.
//   Pass B migrates call sites file-by-file, highest-risk keys first.

// ─── Helpers (private) ───────────────────────────────────────────────────────

function _get(storage, key) {
  try { return storage.getItem(key); }
  catch { return null; }
}

function _set(storage, key, value) {
  try { storage.setItem(key, value); }
  catch (err) { globalThis.warnSwallow?.("app-core/lux-storage.js", err, "important"); }
}

function _remove(storage, key) {
  try { storage.removeItem(key); }
  catch (err) { globalThis.warnSwallow?.("app-core/lux-storage.js", err, "important"); }
}

// ─── Public helpers ──────────────────────────────────────────────────────────

/** Read a string from localStorage (null if missing). */
export function getString(key)          { return _get(localStorage, key); }

/** Write a string to localStorage. */
export function setString(key, value)   { _set(localStorage, key, String(value)); }

/** Remove a key from localStorage. */
export function remove(key)             { _remove(localStorage, key); }

/** Read a boolean flag ("1"/"true" → true, everything else → false). */
export function getBool(key) {
  const v = _get(localStorage, key);
  return v === "1" || v === "true";
}

/** Write a boolean flag as "1"/"0". */
export function setBool(key, val) {
  _set(localStorage, key, val ? "1" : "0");
}

/** Read JSON from localStorage (returns fallback on missing/bad parse). */
export function getJSON(key, fallback = null) {
  const raw = _get(localStorage, key);
  if (raw == null) return fallback;
  try { return JSON.parse(raw); }
  catch { return fallback; }
}

/** Write JSON to localStorage. */
export function setJSON(key, value) {
  _set(localStorage, key, JSON.stringify(value));
}

/** Read a string from sessionStorage (null if missing). */
export function sessionGet(key)         { return _get(sessionStorage, key); }

/** Write a string to sessionStorage. */
export function sessionSet(key, value)  { _set(sessionStorage, key, String(value)); }

/** Remove a key from sessionStorage. */
export function sessionRemove(key)      { _remove(sessionStorage, key); }

/** Read a numeric counter from sessionStorage (0 if missing). */
export function sessionGetNum(key) {
  return Number(_get(sessionStorage, key) || 0);
}

/** Write a number to sessionStorage. */
export function sessionSetNum(key, n) {
  _set(sessionStorage, key, String(n));
}

// ─── Key registry ────────────────────────────────────────────────────────────
//
// Naming: K_<CATEGORY>_<PURPOSE>
// Every key the Lux frontend reads or writes is listed here.
// Grouped by subsystem, alphabetical within groups.
//
// After Pass B migration, the raw string should appear NOWHERE outside
// this file. Grep for the string to verify.

// ── Identity ──
export const K_IDENTITY_UID         = "LUX_USER_ID";         // primary UID
export const K_IDENTITY_UID_LEGACY  = "lux_user_id";         // legacy casing
export const K_IDENTITY_UID_ALIAS   = "lux.uid";             // oldest alias

// ── Auth / Admin ──
export const K_ADMIN_TOKEN          = "lux_admin_token";     // stored in BOTH local + session

// ── Debug flags ──
export const K_DEBUG_MAIN           = "luxdebug";            // global debug mode
export const K_DEBUG_CONVO_MARKS    = "lux.debugMarks";      // convo highlight debug
export const K_DEBUG_STREAM         = "LUX_STREAM_DEBUG";    // streaming debug

// ── Warn system ──
export const K_WARN_MODE            = "LUX_WARN_SWALLOW_MODE";  // on/off/important

// ── Convo ──
export const K_CONVO_KNOBS          = "lux_knobs_v3";        // level/tone/length
export const K_CONVO_PICKER_BAG     = "lux_convo_picker_bag_v1";
export const K_CONVO_PICKER_LAST    = "lux_convo_picker_last_idx_v1";

// ── Harvard / Passages ──
export const K_HARVARD_LAST         = "LUX_HARVARD_LAST";    // last-selected list number
export const K_HARVARD_FAVS         = "LUX_HARVARD_FAVS";    // favorites array
export const K_PASSAGES_LAST        = "LUX_PASSAGES_LAST";   // last-selected passage key
export const K_PASSAGES_FAVS        = "LUX_PASSAGES_FAVS";   // favorites array

// ── Recorder ──
export const K_AUDIO_MODE           = "luxAudioMode";        // normal/pro
export const K_AUDIO_INSPECTOR      = "luxAudioInspector";   // inspector panel flag

// ── Results accordion ──
export const K_ACCORDION_SCORE      = "lux:scoreAccordionOpen";
export const K_ACCORDION_WP         = "lux:wpAccordionOpen";

// ── AI Coach / attempt policy ──
export const K_AICOACH_PREF         = "lux:aicoachDrawerPref";
export const K_AICOACH_EARLY_CLOSE  = "lux:aicoachEarlyCloseCount";       // session
export const K_AICOACH_EARLY_A1     = "lux:aicoachEarlyClosedAttempt1";   // session
export const K_AICOACH_EARLY_A2     = "lux:aicoachEarlyClosedAttempt2";   // session
export const K_PRACTICE_ATTEMPTS    = "lux:practiceAttemptCount";          // session

// ── Self-playback ──
export const K_SELFPB_RATE          = "selfpb_rate_v1";
export const K_SELFPB_HINT_SEEN     = "spb-hint-seen";

// ── Onboarding ──
export const K_ONBOARD_SEEN         = "LUX_ONBOARD_V1_SEEN";

// ── UI state ──
export const K_UI_CLICK_HINTS_SEEN  = "seenClickHints";
export const K_UI_PROSODY_CUE_SEEN  = "seenProsodyLegendCue";
export const K_UI_BANNER_COLLAPSED  = "bannerCollapsed";
export const K_UI_WARP_NEXT         = "luxWarpNext";          // session

// ── Life journey ──
export const K_LIFE_RUN             = "lux.life.run.v1";

// ── Next activity ──
export const K_NEXT_ACTIVITY        = "lux.nextActivity.v1";
export const K_NEXT_PRACTICE_PLAN   = "luxNextPracticePlan";

// ── Wordcloud ──
export const K_WC_STATE             = "lux.cloud.state.v3";
export const K_WC_THEME             = "lux.cloud.theme.v1";
export const K_WC_FAVS              = "lux.cloud.favs.v1";
export const K_WC_PINS              = "lux.cloud.pins.v1";
export const K_WC_DRAWERS           = "lux_wc_drawers_v1";

// ── Streaming setup ──
export const K_STREAM_SETUP         = "lux.stream.setup.v1";

// ── My Words (prefix-based — actual keys are prefix + pageKey) ──
export const K_MY_WORDS_PREFIX      = "lux_my_words_v1:";
export const K_MY_WORDS_OPEN_PREFIX = "lux_my_words_open_v1:";