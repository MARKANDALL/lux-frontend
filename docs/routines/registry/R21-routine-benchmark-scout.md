<!-- docs/routines/registry/R21-routine-benchmark-scout.md -->
<!-- Registry entry for R21: Routine Benchmark Scout -->

# R21 · Routine Benchmark Scout

**ID:** lux-routine-benchmark-scout
**Model:** Claude 4.7 (1M context)
**Cadence:** Manual-fire only (Saturday 00:00 cron is a no-op placeholder)
**Repo:** MARKANDALL/lux-frontend
**Status:** Active

## Purpose

Take an existing routine from the fleet, find best-in-class external
equivalents on the public web, and return a structured upgrade
recommendation — not a rewrite. Mark reviews the findings and
cherry-picks what to adopt.

## Prompt

The full prompt lives in the Routines dashboard for R21. It is the
source of truth and should not be duplicated here. See dashboard.

## How to fire

1. Decide the target routine (e.g., R18 Secret Scanner).

2. Create the target file at
   `.routine-state/lux-routine-benchmark-scout.target` with three fields:
   `TARGET_ROUTINE_ID`, `TARGET_ROUTINE_NAME`, and `TARGET_ROUTINE_PROMPT`
   (the last one is a YAML literal block — the prompt text indented 2
   spaces under a `|` indicator).

3. Commit and push the target file. R21 reads from HEAD, not local.

4. Click "Run now" on R21 in the Routines dashboard.

5. R21 produces a report at
   `docs/routines/scout-reports/<ID>-scout-YYYY-MM-DD.md`

6. R21 auto-deletes the target file on success.

## Output

- Scout report markdown file (committed via draft PR)
- Issue comment on "Routine Benchmark Scout Log (R21)"
- Draft PR titled `scout: R## benchmark — YYYY-MM-DD`

## Design principles

- Synthesis over volume — max 7 web searches per run.
- Delta over rewrite — Mark decides what to adopt.
- Evidence-based — every recommendation cites a URL.
- Honest verdicts — if a routine is already best-in-class, the report
  says so plainly.

## Cron placeholder note

The Routines dashboard requires a cron schedule even for manual-only
routines. R21 is set to Saturday 00:00 as a placeholder. If R21 fires
on the cron without a target file, it exits immediately with a
no-target stub — safe to leave in place.

## Related

- Every other routine in the fleet is a potential target.
- See `docs/routines/registry/INDEX.md` for the full fleet.