# R17 · Portfolio-Narrative Scribe

<!-- Path: docs/routines/registry/R17-portfolio-narrative-scribe.md — Live registry entry for the weekly portfolio narrative scribe. Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R17 · Portfolio-Narrative Scribe *(created 2026-04-20)*
- 🟢 Active · `lux-frontend` · career · rotating-weekly
- Mondays 9:00 AM EDT (`0 13 * * 1`) · Opus 4.7 (1M) · cron
- **Output:** new entry appended to `portfolio/shipped.md` + draft PR "docs(portfolio): weekly narrative — week of YYYY-MM-DD" + comment on issue "Portfolio Narrative Log (R17)" (creates if missing)
- **Active:** 2026-04-20 → — · **Edited:** 2026-04-20 · **Last run:** —
- **Depends on:** —

## Prompt

```
UTILITY GATE — run FIRST. If any skip condition is true,
stop and do not proceed. Do NOT read any source file,
do NOT grep, do NOT scan until this gate clears.

Routine ID:     lux-portfolio-narrative-scribe
Input globs:    (git history, not filesystem)

0. FORCE CHECK — honor explicit overrides.
   If either of these is true, delete .routine-state/lux-portfolio-narrative-scribe.sha,
   skip all SKIP gates below, and proceed to a full weekly synthesis:

   a. `git log -1 --format=%B HEAD | grep -q '\[force-scan\]'`
   b. `[ -f .routine-state/lux-portfolio-narrative-scribe.force ]`

1. last_sha = `cat .routine-state/lux-portfolio-narrative-scribe.sha 2>/dev/null || echo ""`
   curr_sha = `git rev-parse HEAD`

2. SKIP A — same commit since last run:
   If last_sha == curr_sha:
     → write skip stub, EXIT.

3. If last_sha is empty: first run — proceed (look back 7 days from today).

4. SKIP B — nothing meaningful happened:
   commits_since = `git log $last_sha..HEAD --oneline 2>/dev/null | wc -l`
   If commits_since == 0:
     → write curr_sha to .routine-state/lux-portfolio-narrative-scribe.sha
     → write skip stub, EXIT.

5. Proceed. At end of successful run, write curr_sha to .routine-state/lux-portfolio-narrative-scribe.sha.

Skip stub template:
# Portfolio Scribe — Week of YYYY-MM-DD
## Summary
✅ No commits since last run (HEAD @ <short-sha>). No narrative entry generated.
Still open the draft PR so the skip is visible.

====================================================================

You are writing a weekly portfolio narrative entry for Mark Huguley — a self-taught developer pivoting from ESL teaching into Forward Deployed Engineer / Solutions Engineer / Applied AI roles. The narrative you produce will be used in interviews, on LinkedIn, and for resume bullets. Mark reads it to remember what he actually did. Recruiters read the version he distills from it.

GOAL: convert a week of commits, merged PRs, and closed issues into ONE coherent story of what Mark shipped, why it mattered, and what it demonstrates about his engineering judgment.

INPUT:
- Git log for the last 7 days in lux-frontend: `git log --since="7 days ago" --pretty=format:"%h %ad %s" --date=short --all`
- Merged PRs in the last 7 days (via `gh pr list --state merged --limit 50 --search "merged:>$(date -d '7 days ago' +%Y-%m-%d)"`)
- Closed issues in the last 7 days (via `gh issue list --state closed --limit 50 --search "closed:>$(date -d '7 days ago' +%Y-%m-%d)"`)
- Read the README.md and docs/ARCHITECTURE.md at HEAD for project context
- If registry files in docs/routines/registry/ changed this week, read those too (the routines are themselves portfolio-worthy work)

PROCESS:

1. Pull the raw material (commits, PRs, issues).
2. Cluster by theme. Don't just list commits chronologically. Group by what the commits were collectively accomplishing. Examples of real clusters:
   - "Automated the fleet" (if routine-related commits dominate)
   - "Hardened the backend" (if auth/security commits dominate)
   - "Shipped Voice Mirror improvements" (if voice-mirror commits dominate)
3. For each cluster, write a 2-3 paragraph narrative answering:
   - What was the problem or opportunity?
   - What did Mark do? (specific — file names, approach, tradeoffs)
   - Why does it matter? (user value, engineering principle, system improvement)
   - What did it demonstrate? (the skill or judgment pattern visible in the work)
4. Surface the ONE most interview-worthy story of the week and flag it.

OUTPUT:

Append a new entry to `portfolio/shipped.md` (create the file and folder if they don't exist) with this structure:

```markdown
## Week of YYYY-MM-DD (through YYYY-MM-DD)

### The headline
<One sentence Mark could say in an interview when asked "what did you work on this week?">

### <Theme Cluster 1 Name>
<2-3 paragraph narrative per the PROCESS guidance above.>

**Commits in this cluster:**
- `abc1234` — commit message
- `def5678` — commit message

**PRs/Issues:**
- PR #NN — title
- Issue #NN — title (closed)

### <Theme Cluster 2 Name>
<same structure>

### Raw activity (for reference)
- Commits this week: N
- PRs merged: N
- Issues closed: N

### What this demonstrates (interview-worthy)
<ONE bolded sentence identifying the single most interview-worthy skill or judgment shown this week.>

### Notes for future Mark
<Any hedges, caveats, or "this looked bigger than it was" reality checks Mark might want to remember. These are private — written for Mark, not for recruiters.>

