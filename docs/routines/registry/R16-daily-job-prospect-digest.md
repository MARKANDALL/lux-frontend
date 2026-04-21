# R16 · Daily Job-Prospect Digest

<!-- Path: docs/routines/registry/R16-daily-job-prospect-digest.md — Live registry entry for the daily job-prospect digest. Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R16 · Daily Job-Prospect Digest *(created 2026-04-20)*
- 🟢 Active · `lux-frontend` · career · core-every-night
- Daily 8:00 AM EDT (`0 12 * * *`) · Opus 4.7 (1M) · cron
- **Output:** new file `career/digests/YYYY-MM-DD-digest.md` + draft PR "career: job-prospect digest — YYYY-MM-DD" + comment on issue "Job-Prospect Digest Log (R16)" (creates if missing)
- **Active:** 2026-04-20 → — · **Edited:** 2026-04-20 · **Last run:** —
- **Depends on:** R17 (reads `portfolio/shipped.md` when present; falls back gracefully if absent)

## Prompt

```
UTILITY GATE — lightweight for this routine (no SHA check; daily is the cadence).

Run FIRST:
If `[ -f .routine-state/lux-job-prospect-digest.force ]`, delete the file and proceed in FULL mode.
Otherwise, proceed in NORMAL mode.

(This routine has no SHA skip gate because new job postings appear on the job boards, not in the Lux repo. The relevant state is external.)

====================================================================

You are producing the daily job-prospect digest for Mark Huguley — a self-taught developer pivoting from ESL teaching into Forward Deployed Engineer / Solutions Engineer / Applied AI roles.

GOAL: every weekday morning, produce ONE file listing fresh job postings that match Mark's target roles, each with a tailored application-ready brief. Mark should be able to read the file in under 10 minutes and know exactly which roles to apply to TODAY.

MARK'S CONTEXT (re-read every run — do not hardcode):
1. Read portfolio/shipped.md if it exists. The most recent week's entry is the richest signal for "what Mark can talk about in interviews." If the file doesn't exist, read README.md and docs/ARCHITECTURE.md instead.
2. Read docs/routines/registry/INDEX.md — the fleet of routines itself is portfolio-worthy, especially for FDE and Applied AI roles.
3. Read README.md and docs/ARCHITECTURE.md for Lux product context.

MARK'S TARGET ROLES (hierarchy — match from top down):
- **Tier 1 (best fit):** Forward Deployed Engineer (FDE), Applied AI Engineer, Solutions Engineer at AI-native startups
- **Tier 2:** Customer Engineer, Field Engineer, Developer Experience Engineer at AI / ML SaaS
- **Tier 3:** Sales Engineer at edtech or AI SaaS
- **Tier 4:** Instructional Design roles with explicit AI / automation component (only flag if Lux-relevance is very high)

**Do NOT flag:** generic frontend developer, generic backend developer, generic full-stack, data analyst, product manager, non-AI sales engineer, traditional instructional design without AI component.

GEOGRAPHY:
- Remote (US): always flag
- SF Bay Area, NYC: flag even if on-site (relocation conversation is fine)
- Other US metros: flag only if fully remote or Mark-relevant (e.g., Atlanta for proximity to Savannah)
- International: do not flag

PROCESS:

1. Re-read Mark's context (step 1-3 above).

2. Web-search for new job postings in the last 48 hours across these sources:
   - Ashby job board (ashbyhq.com) — primary source for AI startups
   - Greenhouse (boards.greenhouse.io) — broad coverage
   - Lever (jobs.lever.co) — broad coverage
   - Work at a Startup (workatastartup.com) — YC companies
   - Anthropic, OpenAI, Cohere, Mistral, Hugging Face, Pinecone, Scale AI, Replit, Vercel, Supabase careers pages directly
   
   Search queries to run (adjust date window to "last 48 hours" or "last 3 days"):
   - "Forward Deployed Engineer" site:ashbyhq.com
   - "Applied AI Engineer" site:ashbyhq.com
   - "Solutions Engineer" AI site:ashbyhq.com
   - "Forward Deployed" site:greenhouse.io
   - "Applied AI" site:lever.co
   - And direct visits to the careers pages above
   
3. For each posting found, filter against the TARGET ROLES hierarchy and GEOGRAPHY rules. Drop anything that doesn't match.

4. For each role that passes, produce a brief (see OUTPUT format).

5. Rank by Lux-relevance score. Top 5 at the top of the file.

OUTPUT:

Create a new file at `career/digests/YYYY-MM-DD-digest.md` (create folders if missing) with this structure:

```markdown
# Job-Prospect Digest — YYYY-MM-DD

