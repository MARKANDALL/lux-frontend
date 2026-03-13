# Lux Frontend — How It Actually Works (March 2026)

This is not an ideal-state doc. This is a plain-English description of how the Lux frontend is actually organized, wired, and built today. Paste this into any new AI thread to skip 30 minutes of context-rebuilding.

---

## What Lux Is

Lux is a browser-based English pronunciation and conversation training platform. It uses Azure Speech Services for pronunciation assessment and TTS, OpenAI GPT for AI coaching and conversation, and Supabase for auth. The frontend is Vite + vanilla JS/CSS with zero frameworks — all DOM manipulation is manual. The backend is a separate repo (`luxury-language-api`) deployed as Vercel serverless functions.

## Tech Stack

- **Build:** Vite (multi-page app, dev server with API proxy)
- **Language:** Vanilla JS (ES modules), no TypeScript, no React
- **Styling:** Plain CSS, no preprocessor, `lux-` prefixed class convention
- **State:** Custom pub/sub bus (`luxBus`) is the sole source of truth. Legacy window globals survive as frozen compat shims only (e.g. `window.luxTTS = luxBus.get('tts')`)
- **Auth:** Supabase magic-link OTP, guest UID with migration on login
- **Backend:** `luxury-language-api` on Vercel — Node.js serverless router
- **External APIs:** Azure Speech (assessment + TTS), OpenAI GPT (coaching + convo), OpenAI Realtime (streaming)
- **Testing:** Vitest — protection-ring coverage now includes lux-bus, identity, apiFetch, lux-storage, attempts contract, shared runtime state, and learner-blob attach lifecycle
- **Tooling:** ESLint, hygiene scripts, no-silent-catches scanner, import checker

---

## Current Hardening Status (March 2026)

The frontend is in structured hardening mode, not rescue mode and not broad feature-refactor mode.

Completed and verified in the current stabilization wave:
- storage normalization pass
- safe residue / dead-code cleanup
- scene-atmo interval lifecycle cleanup
- metric-modal safe cleanup
- TTS / karaoke / SelfPB bridge cleanup
- refresh-hook migration to bus-first patterns
- small protection-ring expansion around shared runtime and learner-blob plumbing

Important verification outcome:
- the remaining meaningful `window.*` migration family was re-checked and verified as already done in:
  - `features/features/selfpb/ui.js`
  - `features/recorder/index.js`
  - `features/convo/convo-turn.js`
  - `features/features/tts/player-ui.js`

Parked side issues remain parked unless they clearly reproduce or block core flow:
- convo SelfPB learner karaoke words in AI Conversations
- End Session / overlay contract issue
- picker drawer carry-over bug appears improved / likely resolved, but is not an active hardening target

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
│   └── data/                   Static data (Harvard lists, phoneme meta)
│
├── app-core/                   Shared runtime primitives (THE SPINE)
│   ├── lux-bus.js              Pub/sub bus — source of truth for shared state
│   ├── lux-listeners.js        Guarded listener registry (prevents duplicate listeners)
│   ├── runtime.js              Cross-feature "current run" state (lastAttemptId, lastRecording)
│   ├── state.js                Global passage state, debug flags
│   └── audio-sink.js           Hidden audio element for learner playback
│
├── api/                        Frontend API adapters
│   ├── util.js                 apiFetch (canonical request helper), getAdminToken, API_BASE
│   ├── index.js                Public re-exports (the API gatekeeper)
│   ├── ai.js                   GPT coaching feedback
│   ├── assess.js               Azure pronunciation assessment
│   ├── attempts.js             Save/fetch/update practice attempts
│   ├── alt-meaning.js          Alternative meaning lookup
│   ├── convo.js                Convo turn (has own retry + AbortController)
│   ├── convo-report.js         End-of-session conversation report
│   └── identity.js             UID management (generate, persist, sync)
│
├── features/                   Feature modules (each owns its own DOM, state, CSS)
│   ├── convo/                  AI Conversations (36 files — the largest feature)
│   ├── recorder/               MediaRecorder, audio inspector, mode switching
│   ├── results/                Score display, syllable analysis, header accordions
│   ├── streaming/              WebRTC real-time conversation (isolated island)
│   ├── features/               TTS player + Self-Playback drawer
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
│   └── balloon/                Celebration balloon animation
│
├── ui/                         Shared UI components and glue
│   ├── lux-warn.js             warnSwallow system (ON/OFF/IMPORTANT modes)
│   ├── auth-dom.js             Login button, modal, Supabase auth flow
│   ├── ui-ai-ai-logic.js       AI Coach logic
│   ├── ui-ai-ai-dom.js         AI Coach DOM
│   ├── ui-click-ripple.js      Canvas click ripple effect
│   ├── warp-core.js            Page transition animation
│   └── ...
│
├── helpers/                    Small utility functions
│   ├── dom.js                  escapeHtml, DOM helpers
│   ├── core.js                 Core utilities
│   └── ...
│
├── prosody/                    Prosody analysis and visualization
├── admin/                      Admin dashboard pages (HTML + inline JS)
├── scripts/                    Build and maintenance tools
├── docs/                       Audit docs, system health bill of rights
├── *.html                      Multi-page app shells (10 pages)
├── *.css                       Global and feature CSS (61 files, ~12K lines)
├── vite.config.js              Multi-page Vite config with API proxy
└── package.json                Scripts: dev, build, lint, test, hygiene
Pages and Entry Points