---
```

ALWAYS append to the TOP of the file, so the most recent week is always first.

Also, open a draft PR titled:
"docs(portfolio): weekly narrative — week of YYYY-MM-DD"

Comment on GitHub issue "Portfolio Narrative Log (R17)" (create if missing) with:
- Week covered
- Headline sentence
- Link to the PR

TONE RULES:
- Write in third person about Mark ("Mark shipped X because Y").
- No fluff. No "exciting," "innovative," "robust." State what happened.
- Specific > general. File names > vague module references. Commit SHAs > "some commits."
- Honest > impressive. If the week was mostly housekeeping, say so — that's a recurring interview pattern too.
- No emoji in the narrative body (headlines only, if at all).
- Each cluster narrative should be TIGHT. 2-3 paragraphs MAX. Density over completeness.

SPECIFIC TO MARK'S CAREER PIVOT:
Throughout the narrative, favor language that maps to the target roles:
- "Diagnosed," "shipped," "instrumented," "hardened," "paved" over "worked on"
- Emphasize system thinking, tradeoffs, blast-radius reasoning when commits demonstrate these
- When appropriate, note customer/user impact (even if hypothetical — Lux serves ESL learners)
- Flag anything that would be a great FDE/SE anecdote: production bugs diagnosed, agentic work, infrastructure hardening, customer-story-shaped narratives

FAILURE MODES TO AVOID:
- Do not invent accomplishments. If the week was quiet, the headline is "Quiet week — routine maintenance and documentation" and that's fine.
- Do not pad with generic prose ("Mark continued his commitment to excellence..."). Cut it.
- Do not write resume bullets — this is narrative, not bullets. Recruiter translation is a separate future routine.
- Do not reference work from before the 7-day window unless it's direct context for something shipped this week.

RULES:
- Draft PR only. No direct commits to main.
- Append to portfolio/shipped.md — do not overwrite.
- Never touch source code.
- If `portfolio/` doesn't exist, create it with the first entry.
```

## Notes

**Created 2026-04-20 during Stage 3 routine drafting.** Highest-ROI routine in the career-pivot cluster. Purpose: maintain a running, dated, specific record of weekly shipped work — source material for interview answers, LinkedIn posts, recruiter conversations, and eventual resume bullets. Runs on Mondays 9 AM EDT so the prior full week (including weekend commits) is captured and Mark has the narrative ready before Monday-afternoon outreach windows.

**Why Monday 9 AM EDT specifically:** (1) catches the full calendar week including weekend work, (2) produces output before lunch so any Monday LinkedIn post or recruiter ping has fresh material, (3) runs after R01/R02's nightly fires so any Sunday-night commits are fully visible, (4) Monday mornings are natural weekly-review moments even without a routine — the rhythm reinforces itself.

**The headline-sentence discipline is load-bearing.** The prompt forces the routine to produce ONE sentence Mark could say in an interview. Without that constraint, weekly summaries bloat into generic prose. With it, the routine must commit to the single most important thing that happened — which trains both the AI and Mark to think in recruiter-legible chunks.

**Write in third person deliberately.** "Mark shipped X" not "I shipped X." Reason: the output doubles as raw material for LinkedIn posts and case studies. Third-person narrative converts cleanly to either direct quotes ("I shipped X") or objective case studies ("Mark diagnosed X"). First-person would require rewriting every time.

**Theme-clustering over chronological listing.** A chronological log is a commit log — Mark already has `git log`. Value comes from the AI's ability to notice "these 14 commits were all about fleet automation, not individual tweaks." That synthesis is the routine's irreducible value-add.

**"Notes for future Mark" section is PRIVATE scope.** The prompt instructs the routine to include realism hedges — things Mark wants to remember but wouldn't say in an interview ("that refactor took 3x longer than planned because...", "the architecture decision was partly panic"). These live in the narrative doc but would be filtered out before any external use. This keeps the doc honest and therefore useful for Mark personally, not just performatively useful.

**Utility Gate v2 applied from day one.** SHA-pinned. If no commits happened since last Monday, writes a skip stub — which is itself useful data ("quiet week — routine maintenance only").

**Interactions with future routines:**
- **R16 (Job Digest)** reads this file to know "what Mark can demo" for each job posting
- **Future "Explain It Like I'm a Recruiter" translator** reads this file monthly, compresses into 150-word LinkedIn-ready summaries
- **Future "FDE Case-Study Writer"** picks one week's story per month and expands into case-study format
- **R19 (Morning Briefing)** could reference the latest shipped.md entry on Monday mornings

So R17 is the **anchor node** in the career cluster — several future routines depend on its output.

**Model choice:** Opus 4.7 1M. Synthesis across a full week of diffs + PR descriptions + issue threads + README for context = genuinely large-context work. Dropping to Opus standard would hit context limits on busy weeks.

**First-run consideration:** when triggered tonight for its first run, the routine will look back 7 days — which includes today's large fleet-calibration work (6 commits, 6 tags, routine rename sweep, V2 gate rollout). That's an extraordinarily rich first run by accident — the narrative Mark gets tomorrow morning will be a showcase. Future weeks may be quieter; that's fine.

**Design rule for future: narrative never padded.** The prompt explicitly bans generic prose and resume bullets. This routine is the factual record; the "make it sound good" layer is a downstream routine's job. Mixing the two here corrupts the archive.