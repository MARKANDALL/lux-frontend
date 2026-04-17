# CLAUDE_ROUTINES_PLAYBOOK.md
<!-- Path: docs/routines/CLAUDE_ROUTINES_PLAYBOOK.md — Strategy, cost math, architectural patterns, and traps for maximizing Claude Code Routines. Re-read monthly. -->

> **Part of a 3-file system:**
> - `CLAUDE_ROUTINES_BACKLOG.md` — generic routine ideas (universal patterns)
> - **This file** — the HOW and WHY-NOT
> - `LUX_ROUTINES_FROM_CATALOG.md` — Lux-catalog-derived routines
>
> **When to re-read this file:**
> - Before adding more than 2 routines in a week
> - When the $100 credit (or any future credit) is burning faster than expected
> - When you're tempted to automate something you shouldn't
> - Monthly, as a calibration ritual

---

## 1. The Reframe

Most people think of Routines as *"things that scan my code."* That's where almost everyone starts and stops. What Routines actually are:

> **A cron job that can read, think, decide, write, and talk to other systems.**

That's it. The prompt is the only fixed thing. Everything else — what "work" means, what "useful output" looks like — is wide open.

**The question is not "what else can I audit?"** It's:

> *"What repetitive intelligent work do I currently do manually — or don't do at all because I don't have time?"*

Once you internalize that, 85% of the surface area opens up. Business intel. Career prospecting. Grant hunting. Morning briefs. Portfolio narration. Content drift protection. Data pipeline prep. **None of this is "scan my code."**

---

## 2. Budget Reality

> ⚠️ **These are directional estimates, not guaranteed numbers.** Anthropic's pricing and Claude's per-request token usage both evolve. Treat the table below as a calibration tool and verify against your actual usage dashboard monthly.

Rough cost-per-run (a typical routine scanning ~30k tokens of context, producing a ~2k-token output):

| Model | Approx. cost per run | Relative to Opus |
|---|---|---|
| Opus 4.6 | ~$0.30–$1.50 | 100% |
| Sonnet 4.6 | ~$0.12–$0.60 | ~40% |
| Haiku 4.5 | ~$0.05–$0.25 | ~15% |

**What this means for you:** running all 9 current routines on Opus 4.6 is overkill on at least 5 of them, and that overkill is what's quietly draining the $100 credit before May 1.

**The rule:**
- **Opus** — when reasoning has to span many files, when the output shape is unknown, when a wrong answer is expensive.
- **Sonnet** — default for coding, pattern-matching, scans with a defined output shape.
- **Haiku** — mechanical work, quick categorization, simple file generation.

---

## 3. The Opus → Sonnet Downgrade Table

Do this before adding a single new routine. ~20 minutes of UI work, saves ~60% of your budget.

| # | Routine | Current | Recommended | Rationale |
|---|---|---|---|---|
| 1 | Health scan | Opus | **Opus** ✓ | Cross-file reasoning, unknown output shape — worth it |
| 2 | Architecture audit | Opus | **Opus** ✓ | Deep reasoning, qualitative judgment — worth it |
| 3 | Hygiene sweep | Opus | **Sonnet** ⬇ | Mechanical patterns, defined output shape |
| 4 | Deploy smoke test | Opus | **Sonnet** ⬇ | Pass/fail checks — Haiku would also work |
| 5 | Deep code review | Opus | **Opus** ✓ | Qualitative, holistic — worth it |
| 6 | `.env.example` generator | Opus | **Sonnet** ⬇ | Purely mechanical diff-and-write |
| 7 | ARCHITECTURE.md rewrite | Opus | **Opus** ✓ | Qualitative, cross-cutting narrative |
| 8 | Test scaffold generator | Opus | **Sonnet** ⬇ | Pattern-based generation |
| 9 | Dep vulnerability scan | Opus | **Sonnet** ⬇ | Mostly parsing `npm audit` output |

