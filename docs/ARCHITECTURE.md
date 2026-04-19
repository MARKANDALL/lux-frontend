# Lux Frontend — How It Actually Works (2026-04-19)

This is not an ideal-state doc. This is a plain-English description of how the Lux frontend is actually organized, wired, and built today. Paste this into any new AI thread to skip 30 minutes of context-rebuilding.

**Document scope:** scaffolding and architecture only. Work items, fix lists, known-but-unresolved issues, and historical hardening narratives live in `docs/LUX_PROJECT_AUDIT_2026-04-17.md` (the audit) or `docs/LUX_WORKING_QUEUE.md` (when it exists) — not here.

---

## What Lux Is

Lux is a browser-based English pronunciation and conversation training platform. It uses Azure Speech Services for pronunciation assessment and TTS, OpenAI GPT for AI coaching and conversation, OpenAI Realtime API for WebRTC streaming, ElevenLabs for learner-voice cloning (Voice Mirror), and Supabase for auth and persistence. The frontend is Vite 6 + vanilla JS/CSS with zero frameworks — all DOM manipulation is manual. The backend is a separate repo (`luxury-language-api`) deployed as Vercel serverless functions.

---

## Current Project Reality

This repo is currently a **local-only development project**, not a live public product.

Current operating reality:
- **Single developer:** one person owns and works on the codebase
- **Local-only usage:** the project is run locally for development and testing
- **No public deployment:** it is not intentionally exposed to outside users, clients, or employees
- **No active external user base:** the current "user" is the developer during build/test
- **Mid-build posture:** the repo is still in active product construction, cleanup, and architecture hardening

This context matters when reviewing the codebase.

The frontend may contain patterns that would deserve stronger concern in a publicly exposed production system, but in the current phase those should usually be interpreted as **deferred hardening work**, not as evidence that the project is already in a dangerous live state.

That does **not** mean security is ignored. It means security work is being sequenced.

Current priority order is generally:
1. core product construction
2. architecture cleanup and ownership clarity
3. migration completion and maintainability
4. production-grade hardening before any real external exposure

So when auditing or refactoring this repo, use the following lens:

- Prioritize **architecture correctness, ownership clarity, duplication cleanup, state discipline, and maintainability** first
- Flag **security and deployment hardening** clearly, but usually place it in a later hardening bucket unless it creates immediate local risk or bad long-term structure
- Treat **committed secrets, real credentials, or accidental exposure of personal/service access** as urgent even during local-only development

In other words: this is a real codebase with real standards, but it is **not yet a public internet-facing system**, and recommendations should be prioritized accordingly.

---

## Tech Stack

- **Build:** Vite 6 (multi-page app, dev server with API proxy)
- **Language:** Vanilla JS (ES modules), no TypeScript, no React
- **Styling:** Plain CSS, no preprocessor, `lux-` prefixed class convention
- **State:** Custom pub/sub bus (`luxBus`) is the sole source of truth. Legacy window globals survive as frozen compat shims only (e.g. `window.luxTTS = luxBus.get('tts')`)
- **Storage:** `app-core/lux-storage.js` provides `K_` constants and typed helpers for all localStorage/sessionStorage access
- **Auth:** Supabase magic-link OTP, guest UID with migration on login
- **Backend:** `luxury-language-api` on Vercel — Node.js serverless router
- **External APIs:** Azure Speech (assessment + TTS), OpenAI GPT (coaching + convo), OpenAI Realtime (streaming WebRTC), ElevenLabs (learner-voice cloning for Voice Mirror)
- **Testing:** Vitest — protection-ring coverage for lux-bus, identity, apiFetch, lux-storage, attempts contract, shared runtime state, and learner-blob attach lifecycle. Test files are colocated with source (e.g. `app-core/lux-bus.test.js`, `_api/attempts.test.js`) plus a top-level `tests/` directory for cross-cutting tests.
- **Tooling:** ESLint, hygiene scripts, no-silent-catches scanner, absolute-import checker

**Repo scale (2026-04-19):**
- 326 JS files
- 62 CSS files
- 10 HTML pages (7 main + 3 admin)
- ~439 total code/content files

---

## Directory Structure