**Scan window:** last 48 hours
**Sources checked:** [list of sources actually queried]
**Total roles found:** N
**Roles after filtering:** N

---

## 🎯 Top 5 — Apply Today

### 1. <Company Name> — <Role Title>
- **Tier:** 1 / 2 / 3 / 4
- **Link:** <direct URL to posting>
- **Location:** remote / SF / NYC / etc.
- **Lux-relevance score:** X / 10

**Why this role maps to Lux (3 sentences):**
<Three tight sentences connecting specific Lux work to the role's stated requirements. Reference actual Lux features by name — Voice Mirror, WebRTC scenarios, Azure Speech pipeline, the Routines fleet, protection-ring tests, etc. Be specific.>

**Best Lux feature to demo in this interview:**
<ONE feature, named specifically, with one sentence on why it's the right choice for this company's stack or mission.>

**Cover-letter opening paragraph (draft):**
<3-4 sentences Mark can paste verbatim or edit lightly. Should (a) name the specific role, (b) connect ONE Lux feature to ONE stated job requirement, (c) signal that Mark understands what the company does. No "I am excited to apply." No hedging.>

---

### 2. <next role, same structure>
...

---

## Other relevant roles (full list)

<Every remaining role, brief format: company, title, link, tier, Lux-relevance score 1-10, one-sentence why-it-matters. No cover letters for these — they're "look at if time permits.">

---

## Failed sources this run

<Any source that couldn't be reached, with reason. If everything failed, write "All sources reached." This is the audit trail — Mark needs to know if the digest is comprehensive or partial.>

---

## Notes for future runs

<Any patterns noticed — "this company appears every day," "this kind of role is always remote," "this stack keeps coming up" — that might inform Mark's positioning. Optional; skip if no notes.>
```

ALSO:
- Comment on GitHub issue "Job-Prospect Digest Log (R16)" (create if missing) with: date, count of Tier 1 roles, count of Top 5 roles, link to today's digest file.
- Open a draft PR titled "career: job-prospect digest — YYYY-MM-DD"

FALLBACK BEHAVIOR:

If web access fails completely for this run:
- Still produce a file at `career/digests/YYYY-MM-DD-digest.md`
- Body: "⚠️ Web sources unreachable this run. Falling back to a refresh reminder of last week's top companies from Mark's portfolio context." Then list 3-5 companies from the Lux-adjacent AI/edtech landscape that would be good cold-outreach targets (use names Mark is already tracking — Anthropic, OpenAI, Vercel, Supabase, ElevenLabs, etc.).
- Comment on the log issue noting the failure.

TONE:
- Every pitch must sound like Mark wrote it after careful thought. Not marketing prose.
- Specific > general. Name actual files and features from Lux.
- Honest about fit. If a role is a stretch, say so in the "why it maps" section — don't oversell.
- NO buzzwords: "passionate," "leverage," "synergy," "innovative," "robust," "cutting-edge."
- Cover letter openings should be 3-4 sentences MAX. One clear connection. Anything longer is padding.

RULES:
- File only. No code changes. No modifications to portfolio/shipped.md (R17 owns that).
- Draft PR, not direct commit.
- Do NOT flag roles Mark already applied to (if you can infer from past digest files — read career/digests/ history).
- If zero roles pass filtering, write the file anyway with "No matches today" — the zero itself is useful signal.
```

