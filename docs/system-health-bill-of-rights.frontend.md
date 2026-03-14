# System Health Bill of Rights — Frontend

**Repo:** `lux-frontend`
**Date:** 2026-03-01
**Baseline:** Feb 26, 2026 audit (`AUDIT-DUPLICATE-AND-FIGHTING-CODE.md`)
**Author:** Automated staff-engineer audit + verification pass

---

## Part A — The Bill of Rights (20 Rules)

## Current Enforcement Reality (March 2026)

These rules are not purely aspirational anymore.

Current repo direction:
- `luxBus` is the canonical shared-frontend coordination layer
- shared runtime helpers own cross-feature current-run state
- window globals may still exist as compatibility mirrors or classic-script bridges, but they are not the preferred write path
- new hardening work should migrate callers toward bus-first / helper-first ownership without breaking compatibility prematurely

Interpret every rule below through that lens:
canonical writer first, compat mirror second, broad purge never.

### Right 1: One Writer Per Global
**Every shared-state entrypoint has exactly ONE canonical writer module or helper contract.**

- Canonical ownership should prefer exported helpers and bus APIs over raw global mutation.
- Direct `window.X = ...` assignments outside the canonical writer are banned for module code.
- Readers may access compat globals when needed, but must never become independent writers.
- If a second module needs to set the value, it must call the canonical writer export or publish through the approved bus/helper contract.
- Compat mirrors may remain temporarily for migration safety, but they do not change canonical ownership.
- Enforcement: `grep -rn 'window\.LuxFoo\s*=' --include='*.js'` should point to one intentional writer path, or to one canonical helper/bus bridge.
- Violations found at audit time are tracked in the Single Source of Truth Charter (Part A.2).

### Right 2: State Must Have One Clear Owner

**Every piece of frontend state must declare its ownership tier up front.**
If a value crosses feature boundaries, survives orchestration handoffs, or needs compat mirrors, it must not live as ad hoc local state.

#### Allowed ownership tiers

1. **Cross-feature shared runtime state**
   - Use `app-core/runtime.js` + `luxBus` when multiple features need the same live value.
   - Examples: last recording, last attempt ID, TTS shared state.
   - Window mirrors may exist only as compatibility surfaces owned by the canonical helper.

2. **Feature-island state**
   - Use feature-local state for values that belong entirely to one feature root and do not need to be shared across unrelated features.
   - Example: convo page orchestration state.

3. **Dedicated feature store**
   - Use a dedicated store file only for a true sub-application with its own lifecycle, render loop, or internal event system.
   - Good examples: Streaming store, Wordcloud state store.
   - Do not create a new store just to avoid deciding ownership.

4. **Compat globals**
   - Allowed only as temporary mirrors or self-contained legacy islands.
   - They do not own the value.
   - New readers should prefer canonical helpers / `luxBus.get()` instead of raw `window.*`.

#### Decision rule

Before adding new state, ask in this order:

1. **Will another feature read or write this?**
   - Yes → canonicalize through `runtime.js` and/or `luxBus`.

2. **Is this only meaningful inside one feature root?**
   - Yes → keep it in feature-local state.

3. **Is this a true island with multiple internal surfaces and its own long-lived controller/store model?**
   - Yes → dedicated feature store is allowed.

4. **Is this only for migration safety or legacy integration?**
   - Yes → compat mirror only, with exactly one writer.

#### Banned patterns

- Writing the same conceptual value from both local feature code and `window.*`
- Creating a second writer for an existing compat global
- Reading raw `window.*` when a canonical bus/helper path already exists
- Inventing a new mini-store for state that should live in existing runtime/bus ownership
- Using compat globals as the source of truth for new feature work

#### Enforcement

- New PRs must state the ownership tier for any new stateful value.
- `rg -n "window\.[A-Za-z0-9_]+\s*=" --type js` should identify one intentional writer path per compat global.
- If a value needs both bus and window presence, the window write must happen inside the canonical helper or bridge module — never from unrelated feature code.

### Right 3: No innerHTML With Dynamic Content
**`innerHTML`, `insertAdjacentHTML`, and `outerHTML` must never interpolate user-controlled or externally-sourced strings without escaping.**

- Static HTML templates (no interpolation) are SAFE but should be documented.
- Any dynamic interpolation MUST use `esc()` / `escapeHtml()` BEFORE insertion.
- Prefer `textContent` + `createElement` for simple dynamic content.
- If HTML structure is truly needed, use the project's `esc()` (from `progress-utils.js`, `panel-utils.js`, `metric-modal/meta.js`, or `convo-highlight.js:escHtml()`).
- `document.write()`, `eval()`, and `new Function()` are unconditionally banned in application code.

### Right 4: No Fighting Modals
**Body scroll lock uses the reference-counted `helpers/body-scroll-lock.js` — never raw `document.body.style.overflow`.**