Lux is a multi-page app (not SPA). Each HTML page has its own Vite entry point. Page navigation is a full reload.

HTML Page	Entry Script	What It Does
index.html	src/main.js	Practice Skills — record speech, get Azure scores, AI coaching
convo.html	src/convo.js	AI Conversations — scenario-based chat with GPT
progress.html	src/progress.js	Dashboard — practice history, stats
wordcloud.html	src/wordcloud.js	Wordcloud visualization of practice data
stream.html	src/stream.js	Real-time streaming conversation (WebRTC + OpenAI Realtime)
stream-setup.html	src/stream-setup.js	Stream setup/config page
life.html	src/life.js	Life Journey — gamified practice paths
admin/index.html	Inline JS	Admin dashboard
admin/overview.html	Inline JS	Admin overview/analytics
admin/user.html	Inline JS	Admin per-user view

Common boot sequence (most pages follow this pattern):

ensureUID() — generate or recover user identity

initAuthUI() — render login/logout button

Feature-specific mount (e.g., bootConvo(), mountStreamingApp())

bootRippleButtons() — UI polish

The Spine: app-core/

These modules are the foundation everything else builds on.

lux-bus.js — The Pub/Sub Bus

The single source of truth for cross-feature shared state. Replaces the old pattern of window.dispatchEvent(new CustomEvent("lux:...")).

import { luxBus } from '../app-core/lux-bus.js';

luxBus.set('scenario', { id: 'coffee-shop', idx: 3 });  // write + notify
luxBus.get('scenario');                                    // read
luxBus.on('scenario', (val) => { ... });                   // subscribe (returns unsub fn)
luxBus.update('tts', { autoVoice: true });                 // shallow merge

Bus channels currently in use: scenario, ttsContext, lastRecording, lastAssessment, knobs, karaoke, karaokeRefresh, selfpbExpandedOpen, requestSelfPBExpanded, openSelfPBExpanded, pickerSummaryPulse, pickerSummaryHover, pickerSummaryHoverClear, convoMode.

lux-listeners.js — Guarded Listener Registry

Prevents duplicate event listeners from stacking across hot reloads or repeated init calls.

import { guardedListener } from '../app-core/lux-listeners.js';
guardedListener('convo:escapeKey', document, 'keydown', handler);
// Second call with same key is a no-op
runtime.js — Current Run State

Tracks lastAttemptId and lastRecording (blob + meta). Writes to the bus and maintains window global mirrors for backward compatibility.

state.js — Passage State

Holds allPartsResults, currentParts, and global debug flags.

API Layer

All API calls go through apiFetch() in api/util.js — except api/convo.js which has its own retry/abort logic.

apiFetch(url, opts)

Canonical request helper. Automatically attaches x-admin-token, sets Content-Type for JSON, and parses responses.