```text
LUX_GEMINI/
├── src/                        Page entry bootstraps (one per HTML page)
│   ├── main.js                 Practice Skills page
│   ├── convo.js                AI Conversations page
│   ├── progress.js             Progress/Dashboard page
│   ├── wordcloud.js            Wordcloud visualization page
│   ├── stream.js               Real-time Streaming page
│   ├── stream-setup.js         Stream setup page
│   ├── life.js                 Life Journey page
│   ├── supabase.js             Supabase client init
│   └── data/                   Static data (Harvard lists, phoneme meta, passages)
│
├── app-core/                   Shared runtime primitives (THE SPINE)
│   ├── lux-bus.js              Pub/sub bus — source of truth for shared state
│   ├── lux-listeners.js        Guarded listener registry (prevents duplicate listeners)
│   ├── lux-storage.js          K_ constants + typed helpers for localStorage/sessionStorage
│   ├── lux-utils.js            Shared utility primitives
│   ├── runtime.js              Cross-feature "current run" state (lastAttemptId, lastRecording)
│   ├── state.js                Global passage state, debug flags
│   ├── audio-sink.js           Hidden audio element for learner playback
│   └── *.test.js               Colocated protection-ring tests
│
├── _api/                       Frontend API adapters (renamed from api/ to work around
│   │                           Vercel Hobby's 12-function limit)
│   ├── util.js                 apiFetch (canonical request helper), getAdminToken, API_BASE
│   ├── index.js                Public re-exports (the API gatekeeper)
│   ├── ai.js                   GPT coaching feedback
│   ├── assess.js               Azure pronunciation assessment
│   ├── attempts.js             Save/fetch/update attempts
│   ├── alt-meaning.js          Alternative meaning lookup
│   ├── convo.js                Convo turn (has own retry + AbortController)
│   ├── convo-report.js         End-of-session conversation report
│   ├── identity.js             UID management (generate, persist, sync)
│   ├── voice-mirror.js         Voice clone + voice mirror endpoints
│   └── *.test.js               Colocated tests
│
├── core/                       Newer core primitives (prosody, scoring)
│   ├── prosody/index.js        Prosody primitives (dual-home with /prosody/ — see docs/routines)
│   └── scoring/index.js        Shared scoring logic
│
├── prosody/                    Prosody analysis and visualization
│   ├── annotate.js
│   ├── core-calc.js
│   ├── prosody-help-bars.js
│   └── prosody-render-bars.js
│
├── features/                   Feature modules (each owns its own DOM, state, CSS)
│   ├── convo/                  AI Conversations (38 files — the largest feature)
│   ├── recorder/               MediaRecorder, audio inspector, mode switching
│   ├── results/                Score display, syllable analysis, header accordions
│   ├── streaming/              WebRTC real-time conversation (isolated island)
│   ├── features/               TTS player + Self-Playback drawer (nested by history)
│   │   ├── tts/                TTS synthesis, player UI, karaoke word-sync
│   │   └── selfpb/             Self-Playback expanded drawer, waveform, controls
│   ├── interactions/           Phoneme hover tooltips, score tiles, legend
│   ├── my-words/               Word tracking, library modal, panel
│   ├── harvard/                Harvard sentence lists, picker, favorites
│   ├── progress/               Dashboard, wordcloud, rollups, attempt detail
│   ├── life/                   Life Journey game-like feature
│   ├── onboarding/             First-use mic check and guidance
│   ├── dashboard/              Dashboard rendering
│   ├── passages/               Passage selector and management
│   ├── next-activity/          "What should I practice next" engine
│   ├── practice-highlight/     Practice-session phoneme highlighting
│   ├── voice-mirror/           Voice Mirror feature (learner voice cloning)
│   └── balloon/                Celebration balloon animation
│
├── ui/                         Shared UI components and glue
│   ├── components/             Unified card component system
│   │   ├── lux-card.js         Base card
│   │   ├── score-ring.js       Score ring component
│   │   ├── metric-tiles.js     Metric tiles
│   │   └── trouble-chips.js    Trouble chips
│   ├── ui-ai-ai-logic/         AI Coach logic subsystem (attempt-policy, deep-mode,
│   │                           lifecycle, quick-mode)
│   ├── lux-warn.js             warnSwallow system (ON/OFF/IMPORTANT modes)
│   ├── auth-dom.js             Login button, modal, Supabase auth flow
│   ├── ui-ai-ai-dom.js         AI Coach DOM
│   ├── ui-ai-ai-logic.js       AI Coach logic entry
│   ├── ui-click-ripple.js      Canvas click ripple effect
│   ├── ui-ripple-filter.js     Ripple filter
│   ├── ui-arrow-trail.js       Arrow trail effect
│   ├── ui-arrow-trail-fly.js   Arrow trail fly animation
│   ├── warp-core.js            Page transition animation
│   └── warp-nav.js             Warp nav integration
│
├── helpers/                    Small utility functions
│   ├── dom.js                  DOM helpers
│   ├── core.js                 Core utilities
│   ├── assess.js               Assessment helpers
│   ├── body-scroll-lock.js     Ref-counted body scroll lock
│   ├── escape-html.js          Canonical escapeHtml
│   ├── md-to-html.js           Markdown → HTML with escaping
│   └── index.js                Public exports
│
├── _parts/                     CSS partials (convo picker, 10 files)
├── tests/                      Top-level cross-cutting Vitest suites
├── tools/                      Dev tooling (e.g., dev-realtime-proxy.mjs)
├── admin/                      Admin dashboard pages (HTML + inline JS)
├── scripts/                    Build and maintenance tools
├── docs/                       Architecture, audit, routines, bill of rights
├── _agents-archive/            Archived: Simoishi, OpenClaw, Kodama (pre-Routines era)
├── kodama-reports/             Archived Kodama run findings
├── public/                     Static assets (images, character portraits, vendors)
├── *.html                      Multi-page app shells (7 main + 3 admin)
├── *.css                       Global and feature CSS (62 files)
├── vite.config.js              Multi-page Vite config with API proxy
└── package.json                Scripts: dev, build, lint, test, hygiene, etc.
```

