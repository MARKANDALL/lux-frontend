# LUX_ROUTINES_FROM_CATALOG.md
<!-- Path: docs/routines/LUX_ROUTINES_FROM_CATALOG.md — Routines that solve specific items from LUX_MASTER_IDEA_CATALOG.md. Tightly coupled to the Lux roadmap. -->

> **Part of a 3-file system:**
> - `CLAUDE_ROUTINES_BACKLOG.md` — generic routine ideas (universal patterns)
> - `CLAUDE_ROUTINES_PLAYBOOK.md` — strategy, cost math, traps
> - **This file** — Lux-catalog-derived routines
>
> **What's special about these:** every entry here traces back to a specific phase/item in `LUX_MASTER_IDEA_CATALOG.md`. When that catalog changes, this file should change with it. Routines here are **domain-specific to Lux**; they'd be meaningless on any other codebase.
>
> **Priority key:** 🔵 high-value · 🟡 medium · 🟠 experimental · ⚪ stretch
> **Status key:** ✅ live · ⏳ queued · 💡 idea · ❌ killed

---

## 🗺️ How This File Is Organized

Four clusters, roughly in order of foundational value:

1. **Data Layer** — routines that produce data other features and routines depend on
2. **Feature Enablers** — routines that unblock specific catalog phases
3. **Content Protection** — routines that guard existing Lux work from bit-rot
4. **Business & Ops** — routines supporting the path-to-cash-positive and the coaching business
5. **⚠️ Lux-Specific Traps** — things that look like Lux routines but aren't (re-read before adding)

---

## 1. 🧱 Data Layer

> These produce files that other routines and features read. Build these first; everything downstream depends on them.

### 🔵 L1 → Error Profile Research Routine
**Solves:** Phase 2.1, 2.2, 2.4, 5.6, half of Bridge Mode. Catalog's explicit "backed by a real data table" ask.

- **What it does:** Walks a prioritized L1 list one language per week. Queries SLA literature, phonological transfer studies, ESL teaching corpora, contrastive analysis papers.
- **Output:** `/data/l1-profiles/<language>.md` — structured: expected phoneme confusions, common error patterns, rhythm/stress issues, citations.
- **Frequency:** Weekly for ~15 weeks, then done. Rerun individual languages when new research surfaces.
- **Why it has to be a routine:** You will start this manually and stop. A routine grinds through it.
- **Model:** Opus (deep research, synthesis across sources).

### 🔵 Harvard Sentences Phoneme-Density Index
**Solves:** Phoneme-driven passage library plan (from your saved instructions). Unblocks Phase 1.3 "Generate my next practice."

- **What it does:** Reads every Harvard passage, tokenizes, uses CMU dict (or similar) to compute per-phoneme counts.
- **Output:** `/data/harvard-phoneme-index.json` — { passage_id → { phoneme → count } }.
- **Frequency:** One-off. Companion weekly routine re-runs only when corpus changes.
- **Why it matters:** "Generate my next practice" becomes O(1) lookup instead of runtime computation. Without this file, the feature is impractical.
- **Model:** Sonnet (mechanical but across many files).

### 🟡 Phoneme Difficulty Map (extension)
**Solves:** Phase 2.1 diagnosis engine nuance.

- **What it does:** Reads L1 profiles + phoneme index together, computes "for L1 X, rank phonemes by expected difficulty."
- **Output:** `/data/phoneme-difficulty/<L1>.json`.
- **Frequency:** Recompute whenever an L1 profile updates.
- **Depends on:** L1 profiles + phoneme index above.

### 🟡 Per-User Rollup Aggregator
**Solves:** Lux data aggregation goal from saved instructions — unify pronunciation data over time across passage results + AI conversations.