**Net:** 5 routines moved off Opus. Same work, ~60% less cost, budget freed for new routines from the Backlog and Lux-from-catalog files.

---

## 4. Architectural Patterns

The Routines feature is new. The patterns below are what the top 5% of users are already doing. Adopt them early.

### 4.1 Orchestrator → Specialist

Instead of 15 fixed routines, run **1 orchestrator** that reads a task queue (files in `/queue/pending/` in the repo), decides what runs today, and triggers specialist routines via webhook.

Pay-off: you go from "9 static routines" to "1 orchestrator + N on-demand specialists." Your active-slot pressure drops dramatically because most specialists are triggered, not scheduled.

### 4.2 Opus-Plans, Sonnet-Executes (two-routine chain)

For any refactor that spans many files:
1. **Routine A (Opus, weekly):** reads the target area, writes a plan as a GitHub issue. Deep reasoning pays off here.
2. **Routine B (Sonnet, next-night trigger):** reads the issue, executes from the plan, opens a draft PR.

Applies directly to your upcoming prosody dual-home cleanup (`/prosody/` vs `/core/prosody/`). Saves ~2 hours of your time; costs ~20 minutes of review.

### 4.3 Triage → Fix → PR loop

Your nightly health scan already triages. Add the companion: a second routine fires 30 min later, reads the new issue, attempts a fix on a branch, opens a draft PR, tags you.

For your class of bug (missing endpoints, wrong paths, silent catches), draft-PR routines nail it on the first try more often than not. You review; you don't rewrite.

### 4.4 "Grill Me" adversarial reviewer

Triggered on every PR you open. Opus plays a staff engineer and tries to break your reasoning before merge.

Two outputs from one routine: (a) better PRs, (b) the closest thing to FDE-technical-screen practice you can get without an interviewer. Doing this daily against your own code for a month beats any LeetCode grind.

### 4.5 Webhook triggers, not just cron

Routines Tier-3 feature. Any external system can fire a routine:
- Vercel deploy success → smoke test
- GitHub issue labeled `bug` → fix-attempt routine
- Supabase row inserted in `leads` table → prospect enrichment
- Error monitoring detects 5xx spike → stack-trace-to-fix routine

This is where routines stop being *scheduled* and become a **reactive nervous system**.

### 4.6 File-based state, not conversation history

Conversation history gets compacted. Files persist. Every routine should commit a structured JSON/MD artifact, not just open an issue.

- The **issue is the notification.**
- The **file is the memory.**

Over time, the files become your data layer — a filesystem-as-database that future routines can read from. This is the seed of the "Lux Intelligence Lake" in the roadmap.

### 4.7 Idempotent + resumable

Every routine should start with: *"check if I already did today's run by reading `/runs/<routine>/<date>.json`. If so, exit."*

Otherwise a double-fire wastes tokens and creates duplicate issues. Simple rule, easy to forget, expensive when you forget.

---

## 5. 🚨 The Traps — What Looks Like a Routine But Isn't

> **This section is the most valuable part of this document.** Every entry here is a token-waste if you try to automate it. Re-read before adding anything new.

Routines are **bad at:**
1. **In-session user-facing features.** Life Mode's overnight narrator is not a routine; it's an agent architecture. If users interact with the output in real-time, it's not a routine.
2. **Anything requiring production database writes you haven't sandboxed.** The blast radius of a broken routine writing to `voice_profiles` or `user_progress` at 2 AM is career-ending for the product.
3. **Anything where "being wrong" degrades a live user experience.** Live AI Coach system-prompt tuning, real-time feedback timing, on-the-fly UX decisions.

### Specific traps from the Lux catalog

