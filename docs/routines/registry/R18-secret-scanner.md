# R18 · Secret Scanner

<!-- Path: docs/routines/registry/R18-secret-scanner.md — Live registry entry for the daily secret scanner. Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R18 · Secret Scanner *(created 2026-04-20)*
- 🟢 Active · `lux-frontend` · security · core-every-night
- Daily 3:15 AM EDT (`15 3 * * *`) · Opus 4.7 (standard, not 1M) · cron
- **Output:** draft PR "security: secret scan — YYYY-MM-DD" + comment on issue "Secret Scanner Alerts (R18)" (creates if missing)
- **Active:** 2026-04-20 → — · **Edited:** 2026-04-20 · **Last run:** —
- **Depends on:** —

## Prompt

```
UTILITY GATE — run FIRST. If any skip condition is true,
stop and do not proceed. Do NOT read any source file,
do NOT grep, do NOT scan until this gate clears.

Routine ID:     lux-secret-scanner
Input globs:    (whole repo, text files only)

0. FORCE CHECK — honor explicit overrides.
   If either of these is true, delete .routine-state/lux-secret-scanner.sha,
   skip all SKIP gates below, and proceed to a full baseline scan:

   a. `git log -1 --format=%B HEAD | grep -q '\[force-scan\]'`
   b. `[ -f .routine-state/lux-secret-scanner.force ]`

1. last_sha = `cat .routine-state/lux-secret-scanner.sha 2>/dev/null || echo ""`
   curr_sha = `git rev-parse HEAD`

2. SKIP A — same commit since last run:
   If last_sha == curr_sha:
     → write skip stub, EXIT.

3. If last_sha is empty: first run — proceed to step 5 (full baseline).

4. SKIP B — no meaningful changes:
   changed = `git diff --name-only $last_sha HEAD 2>/dev/null | grep -v '_agents-archive/\|kodama-reports/\|\.GOLD$'`
   If changed is empty:
     → write curr_sha to .routine-state/lux-secret-scanner.sha
     → write skip stub, EXIT.

5. Proceed. Scan the full repo (or scan only $changed if last_sha was non-empty).
   At end of successful scan, write curr_sha to .routine-state/lux-secret-scanner.sha.

Skip stub template:
# Secret Scanner — YYYY-MM-DD
## Summary
✅ No in-scope changes since last run (HEAD @ <short-sha>). No scan performed.
Still open the draft PR so the skip is visible.

====================================================================

You are scanning the Lux Pronunciation Tool frontend (lux-frontend) for committed secrets, API keys, tokens, and credentials.

GOAL: produce a ZERO-FALSE-POSITIVE report. The routine's entire value depends on Mark trusting that a finding means he must act. If this routine cries wolf, he will ignore it — and the one real leak someday will slip past. Err HEAVILY on the side of silence.

SCOPE:
- Scan tracked files (respect .gitignore)
- Scan ALL file types EXCEPT: binaries, images, fonts, .lockfile, package-lock.json, node_modules/, .vercel/, dist/, public/vid/, public/assets/
- Include: .js, .mjs, .ts, .jsx, .tsx, .html, .css, .md, .json, .yml, .yaml, .sh, .ps1, .env.example, Dockerfile
- Also include dotfiles in repo root (.gitignore, .eslintrc.json, etc.) to catch misconfigured tooling

SEARCH PATTERNS (run these as grep -E against the in-scope files):

HIGH CONFIDENCE (almost certainly real secrets — flag immediately):
- Stripe live keys:        sk_live_[A-Za-z0-9]{20,}
- Stripe test keys:        sk_test_[A-Za-z0-9]{20,}
- Stripe publishable:      pk_live_[A-Za-z0-9]{20,}
- AWS access key:          AKIA[0-9A-Z]{16}
- AWS secret:              (?<![A-Za-z0-9/+])[A-Za-z0-9/+]{40}(?![A-Za-z0-9/+])   (context-sensitive — confirm with nearby `aws_secret` keyword)
- Google API key:          AIza[0-9A-Za-z_-]{35}
- GitHub PAT:              ghp_[A-Za-z0-9]{36}
- GitHub fine-grained:     github_pat_[A-Za-z0-9_]{82}
- Slack bot:               xoxb-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24,}
- Slack user:              xoxp-[0-9]{10,13}-[0-9]{10,13}-[0-9]{10,13}-[a-f0-9]{32}
- Slack webhook:           hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[A-Za-z0-9]+
- OpenAI key:              sk-[A-Za-z0-9]{48}
- OpenAI project key:      sk-proj-[A-Za-z0-9_-]{40,}
- Anthropic key:           sk-ant-[A-Za-z0-9_-]{40,}
- ElevenLabs key:          xi-api-key.*[A-Fa-f0-9]{32}
- Azure Speech key:        ^[A-Fa-f0-9]{32}$   (context-sensitive — confirm nearby `AZURE_SPEECH` or `SPEECH_KEY` keyword)
- Supabase service key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{40,}   (context-sensitive — confirm nearby `SUPABASE_SERVICE` or similar)
- Generic JWT:             eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}
- RSA private key header:  -----BEGIN (RSA |OPENSSH |DSA |EC |PGP |ENCRYPTED )?PRIVATE KEY-----
- npm token:               npm_[A-Za-z0-9]{36}

MEDIUM CONFIDENCE (flag only with surrounding context suggesting a secret):
- Long base64 blobs (80+ chars) appearing in assignment context like `key = "..."`, `token: "..."`, `authorization: "..."`
- Password-like assignments: `password\s*[:=]\s*["'][^"']{8,}["']`
- Hardcoded bearer tokens: `Bearer [A-Za-z0-9_\-\.]{20,}` outside of example/documentation contexts

ALWAYS IGNORE (hardcoded allowlist — do not flag these):
- Any match inside a file that starts with a path component in: node_modules/, .vercel/, dist/, _ARCHIVE/, _agents-archive/
- Any match inside .env.example (intentional documentation of variable NAMES — values are placeholders)
- Any match whose surrounding 3 lines contain words like "example", "placeholder", "fake", "dummy", "your-key-here", "XXX", "TODO", "<your_key>", "redacted"
- Matches inside .md files that are clearly inside a code fence used for documentation (context: the nearest heading or paragraph describes the format, not a real secret)
- Matches that are 32-char hex strings inside test fixtures or mock data (context: file path contains `test`, `mock`, `fixture`, `spec`)
- Supabase anon public keys (these are safe to commit by design — check for `anon` or `public` in surrounding context)

PROCESS:

1. Run each high-confidence pattern across the in-scope file set. Collect hits with file path, line number, and 2 lines of surrounding context.
2. For each hit, apply the ALWAYS IGNORE filters. If any filter matches, drop the hit silently — do not report.
3. For medium-confidence patterns, require surrounding context evidence before flagging.
4. Group remaining findings by severity:
   - CRITICAL: live credentials (sk_live_, AKIA, ghp_, xoxp-, PRIVATE KEY blocks)
   - HIGH: test/dev credentials, JWTs without clear allowlist context
   - MEDIUM: base64/password/bearer patterns with credential-like context

OUTPUT:

Every run (whether findings or not) produces a draft PR titled:
"security: secret scan — YYYY-MM-DD"

REPORT STRUCTURE:

# Secret Scanner — YYYY-MM-DD

## Summary
- Files scanned: [N]
- Total hits after filtering: [N]
- CRITICAL findings: [N]
- HIGH findings: [N]
- MEDIUM findings: [N]

## Top Priority
[ONE line: either the most severe finding's file:line + pattern matched, OR "None — no secrets detected."]

## Findings
[Per-finding, grouped by severity. For each:
- File path and line number
- Pattern that matched
- 2 lines of surrounding context (with the suspected secret REDACTED — replace the match with `[REDACTED]`)
- Recommended action: rotate key + remove from git history]

## Notes
[Any files that had many matches but were all filtered out — note for audit trail. Any ambiguous matches that were NOT flagged but might warrant human review. Do NOT include full secret values anywhere in the output.]

====================================================================

ALERT PATHS:

If ANY finding is CRITICAL:
- Comment on GitHub issue "Secret Scanner Alerts (R18)" (create if missing, title exactly that) with:
   🚨 CRITICAL: [N] critical findings in [commit-sha]. See PR [link].
- The issue comment should include file paths and line numbers but NEVER the actual secret values.

If findings are HIGH or MEDIUM only:
- Comment normally on the same issue with: [N] findings, highest severity [HIGH/MEDIUM]. See PR.

If zero findings after filtering:
- Comment: ✅ Clean scan — HEAD @ [short-sha].

RULES:
- ZERO FALSE POSITIVES is the north star. If in doubt, DROP THE HIT.
- NEVER include actual secret values in any output — redact with [REDACTED] always, even in PR body.
- The skip-stub on no-change commits is a feature, not a bug — Mark knows the routine ran.
- Do NOT modify any files. Report-only.
- Do NOT commit the report into kodama-reports/ — this routine outputs only to the PR and issue.
```