---

## Pages and Entry Points

Lux is a multi-page app (not SPA). Each HTML page has its own Vite entry point. Page navigation is a full reload.

| HTML Page | Entry Script | What It Does |
|---|---|---|
| `index.html` | `src/main.js` | Practice Skills — record speech, get Azure scores, AI coaching |
| `convo.html` | `src/convo.js` | AI Conversations — scenario-based chat with GPT |
| `progress.html` | `src/progress.js` | Dashboard — practice history, stats |
| `wordcloud.html` | `src/wordcloud.js` | Wordcloud visualization of practice data |
| `stream.html` | `src/stream.js` | Real-time streaming conversation (WebRTC + OpenAI Realtime) |
| `stream-setup.html` | `src/stream-setup.js` | Stream setup/config page |
| `life.html` | `src/life.js` | Life Journey — gamified practice paths |
| `admin/index.html` | Inline JS | Admin dashboard |
| `admin/overview.html` | Inline JS | Admin overview/analytics |
| `admin/user.html` | Inline JS | Admin per-user view |

Common boot sequence (most pages follow this pattern):

1. `ensureUID()` — generate or recover user identity
2. `initAuthUI()` — render login/logout button
3. Feature-specific mount (e.g., `bootConvo()`, `mountStreamingApp()`)
4. `bootRippleButtons()` — UI polish

---

## The Spine: `app-core/`

These modules are the foundation everything else builds on.

### `lux-bus.js` — The Pub/Sub Bus

The single source of truth for cross-feature shared state. Replaces the old pattern of `window.dispatchEvent(new CustomEvent("lux:..."))`.

```javascript
import { luxBus } from '../app-core/lux-bus.js';

luxBus.set('scenario', { id: 'coffee-shop', idx: 3 });   // write + notify
luxBus.get('scenario');                                   // read
luxBus.on('scenario', (val) => { ... });                 // subscribe (returns unsub fn)
luxBus.update('tts', { autoVoice: true });               // shallow merge
```

### Bus Channels (23 active channels, audited 2026-04-19 against actual usage)