import { apiFetch } from '../api/util.js';

// JSON (default)
const data = await apiFetch('/api/some-route', { method: 'POST', body: JSON.stringify(payload) });

// Blob (for audio)
const blob = await apiFetch(url, { method: 'POST', body: ..., responseType: 'blob' });

// Raw Response (for custom header reading)
const resp = await apiFetch(url, { ..., responseType: 'response' });

// With token prompt
const data = await apiFetch(url, { promptIfMissing: true, promptLabel: 'Token needed' });

Response types: "json" (default), "blob", "text", "response" (raw).

Backend Endpoints
Frontend File	Endpoint	Purpose
api/assess.js	/api/assess	Azure pronunciation assessment (multipart FormData)
api/ai.js	/api/pronunciation-gpt	GPT coaching feedback
api/attempts.js	/api/attempt, /api/user-recent	Save/fetch/update attempts
api/convo.js	/api/convo-turn	AI conversation turn (retry + abort)
api/convo-report.js	/api/convo-report	End-of-session report
api/alt-meaning.js	/api/router?route=alt-meaning	Word meaning lookup
features/features/tts/player-core.js	/api/tts, /api/tts?voices=1	TTS synthesis + voice capabilities
ui/auth-dom.js	/api/migrate	Guest → user history migration
Auth

Admin token: prompted at runtime, stored in sessionStorage/localStorage under lux_admin_token

User identity: UUID generated client-side, stored in localStorage under LUX_USER_ID

Supabase: magic-link OTP auth, client in src/supabase.js

Error Handling: warnSwallow System

All try/catch blocks use globalThis.warnSwallow(fileLabel, err, level) instead of silent catches.

} catch (err) { globalThis.warnSwallow("features/recorder/index.js", err, "important"); }

Modes (set via LuxWarn.set("on" | "off" | "important") in DevTools):

"on" — show all 235 swallowed errors

"important" — show only the 166 critical/medium catches (persistence, API, recording, state)

"off" — silence everything

Default: "important" in dev, "off" in prod.

The Convo Feature (Largest Surface)

AI Conversations is the biggest and most complex feature — 36 files in features/convo/. It has a scenario picker with a card deck UI, character role selection drawers, knobs (CEFR level, tone, response length), and a chat interface with pronunciation assessment on each turn.

Key Convo Files
File	Role
convo-bootstrap.js	Main orchestrator — builds layout, wires everything
convo-state.js	Creates the mutable state object
convo-flow.js	Wires the turn cycle: picker → recording → assessment → AI response
convo-turn.js	Single turn logic: assess → persist → get AI reply
convo-handlers.js	Button click handlers (record, stop, end session)
convo-render.js	Chat bubble rendering
convo-layout.js	DOM construction for the entire convo page
convo-picker-system.js	Scenario picker state and transitions
convo-knobs.js / convo-knobs-ui.js / convo-knobs-system.js	Level/tone/length controls
convo-modes.js / convo-mode-system.js	Picker ↔ chat mode switching
characters-drawer.js / knobs-drawer.js	Slide-out drawers for role and settings
picker-deck/	Card deck UI (7 files — rendering, thumbnails, CEFR badge)
scenarios.js	25 conversation scenario definitions
convo-api.js	UI-friendly wrapper around api/convo.js (never throws)
convo-tts-context.js	TTS context setup for convo page
convo-persistence.js	Save convo attempts
convo-shared.js	Shared helpers (uid, el, showConvoReportOverlay)
Convo Data Flow
User clicks Record → convo-handlers.js
  → startRecording (convo-recording.js)
  → stopRecordingAndGetBlob
  → sendTurn (convo-turn.js)
    → assessPronunciation (api/assess.js → Azure)
    → persistConvoAttempt (convo-persistence.js → api/attempts.js)
    → convoTurn (convo-api.js → api/convo.js → GPT)
    → renderMessages + renderSuggestions
Window Globals Still Present (as backward-compat mirrors)

These are NOT the source of truth — luxBus is. Reader code should use luxBus.get(), not the window global.