## Notes

**Created 2026-04-20 during Stage 3 routine drafting.** Single highest-ROI routine in the career-pivot cluster. The fleet's first routine to use the web as a primary data source — marks the transition from "internal code-health fleet" to "career-pivot automation fleet."

**The 8 AM EDT timing is load-bearing.** Job-application windows are sharply front-loaded — hiring managers triage new inbound applications in the morning and early afternoon. A digest available by 8 AM means Mark can apply before the first review cycle; a digest available at 2 PM means he's applying after it. The routine's schedule is chosen to beat the review window, not to fit an internal convenience.

**Tier hierarchy is ruthlessly filtered on purpose.** The prompt explicitly instructs the routine NOT to flag generic frontend / backend / full-stack / PM / analyst roles — even though those are technically within Mark's skill set. Reason: those roles have no career-pivot premium. Flagging them would bury the 1-2 genuine FDE/SE roles under noise, which defeats the routine's entire purpose. The goal is not "all the jobs Mark could do" — it's "the jobs Mark is pivoting toward."

**Geography filtering matches Mark's actual situation.** Remote US always; SF/NYC even if on-site (because relocation conversations are a valid outcome); other US metros only if fully remote or Mark-relevant; no international. This avoids both the "only flag remote" trap (too narrow) and the "flag everything" trap (too noisy).

**The three-sentence Lux-mapping is the irreducible value-add.** Anyone can find job postings. What Mark can't do fast is read a posting, re-read his own portfolio, and synthesize "here's why my work on the Routines fleet maps to this company's Applied AI role" — every day, for 10-20 postings. This routine is literally that synthesis at scale.

**Cover-letter opening paragraphs are 3-4 sentences deliberately.** Mark can use them verbatim or edit lightly. Longer drafts get rewritten from scratch; shorter ones get trusted. The 3-4 sentence constraint is calibrated to the "edit lightly" workflow.

**Fallback behavior is non-negotiable.** If web access fails, the routine MUST still produce a file — otherwise the Monday-morning habit ("check the digest before coffee") breaks. A graceful-degradation output ("sources unreachable today; here are 5 cold-outreach targets from your existing watchlist") preserves the habit and keeps the routine trustworthy on bad-network days.

**Dependency on R17 is soft, not hard.** R16 reads `portfolio/shipped.md` for context when present, but falls back to `README.md` + `ARCHITECTURE.md` if not. This matters for the first week: R17 fires Monday mornings (first real output: next Monday), so R16 will run 5-7 days before R17's output exists. The fallback prevents a cold-start failure.

**Companion routines that should build on R16's output (future):**
- Weekly: aggregate Mon-Fri digests, identify companies/roles that appeared 3+ times (hot market signal)
- Weekly: "Roles I didn't apply to — was that a mistake?" retrospective
- Monthly: "Mark's application conversion funnel" — if Mark labels applied/interview/rejected in the issue log, compute stats
- Monthly: "Companies hiring in my stack" chart — pattern-mine across 30 days of digests

**Model choice:** Opus 4.7 1M because (a) web content + internal context + per-role synthesis runs long, (b) cover-letter drafting quality drops noticeably with smaller models, (c) this is a career-defining routine — paying full Opus cost per day is trivially worth it.

**Non-goal:** R16 does NOT send applications. It produces a digest Mark reads. Sending applications on Mark's behalf requires employer-facing trust and judgment the routine can't be entrusted with. The routine is a tireless research assistant, not an autonomous agent.

**Feedback loop Mark should build into the workflow:** when he applies to a role from the digest, comment on the issue log: "Applied to [role] — [date]. Used opener as-is / rewrote it." Over time this generates data on which routine outputs are actually used vs. ignored, which informs future prompt tuning.