| Channel | Writers | Readers / Subscribers | Purpose |
|---|---|---|---|
| `scenario` | convo-picker-system, picker-deck, render-deck | convo-bootstrap (on) | Currently selected conversation scenario |
| `convoMode` | convo-modes | convo-picker-system (on) | Current convo UI mode (intro/picker/chat) |
| `knobs` | convo-knobs, knobs-drawer | knobs-drawer (on), cefr-hint-badge (on) | Scene settings (level, tone, length) |
| `tts` | convo-tts-context, player-ui (via update) | convo-tts-context, karaoke, player-dom, player-ui (get) | TTS player state and voice config |
| `ttsContext` | convo-bootstrap, convo-tts-context | player-ui (on) | TTS context for character-matched voices |
| `ttsContextApi` | convo-tts-context | player-dom, player-ui (get) | TTS context public API |
| `karaoke` | karaoke (selfpb) | karaoke, player-ui (get) | Active karaoke word-timing data |
| `karaokeRefresh` | karaoke (selfpb) | karaoke (on) | Karaoke re-render trigger |
| `lastAttemptId` | runtime | runtime (get) | Most recent assessment attempt ID |
| `lastRecording` | runtime | runtime, download-latest (get/on) | Most recent learner audio blob + meta |
| `lastAssessment` | recorder/index | selfpb/controls, selfpb/karaoke (get/on) | Most recent Azure assessment result |
| `selfpbApi` | selfpb/ui | convo-turn, recorder/index, player-ui (get) | Self-playback public API (legacy key, still in use) |
| `selfpbApi:core` | selfpb/core | selfpb readers (get) | Canonical self-playback core API |
| `selfpb:mounted` | selfpb/ui | selfpb mount coordinators (get) | Self-playback mount-ready signal |
| `selfpbExpandedOpen` | selfpb/dom | selfpb/karaoke (on) | Whether the expanded self-playback drawer is open |
| `openSelfPBExpanded` | 08-selfpb-peekaboo | selfpb/dom (on) | Request to open expanded self-playback |
| `requestSelfPBExpanded` | tts/player-ui | 08-selfpb-peekaboo (on) | TTS player requesting self-playback expand |
| `myWordsApi` | my-words/index | many readers (get) | My Words public API (canonical owner after bus migration) |
| `convoProgressApi` | convo/progress | convo-turn (get) | Convo progress refresh API |
| `dashboardApi` | dashboard/index | dashboard/index, auth-dom (get) | Dashboard refresh API |
| `pickerSummaryPulse` | characters-drawer | convo-knobs-ui (on) | Pulse animation on picker knobs summary |
| `pickerSummaryHover` | characters-drawer | convo-knobs-ui (on) | Hover state on picker knobs summary |
| `pickerSummaryHoverClear` | characters-drawer | convo-knobs-ui (on) | Clear hover state on picker knobs summary |

### `lux-listeners.js` — Guarded Listener Registry

Prevents duplicate event listeners from stacking across hot reloads or repeated init calls.

```javascript
import { guardedListener } from '../app-core/lux-listeners.js';
guardedListener('convo:escapeKey', document, 'keydown', handler);
// Second call with same key is a no-op
```

### `lux-storage.js` — Centralized Storage Layer

`K_` constants and typed helpers for all localStorage/sessionStorage access. Eliminates raw key strings scattered across the codebase.

```javascript
import { K_ADMIN_TOKEN, K_HARVARD_LAST } from '../app-core/lux-storage.js';
```

Most source files have migrated from bare key strings to `K_` constants. Remaining bare strings are in `identity.js` (the key owner) and `public/lux-popover.js` / admin HTML (classic scripts that cannot use ES module imports). Protection-ring tests cover `lux-storage` contract behavior.

### `runtime.js` — Current Run State

Tracks `lastAttemptId` and `lastRecording` (blob + meta). Writes to the bus and maintains window global mirrors for backward compatibility.

### `state.js` — Passage State

Holds `allPartsResults`, `currentParts`, and global debug flags.

### `audio-sink.js`

Hidden audio element for learner playback.

### `lux-utils.js`

Shared utility primitives used across app-core modules.

---

## API Layer

All API calls go through `apiFetch()` in `_api/util.js` — except `_api/convo.js` which has its own retry/abort logic.

**Note on folder naming:** The frontend adapters live in `_api/` (not `api/`) because Vercel Hobby caps serverless functions at 12, and the `_` prefix ensures Vite doesn't treat the folder as deployable. URL paths on the backend remain `/api/...`.

### `apiFetch(url, opts)`

Canonical request helper. Automatically attaches `x-admin-token`, sets `Content-Type` for JSON, and parses responses.