- `lockBodyScroll()` increments a counter and sets `overflow: hidden`.
- `unlockBodyScroll()` decrements the counter; only clears overflow when count reaches 0.
- Any new modal MUST import and use these functions — no direct overflow manipulation.
- Existing compliance: metric-modal and attempt-detail-modal both use the shared helper.

### Right 5: Capture-Phase Handlers Must Not Swallow Unrelated Events
**Any `addEventListener(..., { capture: true })` handler must guard before calling `stopPropagation()`.**

- The guard check (`if (!matchedElement) return`) MUST run before `stopPropagation()`.
- Capture handlers must document which events they intend to intercept (comment at top of handler).
- Document-level capture handlers must be registered at most ONCE (use an `installed` flag).
- Current capture handlers in the codebase:
  - `chip-events.js:43` — guards with `if (!chip) return` before `stopPropagation` (COMPLIANT).
  - `metric-modal/events.js:192` — does NOT call `stopPropagation` (COMPLIANT).
  - `my-words/panel-events.js:122` — does NOT call `stopPropagation` (COMPLIANT).
  - `results/header.js:79` — scoped to ring element, not document (COMPLIANT).

### Right 6: Intervals Must Be Clearable
**Every `setInterval()` call must store its timer ID and have a corresponding `clearInterval()` path.**

- Unbounded intervals (no clear path) are banned.
- Intervals that poll JS state instead of DOM state should use events or a pub/sub pattern instead.
- Known violation: `convo-bootstrap.js:176` — 300ms poll of `state.scenarioIdx` with no `clearInterval`.
- Proper examples: `wordcloud/timeline.js`, `streaming/mic-meter.js`, `streaming/app.js`.

### Right 7: One Init Per Feature
**Every feature module must have an idempotent init function with a guard flag.**

- Pattern: `let installed = false; export function init() { if (installed) return; installed = true; ... }`
- Hot-reload safety: use `root.dataset.luxBooted = "1"` for DOM-mounted features.
- MutationObserver and event listener registration must be guarded against double-attach.
- Good examples: `metric-modal/events.js`, `convo-bootstrap.js`, `recorder/index.js`.

### Right 8: Z-Index Budget
**Z-index values follow a tiered budget. No ad-hoc values.**

| Tier | Range | Usage |
|------|-------|-------|
| Background | 0–10 | Atmo layers, decorative |
| Content | 11–100 | Sticky headers, in-flow overlays |
| Nav/CTA | 101–500 | Navigation, floating buttons |
| Drawers | 501–999 | Side drawers, knobs, characters |
| Auth/TTS | 900–999 | Auth button, TTS peekaboo |
| Modals | 9999–10050 | Metric modal, detail modal, tooltips, popovers |
| Self-Playback | 12000–12001 | SelfPB peekaboo panel |
| Fullscreen overlays | 99998–99999 | Convo report, debug overlays |
| Self-Playback expanded | 200000 | SelfPB expanded float |
| Dev tools | 999999 | Audio inspector (dev only) |

- New z-index values MUST fit into an existing tier or be discussed before merging.
- The SelfPB expanded float (200000) intentionally sits above modals to allow playback controls during modal interaction.

### Right 9: Escape All Dynamic HTML
**Every function that produces HTML from dynamic data must use an `esc()` function.**

- Canonical escape functions exist in: `progress-utils.js`, `panel-utils.js`, `metric-modal/meta.js`, `ui-ai-ai-dom.js`, `convo-highlight.js`.
- These all implement the same 5-character replacement (`& < > " '`).
- Prefer importing from `progress-utils.js` or `helpers/dom.js` for consistency.
- `mdToHtml()` functions (in `progress-utils.js` and `ui-ai-ai-dom.js`) correctly escape BEFORE applying markdown transforms.

### Right 10: Module Size Budget
**Logic files (non-data, non-template) should stay under 300 lines. Files over 400 lines require a split plan.**

| Threshold | Action |
|-----------|--------|
| < 250 lines | Green — no action needed |
| 250–400 lines | Yellow — consider splitting if logic is growing |
| > 400 lines | Red — must split before adding new functionality |

- Data files (e.g., `harvard-phoneme-meta.js`, `passages.js`) are exempt.
- Template/HTML-builder files get a +100 line allowance.
- Current red-zone files (non-data, non-template, >400 lines): `recorder/audio-inspector.js` (404), `convo/scenarios.js` (537).

### Right 11: .GOLD Backup Before Editing
**Before any manual refactor, create a `.GOLD` backup of each file being changed.**

- Example: `cp features/convo/convo-bootstrap.js features/convo/convo-bootstrap.js.GOLD`
- `.GOLD` files are NOT committed to git — they exist only for local rollback during active work.
- After the change is verified and committed, delete the `.GOLD` file.
- Add `*.GOLD` to `.gitignore` if not already present.