- **What it does:** Nightly, reads anonymized session data from Supabase (read-only), computes per-user phoneme-frequency and error-correlation rollups.
- **Output:** `/data/rollups/<date>.json`. ⚠️ **Writes to files only — not back to Supabase.** (See Traps section.)
- **Frequency:** Nightly.
- **Why it matters:** Feeds the staggered-intelligence upgrade without requiring a real ETL pipeline. This is literally what an FDE builds for a customer.
- **Model:** Sonnet.

### ⚪ Word Difficulty Rank Table
**Solves:** Phase 3.4.1 dynamic conversation text encoding (data-prep portion only).

- **What it does:** For every word appearing in Lux scenarios and passages, compute a composite difficulty rank (frequency-based + CEFR-band + phoneme-load).
- **Output:** `/data/word-difficulty.json`.
- **Frequency:** Monthly, or on scenario library changes.

---

## 2. 🚀 Feature Enablers

> Routines that unblock specific catalog phases. Each one shortens a feature's build time from weeks to days.

### 🔵 Bridge Mode Data Prep
**Solves:** Bridge Mode feature, Phase 4 multi-language.

- **What it does:** For each L1, for each ratio band (e.g., 10/90, 25/75, 50/50, 75/25, 90/10 L1/L2), generates passage bank with high-frequency-plus-trouble-phoneme word selection.
- **Output:** `/bridge-mode/corpora/<L1>/<ratio>.md`.
- **Frequency:** One-off per language. Rerun when L1 profile updates.
- **Depends on:** L1 profiles + Harvard phoneme index.
- **Why it matters:** Bridge Mode goes from a month of manual corpus-writing to a week of feature work.
- **Model:** Sonnet.

### 🔵 Phoneme-Coaching-Video Metadata Generator
**Solves:** Phase 5.2. 47 videos × ~7 metadata fields = 329 pieces of metadata. You will write 3 by hand and abandon it.

- **What it does:** Takes a video filename list + L1 profile data + phoneme inventory, generates: title, description, transcript stub, SEO tags, IPA, articulation summary, common L1-related struggles.
- **Output:** `/videos/metadata.json` ready to feed surfacing logic.
- **Frequency:** One-off after video batch uploaded. Rerun on additions.
- **Model:** Sonnet.

### 🟡 Lux Onboarding Module Drafter (Articulate 360 prep)
**Solves:** Phase 5.7 — ID portfolio piece.

- **What it does:** Reads current onboarding flow code + user journey data, drafts a 7-screen narrative arc for Articulate 360: slide titles, scripts, interaction types, success criteria.
- **Output:** `/portfolio/articulate-drafts/onboarding-module-<date>.md`.
- **Frequency:** One-off; rerun when onboarding UX changes materially.
- **Why it matters:** Gives the ID-path version of your portfolio something concrete to point at.

### 🟡 Diagnosis Engine Spec Writer
**Solves:** Phase 2.1. A routine that converts your scattered catalog notes into a proper technical spec.

- **What it does:** Reads `LUX_MASTER_IDEA_CATALOG.md` sections on diagnosis + L1 profiles, synthesizes into `/docs/specs/DIAGNOSIS_ENGINE_SPEC.md` with: problem statement, data requirements, algorithmic approach, API surface, test cases.
- **Frequency:** One-off; rerun quarterly.
- **Model:** Opus (genuine synthesis).

### 🟠 "Generate My Next Practice" Spec Writer
**Solves:** The roadmap item by name.

- **What it does:** Same pattern as above for the next-practice feature. Reads rollups + phoneme difficulty + scenario library, produces a full technical spec including UI flow, data sources, fallback behavior.
- **Output:** `/docs/specs/NEXT_PRACTICE_SPEC.md`.
- **Frequency:** One-off.

---

## 3. 🛡️ Content Protection

> Lux's most carefully engineered content is the stuff that bit-rots fastest when you're not looking. These routines are the bodyguards.

### 🔵 Scenario Four-Axis Neutrality Drift Watcher
**Solves:** Protects the locked Length/Emotion/CEFR/Perspective neutrality work on all 25 scenarios.