```javascript
import { apiFetch } from '../_api/util.js';

// JSON (default)
const data = await apiFetch('/api/some-route', { method: 'POST', body: JSON.stringify(payload) });

// Blob (for audio)
const blob = await apiFetch(url, { method: 'POST', body: ..., responseType: 'blob' });

// Raw Response (for custom header reading)
const resp = await apiFetch(url, { ..., responseType: 'response' });

// With token prompt
const data = await apiFetch(url, { promptIfMissing: true, promptLabel: 'Token needed' });
```

Response types: `"json"` (default), `"blob"`, `"text"`, `"response"` (raw).

### Backend Endpoints

| Frontend File | Endpoint | Purpose |
|---|---|---|
| `_api/assess.js` | `/api/assess` | Azure pronunciation assessment (multipart FormData) |
| `_api/ai.js` | `/api/pronunciation-gpt` | GPT coaching feedback |
| `_api/attempts.js` | `/api/attempt`, `/api/user-recent`, `/api/update-attempt` | Save/fetch/update attempts |
| `_api/convo.js` | `/api/convo-turn` | AI conversation turn (retry + abort) |
| `_api/convo-report.js` | `/api/convo-report` | End-of-session report |
| `_api/alt-meaning.js` | `/api/router?route=alt-meaning` | Word meaning lookup |
| `_api/voice-mirror.js` | `/api/router?route=voice-clone`, `/api/router?route=voice-mirror` | ElevenLabs voice clone + Voice Mirror playback |
| `features/features/tts/player-core.js` | `/api/tts`, `/api/tts?voices=1` | TTS synthesis + voice capabilities |

---

## Auth

- **Admin token:** prompted at runtime, stored in `sessionStorage` / `localStorage` under `K_ADMIN_TOKEN` (via lux-storage)
- **User identity:** UUID generated client-side, stored in `localStorage` under `LUX_USER_ID`, managed via `_api/identity.js`
- **Supabase:** magic-link OTP auth, client in `src/supabase.js`

---

## Error Handling: warnSwallow System

All try/catch blocks use `globalThis.warnSwallow(fileLabel, err, level)` instead of silent catches.

```javascript
} catch (err) { globalThis.warnSwallow("features/recorder/index.js", err, "important"); }
```

Modes (set via `LuxWarn.set("on" | "off" | "important")` in DevTools):

- **`"on"`** — show all swallowed errors (242 total catches, counted 2026-04-19)
- **`"important"`** — show only the catches tagged with explicit `"important"` level (154 catches)
- **`"off"`** — silence everything

Default: `"important"` in dev, `"off"` in prod. The `no-silent-catches` script (`npm run no-silent-catches`) scans for any `catch` blocks that don't call `warnSwallow`.

---

## Voice Mirror Feature

Voice Mirror lets a learner record a voice sample, have it cloned via ElevenLabs IVC, then hear any TTS output in their own cloned voice ("hear it in my voice"). This is the crown-jewel differentiator — no other pronunciation tool does learner-voice cloning.

### Files

- `features/voice-mirror/voice-mirror.js` — main Voice Mirror feature module
- `features/voice-mirror/voice-onboarding.js` — first-use onboarding modal for voice capture
- `_api/voice-mirror.js` — frontend adapter for clone and playback endpoints

### Backend integration

- `/api/router?route=voice-clone` — uploads recorded sample, triggers ElevenLabs IVC clone, persists profile
- `/api/router?route=voice-mirror` — generates TTS output in the learner's cloned voice
- Supabase `voice_profiles` table stores per-user clone metadata and ElevenLabs voice IDs

### Related

- The domain `luxurylanguagelearninglab.com` was set up with Zoho business email specifically to apply for Azure Personal Voice access, which is being pursued as a parallel path alongside ElevenLabs.

---

## The Convo Feature (Largest Surface)

AI Conversations is the biggest and most complex feature — 38 files in `features/convo/`. It has a scenario picker with a card deck UI, character role selection drawers, knobs (CEFR level, tone, response length), and a chat interface with pronunciation assessment on each turn.

### Key Convo Files

