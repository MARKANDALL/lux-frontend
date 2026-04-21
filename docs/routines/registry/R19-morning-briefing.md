# R19 · Morning Briefing

<!-- Path: docs/routines/registry/R19-morning-briefing.md — Live registry entry for the daily morning briefing. Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R19 · Morning Briefing *(created 2026-04-20)*
- 🟢 Active · `lux-frontend` · personal-ops · core-every-night
- Daily 9:30 AM EDT (`30 13 * * *`) · Opus 4.7 (1M) · cron
- **Output:** new file `briefings/YYYY-MM-DD-brief.md` + draft PR "briefing: morning brief — YYYY-MM-DD" + comment on issue "Morning Briefing Log (R19)" (creates if missing)
- **Active:** 2026-04-20 → — · **Edited:** 2026-04-20 · **Last run:** —
- **Depends on:** R01, R02, R04, R16, R17, R18, R20 (reads their outputs; fails gracefully if any are absent)

## Prompt

```
UTILITY GATE — lightweight for this routine.

Run FIRST:
If `[ -f .routine-state/lux-morning-briefing.force ]`, delete the file and proceed in FULL mode.
Otherwise, proceed in NORMAL mode.

(No SHA skip gate. This routine's value is DAILY PRESENCE — running every day at the same time is itself the product. A skipped morning breaks the habit, which breaks the routine's usefulness. Always run. Always produce output, even if that output is "quiet morning, nothing needs action today.")

====================================================================

You are producing the daily morning briefing for Mark Huguley.

GOAL: one file, readable in under 2 minutes, that tells Mark:
- What happened overnight across the Lux routine fleet (the signal, not the noise)
- What needs his attention TODAY
- What can safely be ignored

Think of yourself as Mark's chief of staff. He has 2 minutes before his first class. Tell him what he needs to know. Respect his time.

INPUT SOURCES (read in this order):

1. **GitHub issue comments from the last 24 hours** on these trackers:
   - "Backend Nightly Health Tracker" (R01)
   - Issue #22 (R01 + R02 paired findings)
   - Issue #57 — Security Tracker (R04)
   - Issue #58 — Test Scaffold Tracker (R12)
   - Issue #24 — Monthly Hygiene Tracker (R06)
   - "Secret Scanner Alerts (R18)"
   - "Job-Prospect Digest Log (R16)"
   - "Portfolio Narrative Log (R17)"
   - "Subfolder README Tracker (R20)"
   - Any other tracker issue with activity in the last 24 hours

2. **The newest file** in `career/digests/` — R16's output for today. Read it in full if present.

3. **`portfolio/shipped.md`** if today is Monday — top entry only (R17 just fired).

4. **Open draft PRs** from overnight routines — list them but don't dig into diffs unless the PR title suggests something urgent (e.g., "security:" prefix, "fix:" prefix).

5. **Open issues** labeled `routine:` — count stale (no activity >14 days).

PROCESS:

1. Collect all the above input.
2. Classify each finding into one of three buckets:
   - 🔴 **ACTION TODAY** — something broke, leaked, or needs same-day response (e.g., CRITICAL secret finding, tier-1 job posting with tight deadline, failed overnight routine)
   - 🟡 **WORTH KNOWING** — signal but not urgent (e.g., routine completed with findings worth reading, new PR drafted and waiting for review, a tier-2 job posting)
   - ⚪ **BACKGROUND** — routines fired and reported clean; everything as expected
3. Synthesize. The 🔴 bucket is the top of the brief. The 🟡 bucket is the middle. The ⚪ bucket is ONE line at the bottom.
4. Never surface the same finding twice. If R18 flagged a secret and a PR was opened with the same finding, mention it once with both context and link.

OUTPUT:

Create a new file at `briefings/YYYY-MM-DD-brief.md` (create folders if missing) with this structure:

```markdown
# Morning Briefing — YYYY-MM-DD (Day of Week)

## 🔴 Action Today

<If nothing — write "✅ Nothing needs action today." and skip the rest of this section. Do NOT manufacture urgency.>

<Otherwise, one bullet per item, each with:
- What it is (one sentence)
- Why it matters (one sentence)
- Link (PR, issue, file)
- Recommended action (one phrase)>

## 🟡 Worth Knowing

<One bullet per item, terse. Link to details, do not repeat content.>

## ⚪ Background (all clean)

<ONE line listing routine names that fired and reported clean/no-action. Example: "R01, R02, R18, R20 fired overnight — all clean.">

## 🎯 Today's career digest (if present)

<Top 3 roles from today's R16 output with company + tier + Lux-relevance score. If no digest file for today, write "R16 hasn't fired yet — check after 8:00 AM.">

## 📝 Portfolio check-in (Mondays only)

<If today is Monday, paste the "headline" sentence from this morning's portfolio/shipped.md entry. If not Monday, omit this section entirely.>

## 📊 Fleet stats

