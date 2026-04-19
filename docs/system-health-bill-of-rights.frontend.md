# System Health Bill of Rights — Frontend

**Repo:** `lux-frontend`
**Document revision:** 2026-04-19
**Prior revision:** 2026-03-01
**Scope:** rules, charter, enforcement patterns, refactor thresholds, rollback protocol.

**What this doc is NOT:** it is not a list of current audit findings, not a work queue, not a fix plan, not a red-zone file tracker, not a status dashboard. Work items and findings live in `docs/LUX_PROJECT_AUDIT_2026-04-17.md`. Scaffolding and architecture live in `docs/ARCHITECTURE.md`. Product ideas live in `docs/LUX_MASTER_IDEA_CATALOG.md`. This doc defines **rules that do not change when the code changes.**

---

## Current Enforcement Reality

These rules are not purely aspirational.

Current repo direction:
- `luxBus` is the canonical shared-frontend coordination layer
- shared runtime helpers own cross-feature current-run state
- window globals may still exist as compatibility mirrors or classic-script bridges, but they are not the preferred write path
- new hardening work should migrate callers toward bus-first / helper-first ownership without breaking compatibility prematurely

Interpret every rule below through that lens:
canonical writer first, compat mirror second, broad purge never.

---

## Current Project Context

These rules are being applied in the context of a **solo-developer, local-only build phase**.

Current reality:
- the frontend is being developed and tested locally
- there is no intended public production exposure yet
- there are no external clients, customers, employees, or general users on the system
- the same person is currently the architect, developer, tester, and operator

This affects **priority**, but not **standards**.

What changes in this phase:
- architecture clarity, ownership boundaries, migration completion, and maintainability usually take priority over full production hardening
- some public-deployment security work may be intentionally deferred until the product is further along
- recommendations should be calibrated for a codebase that is still being actively built, not one already serving outside users

What does **not** change in this phase:
- no real secrets or credentials should be committed
- avoid creating structural patterns that will be painful or dangerous to unwind later
- deferred hardening must remain visible as future required work before any external exposure
- "local-only for now" is not permission for permanent sloppy ownership, drift, or hidden risk

Practical review rule:

> When evaluating this repo, distinguish between:
> 1. **fix-now architecture and maintainability problems**, and
> 2. **later-phase production hardening work**.
>
> Do not confuse the second category for an already-live emergency unless there is evidence of actual exposure.

This note exists so future audits, refactors, and AI handoffs do not mis-prioritize work by assuming the project is already publicly deployed.

---

# Part A — The Bill of Rights (20 Rules)

## Right 1: One Writer Per Global

**Every shared-state entrypoint has exactly ONE canonical writer module or helper contract.**

- Canonical ownership should prefer exported helpers and bus APIs over raw global mutation.
- Direct `window.X = ...` assignments outside the canonical writer are banned for module code.
- Readers may access compat globals when needed, but must never become independent writers.
- If a second module needs to set the value, it must call the canonical writer export or publish through the approved bus/helper contract.
- Compat mirrors may remain temporarily for migration safety, but they do not change canonical ownership.
- **Enforcement:** `grep -rn 'window\.LuxFoo\s*=' --include='*.js'` should point to one intentional writer path, or to one canonical helper/bus bridge.
- Violations are tracked in the Single Source of Truth Charter (Part A.2).

## Right 2: State Must Have One Clear Owner

**Every piece of frontend state must declare its ownership tier up front.**

If a value crosses feature boundaries, survives orchestration handoffs, or needs compat mirrors, it must not live as ad hoc local state.

### Allowed ownership tiers

1. **Cross-feature shared runtime state**
   - Use `app-core/runtime.js` + `luxBus` when multiple features need the same live value.
   - Examples: last recording, last attempt ID, TTS shared state.
   - Window mirrors may exist only as compatibility surfaces owned by the canonical helper.

2. **Feature-island state**
   - Local to one feature root, does not cross feature boundaries.
   - Examples: AI Conversations page state, drawer open/close state, local UI toggles.