| File | Role |
|---|---|
| `convo-bootstrap.js` | Main orchestrator — builds layout, wires everything |
| `convo-state.js` | Creates the mutable state object |
| `convo-flow.js` | Wires the turn cycle: picker → recording → assessment → AI response |
| `convo-turn.js` | Single turn logic: assess → persist → get AI reply |
| `convo-handlers.js` | Button click handlers (record, stop, end session) |
| `convo-render.js` | Chat bubble rendering |
| `convo-layout.js` | DOM construction for the entire convo page |
| `convo-picker-system.js` | Scenario picker state and transitions |
| `convo-knobs.js` / `convo-knobs-ui.js` / `convo-knobs-system.js` | Level/tone/length controls |
| `convo-modes.js` / `convo-mode-system.js` | Picker ↔ chat mode switching |
| `characters-drawer.js` / `knobs-drawer.js` | Slide-out drawers for role and settings |
| `picker-deck/` | Card deck UI (7 files — rendering, thumbnails, CEFR badge) |
| `scenarios.js` | 25 conversation scenario definitions |
| `convo-api.js` | UI-friendly wrapper around `_api/convo.js` (never throws) |
| `convo-tts-context.js` | TTS context setup for convo page |
| `convo-persistence.js` | Save convo attempts |
| `convo-shared.js` | Shared helpers (uid, el, showConvoReportOverlay) |
| `convo-highlight.js` | Word highlighting in chat bubbles |
| `convo-coach.js` / `convo-ai-coach-shell.js` | In-convo AI coaching |
| `convo-report-ui.js` | End-of-session report UI |
| `convo-recording.js` | Recording flow for convo turns |
| `scene-atmo.js` | Scene atmosphere visuals |
| `phoneme-spelling-map.js` | Phoneme → spelling mapping for convo |

### Convo Data Flow

1. User clicks Record → `convo-handlers.js`
2. → `startRecording` (`convo-recording.js`)
3. → `stopRecordingAndGetBlob`
4. → `sendTurn` (`convo-turn.js`)
5. → `assessPronunciation` (`_api/assess.js` → Azure)
6. → `persistConvoAttempt` (`convo-persistence.js` → `_api/attempts.js`)
7. → `convoTurn` (`convo-api.js` → `_api/convo.js` → GPT)
8. → `renderMessages` + `renderSuggestions`

---

## Streaming Feature (Reference Architecture)

The Streaming feature (`features/streaming/`) is the cleanest feature island in the codebase. It's a good model for how future features should be structured: isolated mount, dedicated state store, transport controller, and render loop. Uses OpenAI Realtime API over WebRTC.

---

## Window Globals (Backward-Compat Mirrors)

These are NOT the source of truth — `luxBus` is. Reader code should use `luxBus.get()`, not the window global.

| Global | Status | Real Owner |
|---|---|---|
| `window.luxTTS` | Frozen shim — `luxBus.get('tts')` is sole owner. All readers migrated to bus. One `window.luxTTS = luxBus.get('tts')` compat shim remains at end of `mountTTSPlayer`. | `luxBus 'tts'` key |
| `window.LuxLastRecordingBlob` | Active mirror | `runtime.js` via `setLastRecording()` |
| `window.LuxMyWords` | Frozen shim — `luxBus.get('myWordsApi')` is sole owner. All readers migrated to bus. Tag: `v-LuxMyWords-bus-migrated` | `luxBus 'myWordsApi'` key |
| `window.LuxSelfPB` | Frozen shim — `luxBus.get('selfpbApi:core')` is sole owner. All readers migrated to bus. `_REF`/`_LastUrl` internalized. Tag: `v-LuxSelfPB-bus-migrated` | `luxBus 'selfpbApi:core'` key |
| `window.LUX_USER_ID` | Active mirror | `identity.js` via `ensureUID()` / `setUID()` |
| `window.LuxKaraokeSource` / `window.LuxKaraokeTimings` / `window.LuxTTSWordTimings` | Written only via `publishKaraoke()` canonical helper | `tts/player-ui/karaoke.js:publishKaraoke()` |
| `window.LuxLastAzureResult` / `window.LuxLastWordTimings` | Active mirrors | `features/recorder/index.js` |
| `window.luxSP` | REMOVED (dead — zero readers; deleted `v-luxSP-removed`) | — |

---

## State Ownership Ladder

This repo currently contains four legitimate state tiers. Future work must choose one intentionally.

### Tier A — Cross-feature shared runtime state

Use this when multiple features need the same live value, or when a value must survive handoff between modules.

**Canonical tools:**
- `app-core/runtime.js`
- `app-core/lux-bus.js`