- **What it does:** Triggered on any commit touching `/scenarios/`. Re-runs the four-axis neutrality audit. If any scenario drifts beyond tolerance, opens a PR with proposed rewrite.
- **Output:** Drift log committed weekly to `/audits/scenario-drift/<date>.md`. PRs for outliers.
- **Frequency:** On-commit + weekly full-suite re-audit.
- **Why it matters:** The single routine that protects your most carefully engineered content. When Spanish scenarios ship in Phase 4, same routine runs against both languages.
- **Model:** Opus (qualitative judgment).

### 🔵 CEFR Alignment Verifier
**Solves:** Phase 2.7 CEFR transparency. The honest problem: you're not sure every passage and scenario is actually at the claimed level.

- **What it does:** Weekly, reads each passage/scenario, runs it through a CEFR classifier (call Anthropic API from within the routine for this). Compares declared vs. computed level.
- **Output:** `/audits/cefr-drift-<date>.md` listing anything that mismatches by more than one level.
- **Frequency:** Weekly.
- **Why it matters:** Converts "Lux has CEFR alignment" (assertion) into "Lux has continuously-verified CEFR alignment with weekly drift monitoring" (evidence). Second sentence wins interviews and sells to schools.
- **Model:** Sonnet (CEFR classification is well-defined).

### 🔵 Scenario → Role → Portrait Integrity Check
**Solves:** Part of the scenario system lock-in.

- **What it does:** Enumerates every scenario's roles, confirms every `${scenario.id}-${role.id}.jpg` exists in `public/assets/characters/`. Flags missing, misnamed, or orphan files.
- **Output:** Weekly issue if integrity broken.
- **Frequency:** Weekly.
- **Model:** Haiku (pure file existence check).

### 🔵 `passage_key` Fallback Scanner
**Solves:** The known bug class where code silently defaults to the rainbow passage.

- **What it does:** Grep for every code path that handles `passage_key` and ends in a silent fallback. Flag ones without explicit user notification.
- **Output:** Weekly issue.
- **Frequency:** Weekly.
- **Model:** Sonnet.

### 🟡 Voice Mirror Pipeline Trace
**Solves:** Voice Mirror is the crown-jewel feature; trace ensures no silent drift.

- **What it does:** Reads ElevenLabs IVC API → Supabase `voice_profiles` → TTS drawer playback end-to-end. Produces a current-state flow diagram with failure modes, retry logic, and latency budgets.
- **Output:** `/docs/voice-mirror-flow-<date>.md`.
- **Frequency:** Monthly, plus on-demand after Voice Mirror changes.
- **Model:** Opus (cross-file reasoning).

### 🟡 Prosody Dual-Home Drift Watcher
**Solves:** Ongoing debt from `/prosody/` vs `/core/prosody/`.

- **What it does:** Weekly diff between the two locations. Flag any function/file that diverged since last scan.
- **Output:** Weekly issue.
- **Frequency:** Weekly (until the refactor lands, then can be retired).
- **Model:** Sonnet.

### 🟠 Scenario CEFR Distribution Chart
**Solves:** Curriculum-balance self-check.

- **What it does:** Computes the CEFR distribution across all 25 scenarios (A2/B1/B2/C1 counts). Flags if distribution skews too heavily.
- **Output:** Monthly chart in `/audits/scenario-cefr-distribution-<date>.md`.
- **Frequency:** Monthly.

---

## 4. 📊 Performance & UX Canaries

### 🔵 2G/Slow-3G Waterfall Routine
**Solves:** Your saved instruction — "run Chrome DevTools Network tab with Slow 3G and 2G throttling simulated, for each major page."

- **What it does:** Weekly, spins up Playwright or headless Chrome. Loads each major Lux page under throttled network. Records LCP, TTI, TBT, waterfall JSON.
- **Output:** `/perf/2g-waterfall-<date>.json`. Issue if any page's TTI under 2G exceeds 8 seconds.
- **Frequency:** Weekly.
- **Why it matters:** ESL learners on classroom wifi and developing-country connections are your users. This is not a nice-to-have.
- **Model:** Sonnet (mechanical, defined output).