Global	Status	Real Owner
window.luxTTS	Frozen shim — luxBus.get('tts') is sole owner. All readers migrated to bus. One window.luxTTS = luxBus.get('tts') compat shim remains at end of mountTTSPlayer.	luxBus 'tts' key
window.LuxLastRecordingBlob	Active mirror	runtime.js via setLastRecording()
window.LuxMyWords	Active — self-contained island	my-words/index.js
window.LuxSelfPB	Active — selfpb family only	selfpb/core.js + selfpb/ui.js
window.LUX_USER_ID	Active mirror	identity.js via ensureUID() / setUID()
Streaming Feature (Reference Architecture)

The Streaming feature (features/streaming/) is the cleanest feature island in the codebase. It's a good model for how future features should be structured: isolated mount, dedicated state store, transport controller, and render loop.

Build and Dev
npm run dev          # Vite dev server on port 3000 with API proxy
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest
npm run hygiene      # Hygiene report + no-silent-catches scan

Dev proxy: /api/* requests are proxied to the backend (configurable via LUX_API_ORIGIN or VITE_LUX_API_ORIGIN env vars, defaults to https://luxury-language-api.vercel.app).

localStorage Keys
Key	Purpose	Owner
LUX_USER_ID / lux_user_id	User identity UUID	api/identity.js
lux_admin_token	Admin API token	api/util.js
luxAudioMode	Recording mode (normal/pro)	recorder/audio-mode-core.js
LUX_HARVARD_LAST	Last Harvard list index	features/harvard/
LUX_HARVARD_FAVS	Harvard favorites	features/harvard/
LUX_PASSAGES_LAST / LUX_PASSAGES_FAVS	Passage selection state	features/passages/
bannerCollapsed	UI preference	various
spb-hint-seen	Self-playback hint shown	selfpb/
seenClickHints / seenProsodyLegendCue	Onboarding hints	interactions/
LUX_STREAM_DEBUG	Streaming debug mode	streaming/
LUX_WARN_SWALLOW_MODE	warnSwallow verbosity	ui/lux-warn.js
Git Tags (Stabilization Campaign)
Tag	Description
v2.1-scenario-bus	scenarioChanged migrated to bus
v2.2-bus-migration-complete	All lux: events on bus
v3.0-apifetch-begin	Phase 3 started
v3.1-apifetch-core-complete	5 core API helpers on apiFetch
v3.2-sidecar-cleanup	Orphan dispatch removed, warnSwallow labels fixed
v3.3-apifetch-full	apiFetch responseType upgrade, TTS + auth migrated
v4.0-warnswallow-normalize	170 warnSwallow path labels normalized
v4.1-warnswallow-critical-tagged	91 critical catches tagged "important"
v4.2-warnswallow-medium-tagged	69 medium catches tagged "important"
Architecture Rules (Enforced)

Bus is truth, globals are mirrors. luxBus.set() is the canonical write. Window globals may survive temporarily but are never the primary source.

apiFetch is the front door. All new API calls go through apiFetch(). The only exception is api/convo.js (has its own retry/abort).

guardedListener for document/window events. Prevents duplicate listener stacking.

warnSwallow, never silent catch. Every catch block uses globalThis.warnSwallow(fileLabel, err) with appropriate level.

Surgical changes only. Follow Lux Refactor Constitution v2 — .GOLD backups, Risk Gate, sequential peels, rollback path always documented.

No framework migration. Vanilla JS is the architecture. No React, no grand rewrite.

Run npm test after touching plumbing. Protection ring tests cover lux-bus, identity, apiFetch, lux-storage, and attempts contract. Run after any session that modifies these shared modules.

Known Issues

End Session in AI Conversations doesn't show the report overlay (pre-existing, not from stabilization)

Character encoding garbled symbols in some results displays

Expanded tooltip video/audio desync

4 duplicate escHtml functions — should consolidate to helpers/dom.js

94 scattered localStorage accesses — no centralized storage layer yet RESOLVED: app-core/lux-storage.js provides K_ constants + typed helpers. 11 files migrated from bare key strings to constants (Phase D). Remaining bare strings are in identity.js (key owner) and public/lux-popover.js / admin HTML (classic scripts, cannot import).