## Notes

**Created 2026-04-20 during Stage 3 routine drafting.** The fleet's first dedicated security routine beyond R04's dependency vulnerability scan. Fires daily at 3:15 AM EDT — 18 minutes before R01 at 3:33 AM — so if anything is flagged, the security signal appears first in the morning review.

**North-star principle: ZERO FALSE POSITIVES.** The entire value of this routine depends on Mark trusting that any finding means he must act. False positives train him to ignore it; then the one real leak someday slips past. The prompt hammers this point three times and includes a comprehensive allowlist (`.env.example`, docs in code fences, test fixtures, Supabase anon keys, context words like "example"/"placeholder"/"fake") specifically to avoid crying wolf.

**Severity tiers intentionally graduated:**
- **CRITICAL** = live production credentials (`sk_live_`, `AKIA`, PRIVATE KEY blocks) → immediate alert
- **HIGH** = test/dev credentials or ambiguous JWTs → normal alert
- **MEDIUM** = context-dependent patterns (long base64 in credential-shaped assignments) → logged but not alerted

This prevents the routine from conflating "leaked Stripe live key" (career-ending) with "suspicious-looking string in a test file" (noise).

**Redaction is absolute.** The prompt requires `[REDACTED]` placeholder in ALL output — PR body, issue comments, report findings, everywhere. The routine must never write the actual secret value anywhere it goes. Reason: if R18 finds a leaked secret and writes it into a PR, that PR becomes a second place the secret is exposed. The routine surfaces "where" and "what kind," not "what."