3. **Dedicated store islands**
   - True sub-app with its own lifecycle, render loop, or controller/store architecture.
   - Examples: Streaming (`features/streaming/state/store.js`), Wordcloud (`features/progress/wordcloud/state-store.js`).

4. **Compat globals**
   - Exist for migration safety, legacy bridges, or isolated legacy islands.
   - **Not** canonical owners.

### Decision rule

Before adding new shared state, answer in order:

1. Is this value shared across feature families? → if yes, it's Tier A (runtime + bus).
2. If feature-local, what proves it is truly a feature island? → if it isn't, it's Tier A.
3. If it is a store, what makes it a true sub-app rather than just local state with a fancy wrapper? → if nothing, don't create a store.
4. If it touches `window.*`, where is the single canonical writer? → if no single writer, this is a Right 1 violation.

### Banned patterns

- Publishing to `window.*` "just for convenience" outside a canonical writer
- Creating a dedicated store for simple shared values that belong in runtime/bus
- Leaving compat globals as independent writers after readers have migrated
- Adding new direct readers to a compat global when a canonical helper exists

### Enforcement

PR review must answer the five questions at the end of Part A.2.

## Right 3: No innerHTML With Dynamic Content

**`innerHTML` may only be assigned with static template strings. Any dynamic or user-originated content must be escaped at the interpolation point.**

- Dynamic content that has not been escaped through `escapeHtml()` (canonical location: `helpers/escape-html.js`) or an equivalent trusted helper must not be placed into `innerHTML`, `insertAdjacentHTML`, or `outerHTML`.
- `textContent` is preferred whenever the payload is plain text.
- Template-literal markdown/HTML builders (e.g. `mdToHtml`) are permitted only if they call `escapeHtml` internally before interpolating.
- See Part A.3 for the full allowed / banned pattern table.

## Right 4: No Fighting Modals

**Modal systems must not compete for shared DOM or body state.**

- Body-scroll lock goes through the ref-counted helper (`helpers/body-scroll-lock.js: lockBodyScroll` / `unlockBodyScroll`).
- Direct `document.body.style.overflow = ...` assignment outside that helper is banned.
- Z-index must respect the budget in Right 8.

## Right 5: Capture-Phase Handlers Must Not Swallow Unrelated Events

**Any `addEventListener(..., { capture: true })` that calls `stopPropagation()` must first guard on an element match.**

Pattern:

```javascript
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.ph-chip');
  if (!chip) return;           // guard
  e.stopPropagation();          // only after guard
  // ... handle
}, { capture: true });
```

Without the guard, a capture-phase handler can swallow clicks intended for other features.

## Right 6: Intervals Must Be Clearable

**Every `setInterval` must store its timer ID and have a documented `clearInterval` path.**

- Long-lived polls (heartbeats, animation loops) must still have a teardown hook tied to feature unmount or document hide.
- "Runs forever" is not a valid timer lifecycle.

## Right 7: One Init Per Feature

**Every feature module must be idempotent on re-initialization.**

- Use a boot flag (`if (installed) return; installed = true;`) or `guardedListener` from `app-core/lux-listeners.js`.
- Second `init()` calls must be no-ops, not stack-doubling.

## Right 8: Z-Index Budget

**All z-index values must fall within the declared budget. New z-index values require a documented reason and must fit the layering hierarchy.**

Budget (declared layering, highest to lowest):

| Tier | Range | Purpose |
|---|---|---|
| Dev tools | 999,999 | Audio inspector (dev-only) |
| Expanded float | 200,000 | Self-playback expanded float (intentionally above modals for playback-always-visible) |
| Overlays | 99,999 | Convo report overlay |
| Modals | 9,999–10,050 | Attempt detail, metric, Harvard picker |
| Auth | 1,000 | Auth modal |
| Toasts | 950 | Toast notifications |
| Drawers | 900 | TTS drawer, SelfPB mini drawer |
| Sticky | 20 | Sticky table headers |

New z-index values outside this budget must be declared with rationale before landing.

## Right 9: Escape All Dynamic HTML