### 🔵 Lighthouse Regression Canary
**Solves:** Silent perf degradation.

- **What it does:** Daily hit against Vercel-deployed Lux. Runs Lighthouse headlessly. Stores scores in `/perf/lighthouse-<date>.json`. Opens issue if LCP/CLS/TBT regress more than 10% vs 7-day rolling average.
- **Frequency:** Daily.
- **Why it matters:** Given your Voice Mirror / ElevenLabs / Azure pipeline, this catches latency creep before users do.
- **Model:** Sonnet.

### 🔵 Accessibility Sweep
**Solves:** Ongoing → Accessibility + legal risk for school sales.

- **What it does:** Monthly, runs axe-core or similar via headless browser against every Lux page. Ranks violations by severity. Opens issues for any new violations since last month.
- **Output:** `/a11y/<date>.md` + new-violation issues.
- **Frequency:** Monthly.
- **Why it matters:** Districts will ask if you're WCAG 2.1 AA compliant. "Yes, and we run monthly automated audits with tracked remediation" is a *much* better answer than "yes."
- **Model:** Sonnet.

### 🟡 Native-Title Audit (one-off)
**Solves:** Your saved "Full audit needed, suspected in multiple places" task.

- **What it does:** Greps the repo for `title=` in HTML template strings and `setAttribute('title', ...)` in JS. Classifies each hit: (a) accessibility-required — keep, (b) hover hint — replace with `lux-popover`, (c) dev comment / unused — delete.
- **Output:** `/audits/native-title-audit-<date>.md` with prioritized replacement list.
- **Frequency:** One-off.
- **Model:** Sonnet.

---

## 5. 💼 Business & Ops

### 🔵 "Am I Cash-Positive?" Weekly Email
**Solves:** Phase 7.3. You will never build the dashboard. You will read the email.

- **What it does:** Reads manually-maintained `/finance/costs.md` (fixed costs) + API usage dumps dropped in `/finance/usage/` + Stripe via MCP (once added). Computes fixed burn, variable burn, revenue, delta.
- **Output:** `/finance/weekly-<date>.md` committed + one-line email: "April week 2: –$287 (burn rate OK, no action needed)."
- **Frequency:** Weekly.
- **Model:** Haiku (simple arithmetic + formatting).

### 🔵 Mark-as-Coach Session Intake & Note Routine
**Solves:** Phase 2.5 + Observation #13. Turns every coaching session into product research.

- **What it does:** Triggered on Calendar event ending with "coaching." Reads a free-form note file you drop in `/coaching/<date>-raw.md` right after the session. Structures it into `/coaching/<date>-structured.md` with fields: student L1, trouble phonemes, feature gaps observed, product ideas generated.
- **Companion monthly aggregator routine:** reads all structured notes, opens issues on `lux-frontend` for recurring gap themes.
- **Frequency:** Event-triggered + monthly aggregation.
- **Why it matters:** Every coaching session becomes product research without requiring you to remember to make it so.
- **Model:** Sonnet for structuring, Opus for the monthly aggregation.

### 🟡 Lux Onboarding UX Trace
**Solves:** Known bugs / dead branches in the 5-prompt Voice Mirror onboarding modal.

- **What it does:** Walks the onboarding modal code end-to-end. Flags dead branches, missing error states, interaction patterns with no exit condition.
- **Output:** Monthly issue.
- **Frequency:** Monthly, plus on-demand after onboarding changes.

---

## 6. ⚠️ Lux-Specific Traps — Do Not Automate

> Every item below is a token-waste if you try to routine it. **Read this list before adding a new Lux routine.**

