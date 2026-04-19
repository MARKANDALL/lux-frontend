# Lux Docs Guide

> **Purpose:** This is the orientation doc for everything in `docs/`. It tells you which file owns which kind of content, so ideas, bugs, rules, and architecture facts don't drift into the wrong place.
>
> **Audience:** future-you, fresh AI threads picking up the project, and anyone else who ends up working with Lux.
>
> **When to re-read this:** before starting a new doc, before pasting an idea into an existing doc, and whenever a doc starts feeling bloated or off-topic.
>
> **Last revised:** 2026-04-19 (post docs-overhaul — all four pillars rewritten in one day, tag `docs-overhaul-complete-2026-04-19`).

---

## The Four Pillars

Every piece of durable Lux documentation belongs in one of these four files. If content doesn't fit any of them cleanly, that's a signal to either add it to the routines system (see below) or consider whether it belongs in docs at all.

| Pillar | File | Role |
|---|---|---|
| 1. Architecture | `docs/ARCHITECTURE.md` | How the frontend is actually built — scaffolding only |
| 2. Bill of Rights | `docs/SYSTEM_HEALTH_BILL_OF_RIGHTS.frontend.md` | The rules — what's allowed, what's banned, what protocols to follow |
| 3. Master Idea Catalog | `docs/LUX_MASTER_IDEA_CATALOG.md` | The vision — every feature idea, phased roadmap |
| 4. Audit | `docs/LUX_PROJECT_AUDIT_2026-04-17.md` | Open work — bugs, findings, red/yellow zones, resolution status |

---

## What each pillar IS and is NOT

### 1. Architecture (`ARCHITECTURE.md`)

**IS:**
- Tech stack, directory structure, file roles
- The spine (`app-core/`) — bus channels, runtime, storage, listeners
- API layer surface (`apiFetch`, endpoints table, auth)
- Window globals ownership map (current state)
- State ownership ladder (Tiers A–D)
- Build/dev commands, git tags (stabilization campaign)
- Architecture rules (one-liners that point to the Bill of Rights for the full version)

**IS NOT:**
- Known bugs, fix lists, or work items (→ Audit)
- Historical hardening narratives or timestamped status (→ Audit if still active, otherwise archive-only)
- The full text of rules (→ Bill of Rights — Architecture only points to them)
- Future ideas or roadmap (→ Master Idea Catalog)

**Typical question it answers:** *"How does [part of the frontend] actually work right now?"*

### 2. Bill of Rights (`SYSTEM_HEALTH_BILL_OF_RIGHTS.frontend.md`)

**IS:**
- The 20 Rights — non-negotiable rules for the codebase
- Single Source of Truth Charter — global ownership map, one-writer-rule enforcement
- Allowed vs Banned patterns table
- Refactor Size Budget — thresholds and Safe Split Protocol
- Verification & Rollback protocols (smoke tests, rollback procedures, diagnostic table)

**IS NOT:**
- Current list of files violating the thresholds (→ Audit Issue 19)
- Audit status tables or fix checklists (→ Audit)
- Historical "here's what we fixed" narratives (→ Audit ledgers)
- Recommendations or ideas (→ Master Idea Catalog)

**Typical question it answers:** *"What's the rule about [state ownership / innerHTML / intervals / refactors]?"*

### 3. Master Idea Catalog (`LUX_MASTER_IDEA_CATALOG.md`)