**`escapeHtml()` is mandatory wherever dynamic content enters rendered HTML.**

- Canonical implementation: `helpers/escape-html.js: escapeHtml`.
- Re-exports permitted; redefinitions banned.
- Even "trusted" internal data (Azure word results, AI coach responses) must be escaped before interpolation. Trust assumptions at the render layer are brittle.

## Right 10: Module Size Budget

**Files grow until they must split. See Part A.4 for thresholds and split protocol.**

## Right 11: `.GOLD` Backup Before Editing

**Before any non-trivial file edit (rename, split, major rewrite), create a `.GOLD` backup.**

Pattern: `cp file.js file.js.<YYYY-MM-DD>.GOLD`

- `.GOLD` files are gitignored (never committed).
- `.GOLD` files are local-only rollback safety nets.
- Delete `.GOLD` after the commit is verified and the change has soaked.

## Right 12: Event Names Are Contracts

**Once a `luxBus` channel or DOM event name is in use, renaming it is a breaking change and requires a migration pass.**

- Channels are listed in `docs/ARCHITECTURE.md` Bus Channels section.
- Renames touch all writers, all readers, and tests.
- Adding new channels is cheap; renaming is not.

## Right 13: No Competing Event Dispatches

**When a value has a canonical setter (e.g., `setLastRecording()` in `runtime.js`), that setter is the sole dispatcher of the change event.**

- Do not dispatch `lux:lastRecording` from anywhere except `runtime.js`.
- Do not publish to the `lastRecording` bus channel from anywhere except `runtime.js`.
- Same pattern applies to karaoke (`publishKaraoke` is the sole writer), TTS (`luxBus 'tts'` is the sole channel), etc.

## Right 14: No Silent Catch Blocks

**Every `catch` block must call `globalThis.warnSwallow(fileLabel, err, level)`.**

- `level` is `"important"` for catches where failure would affect persistence, API calls, recording, or state.
- Catches without a level default to `"off"` mode (silent in prod, visible only in `"on"` mode).
- Enforcement: `npm run no-silent-catches` scans for naked catches. CI-eligible.

## Right 15: CSS-in-JS Inline Styles Are Last Resort

**Prefer CSS classes with `lux-` prefix. Inline styles only for one-off dynamic values (e.g., `element.style.transform = translate(...)`).**

- Static styling belongs in the matching `lux-<feature>.css` file.
- Dynamic layout math (position, transform) is the exception; color, typography, padding, borders should be class-based.

## Right 16: Vendor Files Are Frozen

**Files in `public/vendor/` (or equivalent frozen third-party code) must not be edited in place.**

- If a vendor file needs a patch, wrap it with a shim or fork and document the fork.
- Updating vendor files is an explicit, tagged operation — not a silent drift.

## Right 17: Admin Pages Are Low-Trust

**`admin/*.html` pages are a separate trust zone.**

- They are not part of the main user product.
- They may use direct innerHTML with own-DB data (no external user input flows through them).
- They must not be relied upon for security-sensitive operations without the admin token gate.
- They are out of scope for most refactor rules above.

## Right 18: Tests Gate Refactors

**Protection-ring tests must pass before and after any refactor touching shared plumbing.**

Protection-ring coverage includes (current as of 2026-04-19):
- `app-core/lux-bus.js`
- `app-core/runtime.js`
- `app-core/lux-storage.js`
- `_api/util.js` (apiFetch)
- `_api/identity.js`
- `_api/attempts.js` (contract)

Command: `npm test`. Must return green before pushing refactor work.

## Right 19: Rollback Protocol

**Every non-trivial change has a documented rollback path.**

- `.GOLD` file restore: `cp file.js.<date>.GOLD file.js`
- Single-file git revert: `git checkout HEAD~1 -- path/to/file`
- Commit revert: `git revert <hash>`
- Series revert: `git revert --no-commit HEAD~N..HEAD && git commit -m "revert: ..."`

No change is "in" until the rollback path is known and tested.

## Right 20: Shared Plumbing Gets a Protection Ring