| Item | Why it's a trap |
|---|---|
| **Save Progress fix (Phase 1.1)** | Production bug. Needs hands on keyboard + Supabase write-path test environment. A routine can *draft* a fix; you must drive the merge. |
| **WaveSurfer TTS waveform bug (1.1)** | In-browser runtime bug. Routine can't reproduce the rendering condition. |
| **AI Coach system message overhaul (2.4)** | Needs human judgment against lived user experience. Zero real users today means zero signal to tune against. Premature automation makes the Coach *worse*. Revisit after 50+ real users. |
| **Dynamic conversation text encoding (3.4.1) — the encoding itself** | Feature, not a routine. Routine can prep the data (see Word Difficulty Rank Table above) but the encoding happens in-browser at render time. |
| **Voice cloning (6.1)** | Needs Azure licensing, per-user consent, real-time generation. Wrong architectural layer. |
| **Real-time feedback timing (3.5)** | In-session UX decision. |
| **Any routine that writes to `voice_profiles`, `user_progress`, or any Supabase user table.** | **The blast radius rule.** Routines should *read* your data, not *write* to it. A broken routine writing user data at 2 AM is career-ending. |
| **AI Coach prompt-tuning loop** | Same as overhaul — no signal until real users. |
| **Emotional/psychological dimension work** | Human-judgment territory. |
| **Button animations / UX polish / aesthetic decisions** | Design work. |

### The Lux-specific rule

> **Routines can read your data. Routines can write to files, issues, and PRs. Routines should not write to the production database tables that serve users.**

### When Life Mode ever unblocks (Phase 6.13 / 7.7)

Noting here, because you spec'd the architecture: Life Mode's overnight character-sheet update IS routine-shaped when the time comes. The overnight digest part — reading yesterday's transcripts, updating a canonical character sheet — is a clean routine fit. The in-session narrator part is not. You'd build Life Mode as **one routine + one in-session UI**, not a bespoke agent stack.

Not a build target now. Just pattern-matched for when 7.7 unblocks.

---

## 7. 🗂️ Suggested Starter Order (when adding from this file)

Once the generic 4 from the Backlog are running (see PLAYBOOK's 2-week plan), the high-impact Lux-specific adds in order:

1. **Harvard Sentences Phoneme-Density Index** (one-off, unblocks future features)
2. **CEFR Alignment Verifier** (weekly, highest-signal content protection)
3. **L1 Profile Research Routine** (weekly × 15 wks, builds data library)
4. **2G Waterfall** (weekly, catches perf creep)
5. **Scenario Four-Axis Drift Watcher** (weekly, protects locked content)
6. **"Am I Cash-Positive?" Email** (weekly, keeps you honest)

Everything else waits in the queue until slots open.

---

## ➕ How to Add a New Entry

```
### [priority emoji] **Name**
**Solves:** [which catalog phase or item]

- **What it does:** ...
- **Output:** ...
- **Frequency:** ...
- **Why it matters:** ... (only if non-obvious)
- **Depends on:** ... (only if upstream data layer required)
- **Model:** Opus / Sonnet / Haiku (with brief reason)
```

**Rules:**
1. Every entry must trace back to a specific item in `LUX_MASTER_IDEA_CATALOG.md`.
2. If it's a generic pattern, it goes in the Backlog instead.
3. If it writes to production Supabase user tables → Traps section, not a routine.
4. Include the `Solves:` line or the entry goes in Parking Lot below.

---

## 🅿️ Parking Lot (Lux ideas not yet categorized)

> Dump here first. Sort into sections later.

- 💡 [new Lux idea goes here]

---

## 📌 Notes

- This file is tightly coupled to `LUX_MASTER_IDEA_CATALOG.md`. When you update the catalog, swing by here.
- If the catalog is reorganized, prefer to match this file's section order to the catalog's phase order for easier cross-referencing.
- Every 🔵 on this list has downstream value for either product, portfolio, or path-to-cash-positive. None of it is code-health-only — that's what the generic Backlog is for.