**Examples:**
- `lastRecording`
- `lastAttemptId`
- `tts`

**Rule:** If multiple feature families need the value, do not keep it as ad hoc local state. Canonical writes must go through exported runtime helpers and/or `luxBus.update()` / `luxBus.set()`.

### Tier B — Feature-island state

Use this when state belongs entirely to one feature root and does not need cross-feature ownership.

**Examples:**
- AI Conversations page state
- drawer open/close state
- local UI mode toggles inside a single feature family

**Rule:** Keep it local unless another feature truly needs it. Do not publish to `window.*` just for convenience.

### Tier C — Dedicated store islands

Use this only for a true sub-app with its own internal lifecycle, render loop, or controller/store architecture.

**Good examples:**
- Streaming (`features/streaming/state/store.js`)
- Wordcloud (`features/progress/wordcloud/state-store.js`)

**Rule:** A dedicated store is allowed for real islands. Do not create a new store for simple shared values that belong in runtime/bus ownership.

### Tier D — Compat globals

These exist for migration safety, legacy bridges, or isolated legacy islands. They are **not** canonical owners.

**Rule:** One writer only. No new direct readers if a canonical helper already exists. Compat mirrors may remain temporarily, but they do not change canonical ownership.

### PR Review Questions For State Changes

1. Is this value shared across feature families?
2. If yes, why is it not in runtime/bus ownership?
3. If it is feature-local, what proves it is truly a feature island?
4. If it is a store, what makes it a true sub-app rather than just local state with a fancy wrapper?
5. If it touches `window.*`, where is the single canonical writer?

---

## localStorage Keys

All keys are accessed via `K_` constants from `app-core/lux-storage.js` (with exceptions noted below).

| Key | Purpose | Owner |
|---|---|---|
| `LUX_USER_ID` / `lux_user_id` | User identity UUID | `_api/identity.js` |
| `lux_admin_token` (via `K_ADMIN_TOKEN`) | Admin API token | `_api/util.js` |
| `luxAudioMode` | Recording mode (normal/pro) | `recorder/audio-mode-core.js` |
| `LUX_HARVARD_LAST` | Last Harvard list index | `features/harvard/` |
| `LUX_HARVARD_FAVS` | Harvard favorites | `features/harvard/` |
| `LUX_PASSAGES_LAST` / `LUX_PASSAGES_FAVS` | Passage selection state | `features/passages/` |
| `bannerCollapsed` | UI preference | various |
| `spb-hint-seen` | Self-playback hint shown | `selfpb/` |
| `seenClickHints` / `seenProsodyLegendCue` | Onboarding hints | `interactions/` |
| `LUX_STREAM_DEBUG` | Streaming debug mode | `streaming/` |
| `LUX_WARN_SWALLOW_MODE` | warnSwallow verbosity | `ui/lux-warn.js` |

**Exception files** (cannot use ES module imports, use bare keys): `public/lux-popover.js`, admin HTML inline scripts.

---

## Build and Dev

```bash
npm run dev                    # Vite dev server on port 3000 with API proxy
npm run build                  # Production build
npm run preview                # Preview production build
npm run lint                   # ESLint
npm run lint:fix               # ESLint autofix
npm run test                   # Vitest run (single pass)
npm run test:watch             # Vitest watch mode
npm run hygiene                # Hygiene report + no-silent-catches scan
npm run no-silent-catches      # Standalone silent-catch scanner
npm run check:imports          # Absolute-import checker
npm run thumbs                 # Build character portrait thumbnails
npm run build:harvard:phonemes # Rebuild Harvard phoneme index
npm run build:passages:phonemes# Rebuild passage phoneme index
npm run lux:snapshot           # PowerShell: snapshot current state
npm run lux:release            # PowerShell: release workflow
```

**Dev proxy:** `/api/*` requests are proxied to the backend (configurable via `LUX_API_ORIGIN` or `VITE_LUX_API_ORIGIN` env vars, defaults to `https://luxury-language-api.vercel.app`). The proxy also attaches the admin token header in dev if set, and logs proxy errors with readable 502 responses.

**Vite multi-page inputs:** All 10 HTML pages (7 main + 3 admin) are registered as rollup inputs in `vite.config.js`.

---

## Git Tags (Stabilization Campaign)