**Any module in `app-core/` or `_api/` must have a colocated `*.test.js` file before it ships cross-feature behavior changes.**

- Colocation pattern: `app-core/runtime.js` ⇄ `app-core/runtime.test.js`.
- Test covers at minimum: canonical writer contract, reader contract, event/bus dispatch shape.
- Ring is non-negotiable for anything downstream from `luxBus.set/get/on/update` or `apiFetch`.

---

# Part A.2 — Single Source of Truth Charter

## Global Ownership Map

All window globals currently in the repo, with their canonical writers (verified against repo state 2026-04-19).

| Global | Canonical Writer | Writer File | Notes |
|---|---|---|---|
| `window.LuxLastRecordingBlob` | `setLastRecording()` | `app-core/runtime.js:49` | Runtime-owned mirror |
| `window.LuxLastRecordingMeta` | `setLastRecording()` | `app-core/runtime.js:50` | Runtime-owned mirror |
| `window.LuxKaraokeSource` | `publishKaraoke()` | `features/features/tts/player-ui/karaoke.js:93` | Sole writer, ref-counted via canonical helper |
| `window.LuxKaraokeTimings` | `publishKaraoke()` | `features/features/tts/player-ui/karaoke.js:94` | Sole writer |
| `window.LuxTTSWordTimings` | `publishKaraoke()` | `features/features/tts/player-ui/karaoke.js:96` | Sole writer |
| `window.LuxLastWordTimings` | `recorder/index.js` | `features/recorder/index.js:162` | Recorder-owned |
| `window.LuxLastAzureResult` | `recorder/index.js` | `features/recorder/index.js:161` | Recorder-owned |
| `window.LuxLastSaidText` | `header-modern.js` | `features/results/header-modern.js:119` | Results header-owned |
| `window.luxTTS` | `luxBus 'tts'` (frozen shim only) | `features/features/tts/player-ui.js:456` | `window.luxTTS = luxBus.get('tts')` — live reference, not a copy. No direct readers — all migrated to `luxBus.get('tts')` |
| `window.LuxTTSContext` | `installConvoTtsContext()` | `features/convo/convo-tts-context.js:202` | Convo-owned |
| `window.LuxSelfPB` | Frozen shim — `luxBus.get('selfpbApi:core')` is sole owner | `features/features/selfpb/core.js:184` | All readers migrated to bus. Tag: `v-LuxSelfPB-bus-migrated` |
| `window.LuxMyWords` | Frozen shim — `luxBus.get('myWordsApi')` is sole owner | `features/my-words/index.js:310` | All readers migrated to bus. Tag: `v-LuxMyWords-bus-migrated` |
| `window.LUX_USER_ID` | `ensureUID()` / `setUID()` | `_api/identity.js:86, :125` | Both writes are within the identity module (single owner); not a multi-writer violation |
| `window.LUX_DEBUG` | `app-core/state.js:13` | | Debug flag |
| `window.luxDbg` | `app-core/state.js:15` | | Debug helpers namespace |
| `window.LuxWarn` | `ui/lux-warn.js:80` | | warnSwallow control surface (DevTools API) |

**REMOVED globals (historical, do not reintroduce):**

| Global | Removal Tag |
|---|---|
| `window.LuxSelfPB_REF` | `v-LuxSelfPB-bus-migrated` (internalized as module-level `_refState`) |
| `window.LuxSelfPB_LastUrl` | `v-LuxSelfPB-bus-migrated` (internalized as module-level `_lastUrl`) |
| `window.luxSP` | `v-luxSP-removed` (dead — zero readers) |

## One Writer Rule — Enforcement

**Code Review Checklist:**

1. `grep -rn 'window\.LuxFoo\s*=' --include='*.js'` — must return exactly one file (the canonical writer).
2. Any PR that adds a new `window.*` assignment must add it to the Global Ownership Map above.
3. Do NOT use `Object.assign(window.X || {}, ...)` for new globals. Use `luxBus.set()`. Remaining window globals are frozen compat shims only.

**Hygiene Grep Patterns:**