**IS:**
- Every feature idea, dream, design note — organized by attack phase
- The 7 phases (Fix → Differentiate → Polish → Dogfood → Teach → Expand → Platform)
- Prioritized within each phase (🔵 critical / 🟡 high / 🟠 medium / ⚪ long-term)
- Ongoing/infrastructure items that span phases
- Strategic observations (Appendix A/B — what's strong, honest assessment)

**IS NOT:**
- Current bugs (→ Audit)
- Rules or constraints (→ Bill of Rights)
- How-it's-built info (→ Architecture)
- Routine ideas (→ `docs/routines/CLAUDE_ROUTINES_BACKLOG.md`)

**Typical question it answers:** *"What would we want Lux to do eventually?"* or *"Where does this feature idea belong in the roadmap?"*

### 4. Audit (`LUX_PROJECT_AUDIT_2026-04-17.md`)

**IS:**
- Page-by-page product/UX review (Practice Skills, AI Conversations, Progress, etc.)
- Console errors, bugs, polish notes — each with ✅ RESOLVED / ⚠️ PARTIAL / open status
- Cross-cutting findings (Issues 1–19)
- Part 10 code-level audit appendix (historical but updated with resolution markers)
- Sign-off checklist + strategic priorities
- Current red/yellow zone file list (Issue 19 — refreshed when repo changes meaningfully)

**IS NOT:**
- Feature ideas or roadmap content (→ Master Idea Catalog)
- Rules themselves (→ Bill of Rights — Audit only references them)
- Architecture facts (→ Architecture)
- Routine outputs (→ GitHub Issues tagged `routine:N`)

**Typical question it answers:** *"What's currently broken / open / in-progress?"*

---

## Decision Tree — Where Does This Content Go?

**Given a new piece of content, ask in this order:**

1. **Is it a specific open bug, broken behavior, or actionable finding with evidence?**
   → Audit.

2. **Is it a rule that should apply to ALL code written going forward, regardless of what changes?**
   → Bill of Rights.

3. **Is it "how this part of the frontend is built right now"?**
   → Architecture.

4. **Is it "something we might want Lux to do in the future"?**
   → Master Idea Catalog.

5. **Is it "something a cron job could automatically check or produce"?**
   → `docs/routines/` — see routines section below.

6. **Is it a historical status narrative or timestamped "here's what we fixed"?**
   → Either (a) an extractions ledger (temporary, during a doc overhaul) or (b) archive-only.

**If none of these fit:** reconsider whether it belongs in docs at all. Some content (e.g., "what I was thinking during a coaching session") belongs in personal notes, not pillar docs.

---

## Supporting Docs

### `docs/routines/` — the Claude Code Routines system

Three files, each with a specific role:

- `CLAUDE_ROUTINES_BACKLOG.md` — generic routine ideas (universal patterns, any codebase)
- `CLAUDE_ROUTINES_PLAYBOOK.md` — strategy, cost math, traps, 2-week execution plan
- `LUX_ROUTINES_FROM_CATALOG.md` — routines that solve specific Lux catalog items

Routine **ideas** go in these files. Routine **outputs** (actual scan results, findings, PRs) go to GitHub Issues or generated markdown files in the relevant folder (`/perf/`, `/audits/`, `/career/`, etc.) — not into the pillar docs.

### Extractions ledgers (temporary, from 2026-04-19 overhaul)

These files track the surgical changes made during the April 19 docs overhaul. They're kept for provenance (zero-content-loss guarantee) but are archivable once their contents have been absorbed:

- `ARCHITECTURE_EXTRACTIONS_2026-04-19.md`
- `BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md`
- `MASTER_IDEA_CATALOG_EXTRACTIONS_2026-04-19.md`
- `AUDIT_UPDATES_2026-04-19.md` (Tranche 1)
- `AUDIT_UPDATES_TRANCHE_2_2026-04-19.md`
- `AUDIT_UPDATES_TRANCHE_3_2026-04-19.md`

**Archive policy:** keep until the next major doc revision, then move to a `docs/archive/` folder or delete once their content is fully resolved into the audit.

### `docs/LUX_COMPETITIVE_LANDSCAPE.md`

Living document tracking competitors (ELSA, BoldVoice, Langua, etc.). Not a pillar, but referenced from the Master Idea Catalog when competitive differentiation is at stake. Update monthly, quarterly full refresh.

---

## GOLD File Convention

Before any non-trivial file edit (rename, split, major rewrite, doc swap), create a local backup:

**Filename pattern:** `<ORIGINAL_FILENAME>.<YYYY-MM-DD>.GOLD`

Examples:
- `ARCHITECTURE.md` → `ARCHITECTURE.md.2026-04-19.GOLD`
- `LUX_MASTER_IDEA_CATALOG.md` → `LUX_MASTER_IDEA_CATALOG.md.2026-04-19.GOLD`

**Rules:**
- `.GOLD` files are gitignored (never committed)
- They are local-only rollback safety nets
- Delete after the commit is verified and the change has soaked (~1 week)
- For multi-tranche edits, use a qualifier: `ARCHITECTURE.md.tranche1.2026-04-19.GOLD`

See Bill of Rights Right 11 for the full protocol.

---

## Update Cadence

| Doc | When to refresh |
|---|---|
| Architecture | When the repo structure meaningfully changes (new top-level folder, new feature area, major refactor) |
| Bill of Rights | Only when the rules themselves change — this doc should be the most stable |
| Master Idea Catalog | Whenever a new idea arrives — drop in the right phase, or in a phase-specific parking lot |
| Audit | After every session that resolves or discovers bugs; red/yellow zone refresh when Safe Split work happens |
| Competitive Landscape | Monthly skim; quarterly full refresh |
| Routines docs | When a new routine is added or retired; playbook re-read monthly as calibration |

**If a pillar feels bloated** — stop adding to it. That's a signal that content is drifting. Run an extractions pass like the one done on 2026-04-19 rather than letting content sprawl.

---

## Backend Docs

The backend (`luxury-language-api`) is a separate repo with its own documentation needs. There is no current backend ARCHITECTURE doc. If/when one is written, it follows the same pattern as this frontend's — a pillars guide can live in the backend repo, with cross-references to this one if integration topics come up.

Today's backend docs:
- `.env.example` (at backend repo root, committed 2026-04-18)
- README.md (at backend repo root)
- No extractions, no audit, no catalog — backend is infrastructure, not product

---

## Meta: Why this guide exists

The 2026-04-19 docs overhaul revealed that all four pillars had drifted — audit items had crept into Architecture and Bill of Rights, feature ideas had drifted into the audit, the Master Idea Catalog had a chaotic parking lot with items that belonged in specific phases. The root cause was simple: no explicit rule about what goes where, so convenience-of-the-moment won over structural discipline.

This guide is the rule. It's short on purpose. If a future thread ever says *"this idea might fit in Architecture or the Audit, I'll just put it in both,"* this doc is the tiebreaker.

**The tiebreaker in one line:** Audit = what's open. Bill of Rights = what's required. Architecture = what exists. Catalog = what we want.