| Item | Why it's a trap |
|---|---|
| Save Progress fix (1.1) | Production bug in live code; needs hands-on debugging with Supabase write path. Routine can *draft* a fix but you must drive the merge. |
| WaveSurfer TTS waveform bug (1.1) | In-browser runtime bug. Routine can't reproduce it. |
| AI Coach system message overhaul (2.4) | Needs human judgment against lived user experience. Premature automation here makes the Coach *worse*. Revisit after 50+ real users. |
| Dynamic conversation text encoding (3.4.1) | Feature, not a routine. Routine can prep the data (word-difficulty ranks, CEFR tags); encoding happens in-browser at render time. |
| Voice cloning (6.1) | Needs Azure licensing, user consent, real-time per-recording generation. Wrong part of the architecture. |
| Real-time feedback timing (3.5) | In-session UX decision. |
| **Anything writing to production Supabase user tables.** | The blast radius rule. Routines should *read* your data, not *write* to it. |

### General traps

- **UX polish, button animations, emotional/psychological dimension work** — human-judgment territory.
- **Teacher-facing product design, Spanish-version pedagogy, mobile app build** — design and domain-expert work, not cron-schedulable.
- **Anything that needs "vibes" to evaluate** — if you can't write the success criteria as a checkable assertion, a routine will produce noise.

**The test:** if *"a wrong answer at 2 AM with no human in the loop"* is an acceptable outcome, routine is fine. If it isn't, keep it manual.

---

## 6. 2-Week Execution Plan

> Don't build all 15 ideas at once. Build the 4 that compound.

### Week 1

**Day 1 (20 min):** Run the Opus→Sonnet downgrade table above. This is ~60% of your remaining budget recovered before you add anything.

**Day 2 (30 min):** Add the **Morning Briefing routine** (see Backlog → Personal Ops). Touches everything else — once you have the morning brief reading your other routines' overnight output, the system starts feeling like a system.

**Day 3 (45 min):** Add the **Career-Search Daily** (see Backlog → Career Pivot). Highest career-pivot ROI per dollar spent. Produces compounding value starting day one.

**Day 4–5:** Let them run. Do not add more. Observe. Tune.

### Week 2

**Day 8 (1 hr):** Add the **Competitor Watcher + Grants Scanner pair** (see Backlog → Business & Pipeline Intel). Both weekly, both cheap, both building a moat while you sleep.

**Day 9–10:** Observe. Start tuning. Kill anything producing noise-only.

**Day 11–14:** Pick one high-🔵 from `LUX_ROUTINES_FROM_CATALOG.md` — recommend the **Harvard Sentences Phoneme-Density Index** (one-off, unblocks the "Generate my next practice" feature).

**Budget check at end of week 2:** you've added 4 recurring routines + 1 one-off. With the downgrades, total spend should be comparable to or below your pre-downgrade 9-routine baseline.

---

## 7. The Principle Under All Of This

Every hour you spend doing something repetitive in April is an hour you're not spending on Lux, on applications, or on Shreya.

Routines aren't a coding feature. They're a **time-arbitrage feature.**

The $100 isn't a code budget. It's a **"buy back my evenings" budget.**

Spend it accordingly.

---

## 📎 Appendix A — Decision Tree: Should This Be a Routine?

```
Is it repetitive?
├─ No → Don't automate. Do it once.
└─ Yes
    │
    ├─ Does it involve production user-data writes?
    │   └─ Yes → TRAP. Keep manual.
    │
    ├─ Does a wrong answer at 2 AM hurt users or the product?
    │   └─ Yes → TRAP. Keep manual or needs human-in-loop design.
    │
    ├─ Can the output be a file, an issue, or a PR?
    │   ├─ Yes → Good routine candidate.
    │   └─ No → Probably not a routine; think again.
    │
    └─ Can I write the success criteria as checkable assertions?
        ├─ Yes → Go. Use Sonnet unless genuinely reasoning-heavy.
        └─ No → It'll produce noise. Skip or redesign.
```

---

## 📎 Appendix B — New Pattern Intake

When you discover a new pattern (from blog posts, other users, your own experiments), log it below with: what it does, why it's interesting, what category of catalog item it unlocks.

- [new pattern observation here]