```bash
# Check for multi-writer violations
rg -n 'window\.LuxLastRecordingBlob\s*=' --type js
rg -n 'window\.LuxKaraokeSource\s*=' --type js
rg -n 'window\.LuxKaraokeTimings\s*=' --type js
rg -n 'document\.body\.style\.overflow' --type js
```

**Notes on `window.luxTTS`:**

`window.luxTTS` is no longer an active state carrier. The stabilization campaign (tag `v-luxTTS-bus-only`) eliminated all Object.assign mirror writes. The sole source of truth is `luxBus.get('tts')`.

- `convo-tts-context.js` writes defaults via `luxBus.update('tts', {...})` — no window write
- `player-ui.js` writes runtime state via `luxBus.update('tts', {...})` — no window write
- All readers (`player-dom.js`, `convo-tts-context.js`, `selfpb/karaoke.js`, `player-ui.js`) use `luxBus.get('tts')`
- One frozen compat shim remains: `window.luxTTS = luxBus.get('tts')` at end of `mountTTSPlayer` (live reference, not a copy)

---

# Part A.3 — Allowed vs Banned Patterns

## Allowed Patterns

| Pattern | When to Use | Example |
|---|---|---|
| `el.textContent = value` | Setting text content (safe, no XSS) | `btn.textContent = "Save"` |
| `el.innerHTML = staticHTML` | Static template strings with no interpolation | `container.innerHTML = ""` (clearing) |
| `el.innerHTML = esc(dynamic) + static` | Dynamic content with proper escaping | `card.innerHTML = `<h3>${esc(title)}</h3>`` |
| `document.createElement() + appendChild()` | Building DOM programmatically | Modal shells, buttons |
| `setInterval()` with stored ID + `clearInterval()` | Periodic tasks with cleanup | `timer = setInterval(fn, ms); ... clearInterval(timer)` |
| `addEventListener(..., { capture: true })` with guard | Intercepting specific events | `if (!chip) return; e.stopPropagation()` |
| `lockBodyScroll()` / `unlockBodyScroll()` | Modal open/close | Import from `helpers/body-scroll-lock.js` |

## Banned Patterns

| Pattern | Why It's Banned | Alternative |
|---|---|---|
| `` el.innerHTML = `...${userInput}...` `` | XSS injection risk | `esc(userInput)` or `el.textContent` |
| `document.write()` | Destroys document, blocks parsing | `createElement` + `appendChild` |
| `eval()` / `new Function()` | Code injection, CSP violation | Direct function calls |
| `document.body.style.overflow = "hidden"` | Fighting code between modals | `lockBodyScroll()` |
| `window.X = value` outside canonical writer | Multi-writer global conflict | Call the canonical setter function |
| `stopPropagation()` without element guard | Swallows unrelated events | `if (!matchedEl) return` before `stopPropagation` |
| `setInterval()` without `clearInterval` path | Memory leak, CPU waste | Store timer ID, clear on cleanup |
| `el.innerHTML = mdToHtml(raw)` without `esc()` inside `mdToHtml` | XSS if raw contains HTML | Ensure `mdToHtml` calls `esc()` first (it does in current codebase) |
| Raw `localStorage.getItem/setItem('key-name', ...)` outside `lux-storage.js` | Bypasses K_ constants registry, invites typos and drift | Import `K_*` constant from `app-core/lux-storage.js` and use typed helpers |

---

# Part A.4 — Refactor Size Budget

## Thresholds

| File Lines | Status | Action Required |
|---|---|---|
| 1–250 | Green | No action |
| 251–400 | Yellow | Split if adding new logic; document intent if keeping |
| 401+ | Red | Must split before adding ANY new functionality |

## Exemptions

- **Generated data files** (e.g., `harvard-phoneme-meta.js` at 4362 lines) — machine-generated, not refactor targets
- **Scenario/content files** (e.g., `scenarios.js`) — configuration data, splitting adds complexity without benefit
- **Vendor files** (e.g., `d3.v7.min.js`) — frozen third-party code per Right 16
- **Admin pages** — low-trust zone per Right 17