### Right 12: Event Names Are Contracts
**Custom event names (e.g., `lux:lastRecording`, `lux:karaokeRefresh`, `lux:ttsContextChanged`) are treated as public API.**

- Renaming or removing an event name requires a grep across the entire codebase.
- Event detail shapes must not change without updating all listeners.
- New events should follow the `lux:featureName` naming convention.

### Right 13: No Competing Event Dispatches
**For any given event name, there should be exactly ONE dispatch site (or a single canonical function that dispatches).**

- `lux:karaokeRefresh` — dispatched only by `publishKaraoke()` in `tts/player-ui/karaoke.js`.
- `lux:lastRecording` — dispatched only by `setLastRecording()` in `app-core/runtime.js`.
- `lux:ttsContextChanged` — dispatched by `convo-tts-context.js` (via `safeDispatch`).

### Right 14: No Silent Catch Blocks
**`catch` blocks must either log the error or use the project's `warnSwallow()` pattern.**

- The project already has a hygiene script: `npm run no-silent-catches`.
- Every `catch` must call `console.error`, `console.warn`, or `globalThis.warnSwallow(filepath, err)`.
- Empty `catch {}` blocks are banned.

### Right 15: CSS-in-JS Inline Styles Are Last Resort
**Prefer CSS classes over inline `style.cssText` strings in JavaScript.**

- Inline styles in JS make it impossible to audit visual behavior from CSS files alone.
- Modal shells (e.g., `attempt-detail/modal-shell.js`) are acceptable exceptions when they are self-contained.
- New features should use CSS classes defined in the feature's `.css` file.

### Right 16: Vendor Files Are Frozen
**Files in `public/vendor/` must never be edited. Update by replacing the entire file.**