| Tag | Description |
|---|---|
| `v2.1-scenario-bus` | `scenarioChanged` migrated to bus |
| `v2.2-bus-migration-complete` | All `lux:` events on bus |
| `v3.0-apifetch-begin` | Phase 3 started |
| `v3.1-apifetch-core-complete` | 5 core API helpers on apiFetch |
| `v3.2-sidecar-cleanup` | Orphan dispatch removed, warnSwallow labels fixed |
| `v3.3-apifetch-full` | apiFetch responseType upgrade, TTS + auth migrated |
| `v4.0-warnswallow-normalize` | 170 warnSwallow path labels normalized |
| `v4.1-warnswallow-critical-tagged` | 91 critical catches tagged "important" |
| `v4.2-warnswallow-medium-tagged` | 69 medium catches tagged "important" |
| `v-luxTTS-bus-only` | All `window.luxTTS` mirror writes eliminated |
| `v-LuxSelfPB-bus-migrated` | `window.LuxSelfPB` frozen to `luxBus.get('selfpbApi:core')` shim |
| `v-LuxMyWords-bus-migrated` | `window.LuxMyWords` frozen to `luxBus.get('myWordsApi')` shim |
| `v-luxSP-removed` | Dead `window.luxSP` deleted |

Recent non-stabilization tags (for reference):
- `deep-review-fixes-2026-04-17` / `deep-review-fixes-2026-04-18` — XSS fix on `summary.js`, warnSwallow guards, README link repair

---

## Architecture Rules (Enforced)

1. **Bus is truth, globals are mirrors.** `luxBus.set()` is the canonical write. Window globals may survive temporarily but are never the primary source.

2. **`apiFetch` is the front door.** All new API calls go through `apiFetch()`. The only exception is `_api/convo.js` (has its own retry/abort).

3. **`guardedListener` for document/window events.** Prevents duplicate listener stacking.

4. **`warnSwallow`, never silent catch.** Every catch block uses `globalThis.warnSwallow(fileLabel, err)` with appropriate level. Enforced by `npm run no-silent-catches`.

5. **`K_` constants for storage.** All localStorage/sessionStorage access through `app-core/lux-storage.js` helpers. Exception files (classic scripts) noted in the localStorage keys section above.

6. **Surgical changes only.** Follow Lux Refactor Constitution v2 — `.GOLD` backups, Risk Gate, sequential peels, rollback path always documented.

7. **No framework migration.** Vanilla JS is the architecture. No React, no grand rewrite.

8. **Run `npm test` after touching plumbing.** Protection ring tests cover lux-bus, identity, apiFetch, lux-storage, attempts contract, and runtime. Run after any session that modifies these shared modules.

9. **Escape all dynamic HTML.** Use `escapeHtml` from `helpers/escape-html.js` (or equivalents) on any user-originated or API-originated content before interpolating into `innerHTML`.

---

## Claude Code Routines System

The frontend repo has **Claude Code Routines** configured against it — scheduled agentic tasks that run nightly/weekly/monthly and produce output as GitHub issues or draft PRs. Mentioned here as scaffolding because several routines directly interact with this repo's structure (health scans, architecture audits, hygiene sweeps). Full details live in:

- `docs/routines/CLAUDE_ROUTINES_BACKLOG.md` — generic routine ideas
- `docs/routines/CLAUDE_ROUTINES_PLAYBOOK.md` — strategy, cost math, traps
- `docs/routines/LUX_ROUTINES_FROM_CATALOG.md` — Lux-catalog-derived routines

Archived predecessors (Simoishi/OpenClaw autonomous agent systems, Kodama supervisor) are preserved in `_agents-archive/` and `kodama-reports/`.

---

## Related Documentation

- **`docs/LUX_PROJECT_AUDIT_2026-04-17.md`** — full page-by-page product audit + code-level findings
- **`docs/system-health-bill-of-rights.frontend.md`** — the 20 rules, ownership charter, allowed/banned patterns, refactor size budgets
- **`docs/LUX_MASTER_IDEA_CATALOG.md`** — vision, phases, feature roadmap
- **`docs/LUX_COMPETITVE_LANDSCAPE.md`** — competitor matrix and differentiation tracking
- **`docs/routines/`** — three-file Claude Code Routines system (backlog, playbook, Lux-specific)