**Utility Gate v2 applied from day one** — SHA-pinned, scope-filtered. On a busy day the routine scans only changed files against last_sha; on a first run or force-override, it does a full baseline.

**Design choice — cron 3:15 AM vs. on-commit trigger:** chose nightly cron over on-commit for two reasons. (1) On-commit would multiply run count per push, burning budget with no added signal for bulk refactors. (2) Nightly is "one sweep a day" which matches how a human would audit. If response time becomes critical later, can add an on-push secondary trigger via GitHub webhook.

**Model choice:** Opus 4.7 standard (not 1M). The work is bounded — grep with regex patterns, filter via allowlist, classify by severity. No whole-repo synthesis needed.

**Known limitation — historical git leaks:** R18 scans the working tree, not git history. If a secret was committed and then removed in a later commit, R18 won't find it. That's a separate one-off routine (git-history secret audit) worth queueing for later. For now, R18 catches today's leaks before they age.

**Alert issue naming convention:** "Secret Scanner Alerts (R18)" — the R-number in the title prevents collision with any future security tracker and makes the issue easy to find via search.

**Companion future routines this pattern could unlock:**
- Weekly "stale credentials" scanner — reads .env.example, confirms all documented vars are actually used in code
- Monthly "credential-touching code" audit — enumerates every `_api/` function that reads process.env.*
- Quarterly git-history secret audit — the one-off mentioned above