- `d3.v7.min.js`, `d3.layout.cloud.js`, `wavesurfer-7.8.11.min.js` are third-party.
- innerHTML/eval findings in vendor files are NOT actionable (they are upstream's responsibility).
- If a vendor file has a known vulnerability, replace it with a patched version.

### Right 17: Admin Pages Are Low-Trust
**Files in `admin/` render data from the API directly into innerHTML without escaping.**

- `admin/index.html`, `admin/user.html`, `admin/overview.html` all use unescaped template literals in innerHTML.
- This is acceptable ONLY because admin pages are behind authentication and data comes from our own database.
- If admin pages ever become accessible to non-admins, these must be escaped.

### Right 18: Tests Gate Refactors
**No refactor lands without verifying `npm run build` passes.**

- Run `npm run build` before committing any structural change.
- Run `npm run hygiene` to check for innerHTML counts, file sizes, and sink patterns.
- Run `npm run lint` to catch style issues.
- If `npm test` is available, run it.

### Right 19: Rollback Protocol
**Every change must have a documented rollback path.**

- For single-file changes: `git checkout HEAD~1 -- path/to/file`.
- For multi-file changes: tag the commit before the change series.
- For `.GOLD` backup workflow: `cp file.js.GOLD file.js`.
- Never force-push to shared branches without team coordination.

### Right 20: Shared Plumbing Gets a Protection Ring
**Any shared-plumbing cleanup should add or maintain focused tests at the ownership boundary.**

- Shared runtime, bus, storage, and cross-feature attach/handoff logic should not rely on manual QA alone.
- Prefer small contract-level tests over giant UI test sprawl.
- Current examples in the repo include:
  - `app-core/runtime.test.js`
  - `features/features/selfpb/attach-learner-blob.test.js`
- If a cleanup changes ownership, lifecycle, or event contracts, the protection ring should be updated in the same pass.

---

## Part A.2 — Single Source of Truth Charter

### Global Ownership Map

| Global | Canonical Writer | Writer File | Readers |
|--------|-----------------|-------------|---------|
| `window.LuxLastRecordingBlob` | `setLastRecording()` | `app-core/runtime.js:42` | `selfpb/ui.js`, `selfpb/download-latest.js` |
| `window.LuxLastRecordingMeta` | `setLastRecording()` | `app-core/runtime.js:43` | `selfpb/ui.js`, `selfpb/download-latest.js` |
| `window.LuxKaraokeSource` | `publishKaraoke()` | `tts/player-ui/karaoke.js:83` | `selfpb/karaoke.js`, `tts/player-ui.js` |
| `window.LuxKaraokeTimings` | `publishKaraoke()` | `tts/player-ui/karaoke.js:84` | `selfpb/karaoke.js`, `selfpb/controls.js` |
| `window.LuxTTSWordTimings` | `publishKaraoke()` | `tts/player-ui/karaoke.js:86` | `selfpb/karaoke.js` |
| `window.LuxLastWordTimings` | `recorder/index.js` | `features/recorder/index.js:156` | `selfpb/karaoke.js`, `selfpb/controls.js` |
| `window.LuxLastAzureResult` | `recorder/index.js` | `features/recorder/index.js:155` | Results UI |
| `window.luxTTS` | `luxBus 'tts'` (frozen shim only) | End of `mountTTSPlayer` — `window.luxTTS = luxBus.get('tts')` | No direct readers — all migrated to `luxBus.get('tts')` |
| `window.LuxTTSContext` | `installConvoTtsContext()` | `convo/convo-tts-context.js:198` | `tts/player-ui.js` |
| `window.LuxSelfPB` | `selfpb/core.js` + `selfpb/ui.js` | `features/features/selfpb/core.js:177`, `selfpb/ui.js:123` | `tts/player-ui.js` |
| `window.LuxMyWords` | `my-words/index.js` | `features/my-words/index.js:297` | `panel-events.js` |
| `window.LuxSelfPB_REF` | `selfpb/core.js` | `features/features/selfpb/core.js:115` | Internal |
| `window.LuxSelfPB_LastUrl` | `selfpb/core.js` | `features/features/selfpb/core.js:145` | Internal (cleanup) |
| `window.luxDbg` | `app-core/state.js` | `app-core/state.js:13` | Dev tools |
| `window.luxSP` | `08-selfpb-peekaboo.js` | `features/features/08-selfpb-peekaboo.js:198` | Internal |

### One Writer Rule — Enforcement

**Code Review Checklist:**
1. `grep -rn 'window\.LuxFoo\s*=' --include='*.js'` — must return exactly one file (the canonical writer).
2. Any PR that adds a new `window.*` assignment must add it to this charter.
3. Use `Object.assign(window.X || {}, { newProp })` for additive writes (e.g., `window.LuxSelfPB`).

**Hygiene Grep Patterns:**
```bash
# Check for multi-writer violations
rg -n 'window\.LuxLastRecordingBlob\s*=' --type js
rg -n 'window\.LuxKaraokeSource\s*=' --type js
rg -n 'window\.LuxKaraokeTimings\s*=' --type js
rg -n 'document\.body\.style\.overflow' --type js
Notes on window.luxTTS — RESOLVED

window.luxTTS is no longer an active state carrier. Phase A (tag v-luxTTS-bus-only) eliminated all 6 Object.assign mirror writes. The sole source of truth is luxBus.get('tts').

Current state:

convo-tts-context.js writes defaults via luxBus.update('tts', {...}) — no window write.

player-ui.js writes runtime state via luxBus.update('tts', {...}) — no window write.

All readers (player-dom.js, convo-tts-context.js, selfpb/karaoke.js, player-ui.js) use luxBus.get('tts')?.sourceMode etc.

One frozen compat shim: window.luxTTS = luxBus.get('tts') at end of mountTTSPlayer (live reference, not a copy).

Part A.3 — Allowed vs Banned Patterns
Allowed Patterns
Pattern	When to Use	Example
el.textContent = value	Setting text content (safe, no XSS)	btn.textContent = "Save"
el.innerHTML = staticHTML	Static template strings with no interpolation	container.innerHTML = "" (clearing)
el.innerHTML = esc(dynamic) + static	Dynamic content with proper escaping	card.innerHTML = `<h3>${esc(title)}</h3>`
document.createElement() + appendChild()	Building DOM programmatically	Modal shells, buttons
setInterval() with stored ID + clearInterval()	Periodic tasks with cleanup	timer = setInterval(fn, ms); ... clearInterval(timer)
addEventListener(..., { capture: true }) with guard	Intercepting specific events	if (!chip) return; e.stopPropagation()
lockBodyScroll() / unlockBodyScroll()	Modal open/close	Import from helpers/body-scroll-lock.js
Banned Patterns
Pattern	Why It's Banned	Alternative
el.innerHTML = `...${userInput}...`	XSS injection risk	esc(userInput) or el.textContent
document.write()	Destroys document, blocks parsing	createElement + appendChild
eval() / new Function()	Code injection, CSP violation	Direct function calls
document.body.style.overflow = "hidden"	Fighting code between modals	lockBodyScroll()
window.X = value outside canonical writer	Multi-writer global conflict	Call the canonical setter function
stopPropagation() without element guard	Swallows unrelated events	if (!matchedEl) return before stopPropagation
setInterval() without clearInterval path	Memory leak, CPU waste	Store timer ID, clear on cleanup
el.innerHTML = mdToHtml(raw) without esc() inside mdToHtml	XSS if raw contains HTML	Ensure mdToHtml calls esc() first (it does in current codebase)
Part A.4 — Refactor Size Budget
Thresholds
File Lines	Status	Action Required
1–250	Green	No action
251–400	Yellow	Split if adding new logic; document intent if keeping
401+	Red	Must split before adding ANY new functionality
Exemptions

Generated data files (e.g., harvard-phoneme-meta.js at 4362 lines) — machine-generated, not refactor targets.

Scenario/content files (e.g., scenarios.js at 537 lines) — configuration data, splitting adds complexity without benefit.

Vendor files (e.g., d3.v7.min.js) — frozen third-party code.

Safe Split Protocol

Identify the split boundary — find a logical seam (e.g., "render helpers" vs "event wiring" vs "state management").

Create .GOLD backup: cp file.js file.js.GOLD

Extract to new file — pure cut/paste, no logic changes. The new file exports the same functions.

Update imports in the original file to import from the new file.

Verify: npm run build + npm run lint + manual smoke test.

Commit the split as a single atomic commit with message: refactor: extract <description> from <file>.

Delete .GOLD after commit is verified.

Current Red-Zone Files (Non-Data, Non-Template, >400 lines)
File	Lines	Suggested Split
features/recorder/audio-inspector.js	404	Extract rendering logic from event wiring
Current Yellow-Zone Files (250–400 lines, logic-heavy)
File	Lines
features/features/tts/player-ui.js	388
features/convo/scene-atmo.js	388
features/streaming/app.js	380
src/main.js	373
features/interactions/ph-hover/tooltip-modal.js	369
features/results/header.js	362
features/features/selfpb/dom.js	357
features/harvard/modal-controller.js	350
features/convo/characters-drawer.js	347
features/convo/convo-shared.js	340
Part A.5 — Verification & Rollback
Smoke Tests
Area	What to Check	How
Build	App builds without errors	npm run build
Lint	No new lint errors	npm run lint
Hygiene	innerHTML count hasn't increased, no new sinks	npm run hygiene
Silent catches	No empty catch blocks	npm run no-silent-catches
Recording flow	Record audio → results appear → SelfPB shows recording	Manual: index.html
TTS playback	Click Generate & Play → audio plays → karaoke highlights sync	Manual: index.html with TTS drawer
Modal stacking	Open metric modal → open attempt detail → close metric → scroll still locked	Manual: progress.html
Convo flow	Start scenario → record turn → AI responds → suggestions appear	Manual: convo.html
My Words panel	Open panel → add word → close → reopen → word persists	Manual: index.html
Rollback Procedures
Scenario	Command
Revert a single file	git checkout HEAD~1 -- path/to/file
Revert entire commit	git revert <commit-hash>
Revert from .GOLD backup	cp file.js.GOLD file.js
Revert a commit series	git revert --no-commit HEAD~N..HEAD && git commit -m "revert: ..."
Where to Look If It Breaks
Symptom	Likely Cause	Files to Check
Karaoke highlights wrong	LuxKaraokeSource mismatch	tts/player-ui/karaoke.js, selfpb/karaoke.js
Scroll behind modal	Body scroll lock mismatch	helpers/body-scroll-lock.js, modal open/close handlers
SelfPB doesn't show recording	LuxLastRecordingBlob not set	app-core/runtime.js, convo-turn.js, recorder/index.js
TTS voice wrong in convo	Check luxBus.get('tts')?.sourceMode — was dual-write issue, now resolved (Phase A)	convo-tts-context.js, tts/player-ui.js
Click does nothing on score tile	Capture handler swallowing event	chip-events.js, metric-modal/events.js
Double init / duplicate listeners	Missing guard flag	Check installed / luxBooted flags in the feature module
Part B — Updated Audit Status Table (Feb 26 → Mar 1)
#	Issue	Status	Evidence	Risk	Next Action
B.1	window.LuxLastRecordingBlob dual-write (runtime.js vs convo-turn.js)	FIXED	convo-turn.js:4 now imports setLastRecording from runtime.js and calls it at line 38. No direct window.LuxLastRecordingBlob = in convo-turn.js. Only writer is runtime.js:42. Commit c89c937.	LOW	None — verified single writer.
B.2	window.LuxKaraokeSource / LuxKaraokeTimings written by 3 modules	FIXED	publishKaraoke() in tts/player-ui/karaoke.js:81-97 is now the sole writer. selfpb/controls.js:3 imports and calls publishKaraoke("learner", timings). selfpb/karaoke.js:3 imports and calls publishKaraoke. No direct window.LuxKaraokeSource = outside publishKaraoke. Commit aaa3832.	LOW	None — verified canonical writer pattern.
B.3	document.body.style.overflow toggled by 2 modals	FIXED	helpers/body-scroll-lock.js implements ref-counted lockBodyScroll() / unlockBodyScroll(). metric-modal/events.js:5 and attempt-detail/modal-shell.js:4 both import from this helper. No direct document.body.style.overflow in modal files. Commit 2f3292b.	LOW	None — verified ref-counted lock.
B.4	3 capture-phase click handlers competing (my-words, metric-modal, chip-events)	PARTIAL	chip-events.js:46-54 guards with if (!chip) return before stopPropagation() — safe. metric-modal/events.js:134-145 does NOT call stopPropagation — safe. my-words/panel-events.js:122-148 does NOT call stopPropagation — safe. However, no documentation of handler interaction exists.	LOW	Add comments documenting capture-handler interaction matrix.
B.5	window.luxTTS dual-init (convo-tts-context vs player-ui)	FIXED	All 6 Object.assign mirror writes removed. All readers migrated to luxBus.get('tts'). Frozen compat shim remains. Tag: v-luxTTS-bus-only.	LOW	None — resolved.
B.6	Double-init guard in convo-bootstrap.js (MutationObserver + setInterval)	PARTIAL	MutationObserver removed (commit 6285941). setInterval at line 176 still runs forever (300ms poll of state.scenarioIdx) with no clearInterval.	MED	Replace 300ms poll with lux:scenarioChanged event dispatch from picker system.
B.7	Global/window ownership map (inventory of globals)	FIXED	Documented in this Bill of Rights (Part A.2).	LOW	Keep the charter updated as new globals are added.
B.8	z-index stack conflicts (selfpb float above modals)	PARTIAL	z-index inventory compiled (Part A, Right 8). SelfPB expanded float at 200000 is intentional. Metric modal at 10050 vs attempt-detail at 9999 is a minor ordering issue.	LOW	Promote attempt-detail modal z-index to 10050 to match metric-modal.
Part C — innerHTML / Injection / Flakiness Investigation (Code Red)
C.1 — Search Results Summary

Total innerHTML / insertAdjacentHTML / outerHTML usages found: ~95+ across JS files

eval / new Function / document.write: 0 in application code (only in vendor files)

C.2 — Categorized Findings
SAFE: Static HTML or Properly Escaped (76 instances)

These use either static string templates (no interpolation) or properly escape dynamic content via esc().

File	Line(s)	Pattern	Why Safe
ui/ui-arrow-trail.js	37	host.innerHTML = ""	Clearing only
ui/ui-ai-ai-dom.js	37, 131, 260, 292	innerHTML = ""	Clearing only
ui/ui-ai-ai-dom.js	60, 147, 156	btn.innerHTML = <span>emoji</span>	Static emoji strings, no user data
ui/ui-ai-ai-dom.js	177	contentArea.innerHTML = ...	Static loading spinner
ui/ui-ai-ai-dom.js	286	innerHTML = `...${safeMsg}...`	Uses escapeHtml(msg) at line 285
ui/ui-ai-ai-dom.js	309	contentArea.innerHTML = mdToHtml(md)	mdToHtml calls escapeHtml() first (line 315)
features/convo/convo-render.js	38, 55	msgs.innerHTML = "", sugs.innerHTML = ""	Clearing only
features/convo/convo-render.js	44, 63	bubble.innerHTML = highlightHtml(...)	highlightHtml uses escHtml() at line 192 of convo-highlight.js
features/interactions/metric-modal/events.js	69	closeBtn.innerHTML = "&times;"	Static entity
features/interactions/metric-modal/events.js	97-110	card.insertAdjacentHTML(...)	Uses esc() from meta.js for metric keys; buildModalHtml escapes all dynamic values
features/features/tts/boot-tts.js	66	tab.innerHTML = ...	Static label + icon
features/features/selfpb/karaoke.js	73	ui.karaokeLane.innerHTML = ""	Clearing only
features/features/tts/player-dom.js	36, 47	styleSel.innerHTML, mount.innerHTML	Static template; voice names come from VOICES constant
features/progress/attempt-detail/modal-shell.js	25	closeBtn.innerHTML = "&times;"	Static entity
features/progress/attempt-detail/header.js	66	header.innerHTML = ...	Uses esc() imports from progress-utils.js for all dynamic values
features/progress/attempt-detail/*.js	Various	innerHTML = ...	Template strings with escaped dynamic values
features/results/render-core.js	50, 71, 98, 114	innerHTML = "", innerHTML = buildRows(...)	buildRows escapes via score rendering functions
features/results/summary.js	170	$out.innerHTML = html	HTML built by render pipeline with escaping
features/convo/convo-layout.js	7, 12	root.innerHTML = "", atmo.innerHTML = ...	Clearing + static atmo template
features/my-words/panel-dom.js	34	root.innerHTML = ...	Static panel template
features/my-words/panel-render.js	170-205	Various innerHTML	Uses esc() from panel-utils.js
features/onboarding/lux-onboarding.js	30, 140, 143	card.innerHTML, elBody.innerHTML	Step content is from static STEPS array
features/dashboard/ui.js	9, 27	container.innerHTML = ...	Static dashboard templates
features/dashboard/index.js	159, 209, 239	Various innerHTML	Static templates + loading states
features/streaming/ui/render.js	44	container.innerHTML = ""	Clearing only
features/streaming/ui/dom.js	4	root.innerHTML = ""	Clearing only
features/streaming/setup/app.js	45	root.innerHTML = ...	Static setup template
features/convo/progress.js	60, 96, 117	Various innerHTML	Static templates + loading states
features/convo/knobs-drawer.js	42	drawer.innerHTML = ...	Static drawer template
features/convo/characters-drawer.js	77, 203, 299, 347	Various innerHTML	Scenario data from internal config; uses role name interpolation (see RISKY notes)
features/convo/convo-shared.js	102, 106, 243	Various innerHTML	Session report; mostly static templates
features/life/app.js	44, 50, 117, 180, 222	Various innerHTML	Life mode templates; data from internal API
features/harvard/modal-dom.js	178	explainRight.innerHTML = EXPLAIN_HTML	Static constant
features/harvard/modal-actions.js	15, 229	focusSel.innerHTML = "", explainRight.innerHTML = ...	Clearing + static constants
features/harvard/modal-controller.js	333	explainRight.innerHTML = ...	Static HTML constants
features/convo/picker-deck/thumbs-render.js	7	thumbs.innerHTML = ""	Clearing only
features/my-words/launcher.js	23	btn.innerHTML = ...	Static emoji button
features/my-words/library-modal-controller.js	18, 45	Various innerHTML	Static modal template
features/my-words/index.js	116, 124	Various innerHTML	AI coaching UI; static templates
features/recorder/audio-inspector.js	166	root.innerHTML = ...	Dev-only audio inspector template
features/features/selfpb/dom.js	8, 107	host.innerHTML, float.innerHTML	Static selfpb UI template
features/progress/wordcloud/*.js	Various	Multiple innerHTML	Static wordcloud templates
features/results/summary-shell.js	90	footer.innerHTML = ...	Static footer template
RISKY: Dynamic Content Without Escaping (7 instances)
#	File	Line(s)	Code	Risk Level	Dynamic Source	Remediation
R1	ui/auth-dom.js	107	modal.querySelector("div").innerHTML = `...${email}...`	HIGH	User email input from <input type="email">	XSS: user types "><img src=x onerror=alert(1)> as email. Must escape: esc(email).
R2	features/results/render-helpers.js	58	``$out.innerHTML = `<span class="score-bad">Error: ${data?.error		"Unknown"}</span>` ``	MED
R3	features/results/render-helpers.js	116	<b>${err.word}</b>: <span...>${err.score}%</span>	MED	Azure word results	err.word comes from Azure API Word field. Unlikely but not impossible to contain HTML. Should escape.
R4	features/passages/dom.js	66	ui.tipText.innerHTML = textHTML	LOW-MED	textHTML variable; need to trace source	Depends on upstream builder; likely safe but should verify escaping.
R5	features/results/syllables.js	138	m.innerHTML = renderSyllableStrip(w)	LOW	Syllable render from Azure word data	renderSyllableStrip should be verified to escape word text.
R6	features/interactions/ph-hover/tooltip-render.js	212	state.tooltipContent.innerHTML = html	LOW	html from tooltip builder	Tooltip builders use escapeHTML() from utils.js. Likely safe.
R7	features/progress/attempt-detail/ai-coach-section.js	59, 69, 73	contentDiv.innerHTML = mdToHtml(content)	LOW	AI coach response text	mdToHtml from progress-utils.js calls esc() first. Safe if AI responses don't contain raw HTML that survives escaping.
Admin Pages (Separate Trust Zone)
File	Line(s)	Pattern	Note
admin/index.html	271-303	Multiple innerHTML with template literals	Admin-only; data from own DB
admin/user.html	57	innerHTML = rows.map(r => `...`)	Admin-only; data from own DB
admin/overview.html	66-71	tbody.innerHTML, tr.innerHTML	Admin-only; data from own DB
C.3 — Correlation to Reported "Inconsistent UI Behavior"

Finding: innerHTML-based DOM replacement is the primary cause of event listener loss and timing races.

Symptom	Root Cause	File(s)
Karaoke words don't respond to clicks after source switch	karaoke.js:73 clears lane with innerHTML = "", re-renders all words. If renderKaraoke is called during playback, event listeners on old elements are lost. New elements get fresh listeners.	selfpb/karaoke.js
Chat bubbles lose click-to-select after re-render	convo-render.js:38 clears msgs.innerHTML = "" on every renderMessages(). The TTS context listener on msgs (line 186 of convo-tts-context.js) survives because it's on the container, not the bubbles.	convo/convo-render.js
Score tiles sometimes don't open metric modal	If innerHTML rebuilds the results area while a capture-phase handler is registered, the new DOM elements may not have data-score-key attributes until decorateTiles() runs.	results/render-core.js, metric-modal/events.js
Progress dashboard flickers on refresh	dashboard/index.js:159 and :239 replace entire root.innerHTML on data load, causing a full DOM teardown + rebuild.	features/dashboard/index.js

Key insight: The codebase uses delegated event handling (listeners on parent containers) which mitigates most innerHTML-related listener loss. The remaining issues are visual (flicker during rebuilds) rather than functional.

Performance note: innerHTML triggers HTML parsing, which is slower than createElement + appendChild for small updates but faster for large template replacements. The current usage pattern (rebuild-on-data-change) is acceptable but could benefit from targeted DOM patching for frequently-updated elements like chat bubbles.

Part D — Tactical Fix Plan (Top 8 Items)
Fix 1: Escape email in auth-dom.js (CRITICAL — XSS)

Why: Line 107 of ui/auth-dom.js interpolates user-typed email directly into innerHTML. A crafted email address can execute arbitrary JavaScript.

Minimal patch:

File: ui/auth-dom.js

Add escapeHtml() function (already exists at line 295 of ui-ai-ai-dom.js — copy or import).

Change line 107: ${email} → ${escapeHtml(email)}

Smoke test: Type "><img src=x onerror=alert(1)> as email. Should display as text, not execute.

Rollback: git checkout HEAD~1 -- ui/auth-dom.js

Risk: LOW (surgical 1-line change + function addition)

Fix 2: Escape API error messages in render-helpers.js (MED — injection via API)

Why: Lines 58 and 116 of features/results/render-helpers.js interpolate API-sourced strings (data?.error, err.word) into innerHTML without escaping.

Minimal patch:

File: features/results/render-helpers.js

Import esc from scoring or add inline escape.

Line 58: ${data?.error || "Unknown"} → ${esc(data?.error || "Unknown")}

Line 116: ${err.word} → ${esc(err.word)}, ${err.score} → ${esc(String(err.score))}

Smoke test: npm run build passes; results page renders normally after recording.

Rollback: git checkout HEAD~1 -- features/results/render-helpers.js

Risk: LOW (3-line change, no behavior change for normal data)

Fix 3: Replace convo-bootstrap.js unbounded setInterval with event (MED — CPU waste)

Why: convo-bootstrap.js:176 runs a 300ms interval forever to detect state.scenarioIdx changes. This wastes CPU and is the last remnant of the "double-init" pattern from the Feb 26 audit.

Minimal patch:

File: features/convo/convo-bootstrap.js
File: features/convo/convo-picker-system.js (where state.scenarioIdx is set)

In picker-system, dispatch window.dispatchEvent(new Event("lux:scenarioChanged")) when state.scenarioIdx changes.

In bootstrap, replace setInterval with window.addEventListener("lux:scenarioChanged", () => { ... }).

Smoke test: Switch scenarios in convo picker → characters drawer updates → knobs summary updates.

Rollback: git checkout HEAD~1 -- features/convo/convo-bootstrap.js features/convo/convo-picker-system.js

Risk: MED (two files, event timing must be verified)

Fix 4: Document capture-handler interaction (LOW — clarity)

Why: Three document-level capture handlers exist but no documentation explains their interaction. This causes confusion during debugging and risks future regressions.

Minimal patch:

Add a comment block at the top of chip-events.js, metric-modal/events.js, and my-words/panel-events.js listing all capture handlers and their guard logic.

Risk: ZERO (comments only)

Fix 5: Add *.GOLD to .gitignore (LOW — hygiene)

Why: The .GOLD backup discipline requires these files to exist locally but never be committed.

Minimal patch: Add *.GOLD to .gitignore.

Risk: ZERO

Fix 6: Consolidate esc() / escapeHtml() functions (LOW — DRY)

Why: Five separate identical escape functions exist across the codebase. Drift risk increases with each copy.

Minimal patch:

Add export function esc(s) to helpers/dom.js (or create helpers/escape.js).

Gradually update imports in other files to use the shared version.

Do NOT change all imports at once — do it file-by-file as files are touched.

Risk: LOW (additive; existing copies continue to work)

Fix 7: Promote attempt-detail modal z-index (LOW — visual)

Why: Attempt-detail modal (modal-shell.js:11) uses z-index 9999, while metric-modal CSS uses 10050. If both are open, metric modal correctly overlays attempt-detail. But the attempt-detail should match.

Minimal patch: Change z-index: 9999 to z-index: 10050 in modal-shell.js:11.

Risk: LOW (visual only, no logic change)

Fix 8: Document window.luxTTS init-order dependency — ✅ SUPERSEDED

Status: Resolved by Phase A (v-luxTTS-bus-only). The dual-write was eliminated entirely — all mirror writes removed, all readers migrated to luxBus.get('tts'). No init-order dependency exists anymore.

Part E — Implementation Status

Fixes 1, 2, and 5 are implemented in this commit series (see below). They are the lowest-risk, highest-impact items.

Implemented Patches

See git log for commit details.