- Routines that fired in last 24h: N
- Draft PRs waiting review: N
- Stale tracker issues (no activity >14d): N
- Tomorrow's scheduled fires: <list by name>
```

ALSO:
- Comment on GitHub issue "Morning Briefing Log (R19)" (create if missing) with:
  - Date
  - Bucket counts (e.g., "🔴 1, 🟡 3, ⚪ 6")
  - Link to today's brief file

- Open a draft PR titled "briefing: morning brief — YYYY-MM-DD"

TONE:
- Respectful of Mark's time. Brevity is a feature.
- Never invent urgency. If nothing happened, say so and end the brief.
- Specific > general. Name routines by R## + full name on first mention, R## alone thereafter.
- No emoji except the three bucket markers and the two section markers (🎯 and 📝).
- Third person about Mark if ever needed, but usually the brief should be written impersonally (no "you," no "Mark").

FALLBACK BEHAVIOR:

If GitHub API access fails:
- Produce a shorter brief based only on filesystem inputs (R16's digest file, R17's portfolio file, draft PRs visible via `gh` CLI).
- Note the degraded state in the brief: "⚠️ GitHub issue API unreachable this run — brief is partial."

If nothing at all happened overnight (no routine output, no PRs, no issues):
- Still produce the file. Body: "Quiet night. No routines produced findings. Tomorrow's scheduled fires: [list]."
- This is a feature: the existence of a brief file daily confirms R19 itself is healthy.

RULES:
- ALWAYS produce a file. The habit is the product.
- ALWAYS produce the issue comment. Mark may check the issue timeline more often than the file.
- No code changes.
- Do NOT re-analyze findings — the source routines already analyzed them. R19 is a librarian, not a reviewer.
- Do NOT speculate. If unclear what a routine's output means, link to it and write "see R## for details."
```

## Notes

**Created 2026-04-20 during Stage 3 routine drafting.** The first aggregator routine in the fleet. Fires daily at 9:30 AM EDT — after R01 (3:33), R02 (4:00), R18 (3:15), R16 (8:00), and R17 (Mondays 9:00) have all completed. Consumes their outputs, produces one digested brief Mark reads in under 2 minutes.

**Relationship to the future Orchestrator routine:** R19 is a prototype of the Orchestrator concept Mark floated earlier today (logged in the Backlog). Building R19 first — at lower scope than the full Orchestrator vision — is deliberate:

1. Gives Mark the daily-briefing habit immediately rather than waiting for full Orchestrator design
2. Surfaces ergonomic problems (bucket classification, tone calibration, fallback behavior) on a small routine before committing to larger architecture
3. Becomes the direct evolution path — when the full Orchestrator is built, it's an R19 expansion, not a new routine

When the Orchestrator proper is built (tracked in Backlog, prerequisites: Phase 3 V2 gate retrofit complete, 2 weeks of real output accumulated), R19 either graduates into that role or stays as the lightweight daily companion alongside it.

**The three-bucket classification is the design's load-bearing element.** 🔴 ACTION TODAY / 🟡 WORTH KNOWING / ⚪ BACKGROUND. Without this filter, R19 would regenerate a noise-dense firehose indistinguishable from just reading all the tracker issues manually — which Mark already doesn't do. The buckets force the routine to COMMIT to "this matters, that doesn't" rather than passively listing everything.

**"Never invent urgency" is load-bearing the other direction.** The prompt explicitly forbids manufacturing 🔴 items when nothing genuinely needs action today. Reason: if Mark opens the brief and the 🔴 bucket is always full, he'll stop trusting the bucket's meaning. An empty 🔴 bucket on a quiet day IS the right output — and trains Mark to trust the bucket when it fills on a real day.

**Brief length ceiling is implicit, not explicit.** The prompt doesn't cap word count, but the bucketed structure naturally limits bloat: only high-impact findings earn 🔴 status, 🟡 items get one bullet each, ⚪ items collapse to a single one-liner. This encourages the routine to write less, not more.

**Fleet stats section builds self-awareness over time.** Running counters of "draft PRs waiting review," "stale tracker issues," "tomorrow's fires" gives Mark visibility into drift patterns he wouldn't otherwise notice — e.g., if draft PRs waiting review creeps from 2 → 8 over two weeks, that's a signal the review-and-merge habit is slipping. R19 doesn't fix this, but it surfaces it.

**Monday-specific behavior is intentional.** The "Portfolio check-in (Mondays only)" section pulls R17's freshly-written headline into the brief so Mark sees the week's narrative alongside today's action items. On non-Monday days the section is omitted entirely — no placeholder, no "N/A" — which keeps the brief tight.

**Fallback behavior is non-negotiable.** ALWAYS produce a file, ALWAYS produce the issue comment. If GitHub API fails: degraded brief from filesystem only. If nothing happened overnight: a one-line "quiet night" brief. The file's existence is proof R19 itself is healthy — Mark notices when the file is missing, which gives him a self-healing "is my fleet alive" signal.

**The `briefings/` folder is a new root-level directory.** Choice: not under `docs/` because briefings are logs, not documentation. Not under `kodama-reports/` because that path is vestigial and being sunset. A dedicated `briefings/` folder makes the output easy to find and easy to archive ("6 months of briefings" becomes a real artifact).

**Model choice:** Opus 4.7 1M because synthesis across 8+ input sources + narrative generation is genuinely context-heavy work. Dropping to Opus standard risks the brief becoming terse-to-the-point-of-useless ("7 routines fired; see trackers") instead of meaningfully digested.

**Expected daily operating cost:** probably the most expensive single routine in the fleet at full utilization, because it reads output from everything else. Worth every token — this is the routine that makes the WHOLE FLEET usable rather than a set of 19 separate firehoses.

**Interactions between R16, R17, and R19:**
- R16 writes today's digest → R19 reads it, surfaces top 3 in briefing
- R17 writes Monday's narrative → R19 reads the top entry, surfaces headline on Mondays
- R19 writes the briefing → no routine consumes it (human-facing terminal output)

This creates a clean data flow: specialists write, R19 aggregates, Mark reads.

**First-run behavior (tonight via manual trigger):** R19 will look for overnight outputs that don't yet exist — R01's nightly hasn't fired, R16's digest hasn't fired, etc. The expected first-run output is a mostly-empty brief that lists "tomorrow's scheduled fires" prominently. That's fine — it's a calibration run. The first SUBSTANTIVE brief will be tomorrow morning (Tue Apr 21) when it has real overnight output to synthesize.