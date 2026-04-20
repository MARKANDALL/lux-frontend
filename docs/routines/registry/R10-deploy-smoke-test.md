# R10 — `lux-deploy-smoke-test`

<!-- Path: docs/routines/registry/R10-deploy-smoke-test.md — Live registry entry for the deploy smoke test (paused, intentional no-op until deployment). Index at docs/routines/registry/INDEX.md. -->

- **Rename →** Deploy Smoke Test
- 🟡 Paused · `lux-frontend` · infra · reactivation-candidate (pending public deployment)
- Daily 5:00 AM EDT (`0 5 * * *`) · Opus 4.7 (standard, not 1M) · cron *(ideal webhook candidate once Lux is deployed — Vercel `deployment.succeeded` event)*
- **Output:** **intentional no-op** — no file, no PR, no issue comment. Emits one fixed message and exits.
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-17 05:03 (scheduled — last fire before pause) — also 2026-04-16 22:37 (manual), 2026-04-16 16:58 (manual), 2026-04-16 05:15 (scheduled)
- **Depends on:** —

## Prompt

```
STATUS: Lux is local-only development, not yet publicly deployed. This smoke test is currently a no-op placeholder.

When deployment to production begins, this routine will be rewritten to verify:
- Root URL returns 200 and page contains "Lux"
- /_api/router?route=alt-meaning POST returns 200
- All HTML entry pages (index, convo, progress, wordcloud) return 200
- /public/assets/ serves at least one file
- HTML source has no obvious broken script paths

Until then, respond with this exact message and stop:
"✅ No-op: Lux is local-only; no production URL to smoke-test. Re-enable this routine when public deployment begins."

Do not curl any URL. Do not open a PR. Do not file an issue. Just emit the no-op message and exit.
```

## Notes

**Intentional no-op while Lux is local-only.** Prompt is the shortest in the fleet and explicitly forbids all side effects: no curl, no PR, no issue.

The prompt itself enumerates the five checks that WILL run post-deployment:
1. Root URL 200 + "Lux" in body
2. `/_api/router?route=alt-meaning` POST 200
3. All HTML entry pages 200 (index, convo, progress, wordcloud)
4. `/public/assets/` serves ≥1 file
5. HTML source has no obvious broken script paths

**Reactivation path when Vercel deployment goes live:**
- (a) Rewrite the prompt body to actually perform the five checks
- (b) Unpause
- (c) **Convert to a webhook trigger on Vercel `deployment.succeeded`** rather than keeping the daily cron — this is the textbook webhook use case and would free a daily-scheduled-run slot while catching every deploy (daily cron misses hotfix deploys between 5:00 AMs)

The two scheduled fires on Apr 16 05:15 and Apr 17 05:03 landed before the routine was paused; they executed the no-op message as designed.

**Worth noting:** the one-line body instruction embedded in the prompt — *"respond with this exact message and stop"* — is a nice pattern for any future "this routine is intentionally parked" placeholder: keep the routine in the fleet so the slot isn't lost, but let the prompt enforce inactivity explicitly rather than relying on the paused toggle alone.

Model is Opus 4.7 **standard, not 1M** — emitting a fixed string doesn't need any context window to speak of.

Cleanest unpause-and-rewrite candidate once deployment lands.