## Safe Split Protocol

1. **Identify the split boundary** — find a logical seam (e.g., "render helpers" vs "event wiring" vs "state management").
2. **Create `.GOLD` backup:** `cp file.js file.js.<YYYY-MM-DD>.GOLD`
3. **Extract to new file** — pure cut/paste, no logic changes. The new file exports the same functions.
4. **Update imports** in the original file to import from the new file.
5. **Verify:** `npm run build` + `npm run lint` + `npm test` + manual smoke test.
6. **Commit** the split as a single atomic commit with message: `refactor: extract <description> from <file>`
7. **Delete `.GOLD`** after commit is verified and the change has soaked.

**Note on current red/yellow zone files:** the *list* of files currently violating these thresholds is audit information, not charter information. It lives in `docs/LUX_PROJECT_AUDIT_2026-04-17.md` (merged in via extractions, 2026-04-19). This doc defines only the thresholds and the split protocol.

---

# Part A.5 — Verification & Rollback

## Smoke Tests

| Area | What to Check | How |
|---|---|---|
| Build | App builds without errors | `npm run build` |
| Lint | No new lint errors | `npm run lint` |
| Hygiene | innerHTML count hasn't increased, no new sinks | `npm run hygiene` |
| Silent catches | No empty catch blocks | `npm run no-silent-catches` |
| Recording flow | Record audio → results appear → SelfPB shows recording | Manual: `index.html` |
| TTS playback | Click Generate & Play → audio plays → karaoke highlights sync | Manual: `index.html` with TTS drawer |
| Modal stacking | Open metric modal → open attempt detail → close metric → scroll still locked | Manual: `progress.html` |
| Convo flow | Start scenario → record turn → AI responds → suggestions appear | Manual: `convo.html` |
| My Words panel | Open panel → add word → close → reopen → word persists | Manual: `index.html` |
| Voice Mirror | Record sample → clone triggers → playback in cloned voice | Manual: TTS drawer |

## Rollback Procedures

| Scenario | Command |
|---|---|
| Revert a single file | `git checkout HEAD~1 -- path/to/file` |
| Revert entire commit | `git revert <commit-hash>` |
| Revert from `.GOLD` backup | `cp file.js.<date>.GOLD file.js` |
| Revert a commit series | `git revert --no-commit HEAD~N..HEAD && git commit -m "revert: ..."` |

## Where to Look If It Breaks

| Symptom | Likely Cause | Files to Check |
|---|---|---|
| Karaoke highlights wrong | `LuxKaraokeSource` mismatch | `features/features/tts/player-ui/karaoke.js`, `features/features/selfpb/karaoke.js` |
| Scroll behind modal | Body scroll lock mismatch | `helpers/body-scroll-lock.js`, modal open/close handlers |
| SelfPB doesn't show recording | `LuxLastRecordingBlob` not set | `app-core/runtime.js`, `features/convo/convo-turn.js`, `features/recorder/index.js` |
| TTS voice wrong in convo | Check `luxBus.get('tts')?.sourceMode` — was dual-write issue, now resolved | `features/convo/convo-tts-context.js`, `features/features/tts/player-ui.js` |
| Click does nothing on score tile | Capture handler swallowing event | `features/interactions/ph-hover/chip-events.js`, `features/interactions/metric-modal/events.js` |
| Double init / duplicate listeners | Missing guard flag | Check `installed` / `luxBooted` flags in the feature module |
| `/api/migrate` returns 404 on login | Endpoint doesn't exist — known bug | `ui/auth-dom.js:192` (tracked in audit, not a rules violation) |

---

## Related Documentation

- **`docs/ARCHITECTURE.md`** — how the frontend is actually built (structure, stack, spine)
- **`docs/LUX_PROJECT_AUDIT_2026-04-17.md`** — current findings, work items, current red/yellow zone file list
- **`docs/LUX_MASTER_IDEA_CATALOG.md`** — vision, feature roadmap
- **`docs/routines/`** — three-file Claude Code Routines system
