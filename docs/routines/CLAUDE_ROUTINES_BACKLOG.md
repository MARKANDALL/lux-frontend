# CLAUDE_ROUTINES_BACKLOG.md
<!-- Path: docs/routines/CLAUDE_ROUTINES_BACKLOG.md — Running idea pool for generic Claude Code Routines. Universal patterns, any project. Add new entries as they come. -->

> **Part of a 3-file system:**
> - **This file** — the WHAT (generic routine ideas, universal patterns)
> - **`CLAUDE_ROUTINES_PLAYBOOK.md`** — the HOW and WHY-NOT (strategy, cost math, architectural patterns, traps)
> - **`LUX_ROUTINES_FROM_CATALOG.md`** — routines that solve specific items from `LUX_MASTER_IDEA_CATALOG.md`
>
> **Goal:** Maximize the $100 credit (expires ~May 1, 2026) and keep the fleet churning every night. Mix of nightly / weekly / monthly / one-offs. Some serious, some weird. All cheap to try.
>
> **Priority key:** 🔵 high-value / clear signal · 🟡 medium / interesting · 🟠 experimental / might not land · ⚪ idea-only / stretch
>
> **Status key:** ✅ live · ⏳ queued / drafted · 💡 idea · ❌ tried and killed

---

## ✅ Currently Live (9 / 15 slots used)

| # | Name | Frequency | Model | Output |
|---|---|---|---|---|
| 1 | Health scan | Nightly | Opus 4.6 | GitHub issue #22 |
| 2 | Architecture audit | Weekly | Opus 4.6 | GitHub issue #23 |
| 3 | Hygiene sweep | Monthly | Opus 4.6 | GitHub issue #24 |
| 4 | Deploy smoke test | On-demand | Opus 4.6 | Issue comment |
| 5 | Deep code review | Weekly | Opus 4.6 | Issue |
| 6 | `.env.example` generator | Monthly | Opus 4.6 | PR |
| 7 | ARCHITECTURE.md rewrite | Quarterly | Opus 4.6 | PR |
| 8 | Test scaffold generator | On-demand | Opus 4.6 | PR |
| 9 | Dependency vulnerability scan | Weekly | Opus 4.6 | Issue |

**6 slots open. Unlimited queue behind that.** See PLAYBOOK for which of these should move off Opus.

---

## 🔐 Security & Safety

- 🔵 **Secret scanner** — grep for `sk_`, `eyJ`, `AKIA`, `AIza`, `xox[baprs]-`, long base64 blobs in committed files. Nightly. → Issue if hit.
- 🔵 **CORS / allowed-origins check** — confirm `_api/*.js` serverless functions don't wildcard `*` in production. Weekly.
- 🔵 **Supabase RLS policy audit** — enumerate every table, confirm RLS is ON, summarize policies per table, flag anything with `using (true)`. Weekly. → Issue.
- 🔵 **Auth flow trace** — read `ui/auth-dom.js` + all Supabase auth touch-points, produce a current-state flow diagram in markdown. One-off, rerun quarterly.
- 🟡 **localStorage key audit** — list every raw `localStorage.getItem/setItem` that bypasses `lux-storage.js`. Weekly. (Complements the protection-ring test.)
- 🟡 **XSS surface scan** — find every `innerHTML =` or unescaped template literal that touches user input. Weekly.
- 🟡 **Env var leak check** — scan bundle output for any `process.env.*` string that shouldn't be client-side. Weekly.
- 🟠 **Rate-limit audit** — confirm every `_api/*` route that hits Azure/OpenAI/ElevenLabs has a rate-limit guard. Monthly.

---

## 🩺 Code Quality & Health

- 🔵 **Dead code detector** — functions exported but never imported; files not referenced anywhere. Weekly. → Issue.
- 🔵 **`console.log` / debug-statement cleanup** — list every stray `console.log`, `debugger`, `alert` in production code. Weekly.
- 🔵 **TODO / FIXME / HACK aggregator** — sweep all comments, rank by age (git blame), output top 20 oldest. Monthly. Satisfying to crush.
- 🔵 **Silent-catch scanner** — find `catch (e) {}` or catches without `warnSwallow`. Weekly. (Bill-of-Rights violation pattern.)
- 🟡 **Long-function finder** — functions >80 lines, methods >50 lines. Monthly.
- 🟡 **Deep-nesting detector** — anything with >4 levels of `if`/`for` nesting. Monthly.
- 🟡 **Magic-number audit** — numeric literals outside constants files, excluding obvious `0`/`1`/`-1`. Monthly.
- 🟡 **Duplicate-code finder** — similarity scan, report top 10 near-duplicate function pairs. Monthly.
- 🟠 **Event-listener leak detector** — `addEventListener` without matching `removeEventListener` (where `guardedListener` isn't used). Weekly.
- 🟠 **`.GOLD` backup scanner** — list every `.GOLD` file older than 30 days; recommend archive or delete. Monthly.
- ⚪ **Cyclomatic complexity top-10** — rank files by complexity, output leaderboard. Monthly.

---

## ⚡ Performance

- 🔵 **Bundle size tracker** — run `vite build`, record total + per-chunk sizes, compare to last run, flag >10% growth. Nightly.
- 🔵 **Vercel 12-function limit watch** — count files in `_api/`, warn at 10, scream at 12. Nightly. (This has bitten you before.)
- 🔵 **Serverless cold-start audit** — measure bundled size of each `_api/*.js`, flag anything >1 MB. Weekly.
- 🟡 **Unused CSS detector** — cross-reference CSS classes against what's actually used in HTML/JS. Weekly.
- 🟡 **Lazy-load opportunity scan** — find `<img>` without `loading="lazy"`, large components imported at top-level. Monthly.
- 🟡 **Image weight audit** — list every image in `public/` over 500 KB, suggest conversion to WebP/AVIF. Monthly.
- 🟠 **Import-graph bloat** — find files with >30 imports (likely god-modules). Monthly.

> **Note:** Lux-specific perf routines (2G waterfall, Lighthouse canary) live in `LUX_ROUTINES_FROM_CATALOG.md`.

---

## 📚 Documentation

- 🔵 **README freshness check** — compare README mentions of files/features against actual repo state; flag stale references. Monthly.
- 🔵 **JSDoc coverage report** — % of exported functions with JSDoc. Trend over time. Weekly.
- 🔵 **Documentation drift detector** — flag docs referencing APIs or interfaces changed in recent merged PRs; open draft update PRs. Weekly. (Would have caught the `api/` → `_api/` drift the day it merged.)
- 🔵 **Inline-comment quality audit** — flag comments that just restate the code (`// increment i`). Monthly.
- 🟡 **CHANGELOG auto-draft** — from last N commits, draft a CHANGELOG entry grouped by Feature/Fix/Refactor. Weekly. → PR.
- 🟡 **API route inventory** — list every `_api/*` endpoint with its method, params, brief description. Monthly. → `docs/API.md`.
- 🟡 **Bus event catalog** — enumerate every `bus.emit` and `bus.on`, build a channel → emitters → listeners map. Monthly. → `docs/BUS_CATALOG.md`.
- 🟡 **`K_` storage key catalog** — list every `K_` constant, its type, where read, where written. Monthly. → `docs/STORAGE_KEYS.md`.
- 🟠 **Glossary generator** — scan for project-specific jargon, build a glossary. One-off.

---

## 🧪 Testing

- 🔵 **Test coverage trend** — run Vitest with coverage, record number, graph over time. Weekly.
- 🔵 **Untested route finder** — any `_api/*` route with zero test file. Weekly.
- 🔵 **Low-coverage file → test PR generator** — nightly, pick lowest-coverage file, generate Vitest tests, open PR. (Walks coverage up without you touching it.)
- 🟡 **Flaky-test detector** — run test suite 5x, flag any test that passed some runs and failed others. Weekly.
- 🟡 **Protection-ring canary verifier** — confirm canary files still have their guard tests. Nightly.
- 🟠 **Mock data freshness** — if test fixtures reference live API shapes, flag divergence. Monthly.

---

## 🧹 Git & Repo Hygiene

- 🔵 **Stale branch report** — branches not touched in >30 days. Weekly.
- 🔵 **Large file audit** — anything over 5 MB in the repo. Monthly.
- 🟡 **Commit message quality** — flag last week's commits that are just "update", "wip", "fix". Weekly.
- 🟡 **Git history bloat check** — find accidentally committed `node_modules/`, binaries, secrets in history. One-off, rerun quarterly.
- 🟠 **`.gitignore` completeness** — diff against the GitHub Node/Vite recommended ignore. Monthly.

---

## 🚢 Build, Deploy & Infra

- 🔵 **Build-time tracker** — log `vite build` duration, flag >20% regressions. Nightly.
- 🔵 **Vercel deployment health** — last 7 deploys: success rate, average build time, any 404s on known routes. Weekly.
- 🔵 **Env var sync check** — compare `.env.example` keys against what's referenced in code. Weekly.
- 🟡 **Dependency update digest** — which deps have minor/patch updates available, ranked by how widely used in your code. Weekly. (Not auto-PR — just digest.)
- 🟠 **Lockfile integrity** — `package-lock.json` vs `package.json` consistency. Weekly.

---

## 🌐 External Awareness (serendipity tier)

> These browse the internet. Low cost, high serendipity.

- 🔵 **Supabase changelog digest** — weekly scrape, flag anything affecting auth, RLS, storage, or edge functions. Weekly. → Issue.
- 🔵 **Azure Speech service updates** — new voices, new eastus region features, pricing changes. Weekly. → Issue.
- 🔵 **OpenAI API changelog** — Realtime API, GPT models, pricing. Weekly.
- 🔵 **ElevenLabs release notes** — IVC improvements, new models, voice cloning changes. Weekly.
- 🔵 **Anthropic API feature scout** — new features in the Claude API that Lux or Routines could use. Weekly.
- 🟡 **caniuse.com "newly baseline" scout** — what web platform features became baseline this month. Monthly. → `docs/WEB_FEATURES_WATCH.md`.
- 🟡 **Vite plugin ecosystem scout** — new/trending Vite plugins (bundle analyzer, image optimization, etc.). Monthly.
- 🟡 **"Cool CSS of the month"** — CSS-Tricks, Smashing, Chrome DevRel for new techniques (`@scope`, `anchor-positioning`, `view-transitions`, scroll-driven animations). Monthly. → `docs/inspiration/<date>.md`.
- 🟡 **Accessibility best-practices digest** — latest WCAG guidance, ARIA pattern updates. Monthly.
- 🟠 **Design-inspiration scraper** — Awwwards, Codrops, Codepen trending, Dribbble "button" shots weekly. Commits links + screenshots to `/inspiration/<date>.md`.
- 🟠 **CSS patch proposer** — reads latest inspiration file, proposes 2-3 concrete CSS patches incorporating new techniques. Weekly. Pairs with the scraper above.
- 🟠 **Font & type-pairing suggester** — given current brand, propose 3 alternative pairings. Quarterly.
- ⚪ **"What are people building with OpenAI Realtime?"** — skim blogs/GitHub for Realtime API patterns. Monthly.

---

## 🏢 Business & Pipeline Intel

> Generic patterns; specific targets happen to be Lux competitors/markets.

- 🔵 **Competitor release-notes watcher** — Monday 7am weekly. Targets: ELSA, BoldVoice, Speechling, SpeechAce, Mondly, Pronounce.ai, Langua, Immerse. Scrape product/pricing/changelog/blog/App Store "What's New". Diff against `/competitors/<vendor>.md`. Flag keywords: `agentic`, `agent`, `orchestrator`, `multi-agent`, `GPT-realtime`, `voice cloning`. → Issue.
- 🔵 **Grant and pilot funding scanner** — weekly. Targets: Grants.gov, ED.gov, state DOE RFPs, Gates/Walton/Overdeck foundations. Keywords: ESL, English learner, pronunciation, adult education, immigrant services, workforce development. → `/grants/OPEN.md` with deadlines + eligibility.
- 🟡 **Prospects scanner** — nightly, rotating state per week. Targets: adult ESL programs, community colleges with ESL, immigrant-serving nonprofits. Extract: program director name, public email, program size, tech-pilot mentions. Append to `/prospects/<state>.md`.
- 🟡 **Community mention watcher** — Reddit (r/languagelearning, r/EnglishLearning), HN, Twitter/X for brand mentions or competitor complaints that map to Lux strengths. Weekly.
- 🟠 **App Store review digest** — scrape competitor App Store reviews weekly, cluster complaints, surface "Lux could solve this" moments. Weekly.
- ⚪ **LinkedIn ad-placement watcher** — which competitors are running LinkedIn ads, what audiences, what creative. Weekly.

---

## 🎯 Career Pivot (FDE / SE / Applied AI)

> Single highest-ROI cluster for the next 60 days.

- 🔵 **Daily job-prospect digest** — scan Ashby, Greenhouse, Lever, Work at a Startup for new postings matching: Forward Deployed Engineer, Solutions Engineer, Applied AI Engineer, Sales Engineer at edtech or AI SaaS, SF or NYC. For each: title, company, link, 3-sentence pitch on how Lux maps to their stack, tailored cover-letter opening paragraph, Lux-relevance score 1–10, which Lux feature is best demo for this interview. → `/career/<date>/digest.md`.
- 🔵 **Portfolio-narrative scribe** — weekly. Reads merged PRs and commits from the past week, writes a human-readable "what I shipped this week" entry. → `/portfolio/shipped.md` running doc. (Gold for interview prep; dated and specific beats reconstructed memory.)
- 🔵 **"Explain it like I'm a recruiter" translator** — monthly. Takes 10 most recent/most-starred commits, reads diffs, writes a non-technical 150-word summary of each for LinkedIn posts or resume bullets. → `/portfolio/recruiter-translations.md`.
- 🟡 **Interview question generator** — weekly. Reads one Lux module, generates 10 likely technical-screen questions about it with suggested answer outlines. → `/career/interview-prep/<module>.md`.
- 🟡 **FDE case-study writer** — monthly. Picks one customer-facing scenario from Lux (onboarding, Voice Mirror, scoring) and writes it as an FDE-style case study: problem, constraint, solution, tradeoff, outcome. → `/portfolio/case-studies/`.
- 🟠 **"Grill me" adversarial reviewer** — triggered on every PR you open. Opus plays staff engineer and tries to break your reasoning before merge. → PR comment. (Interview-prep-grade practice against your own code.)

---

## 🧘 Personal Ops

- 🔵 **Morning briefing routine** — daily 6:30am. Reads overnight routine issues, calendar (via Google Calendar MCP), upcoming grant deadlines, new job postings worth same-day apply. One-screen brief, 30-second read. → email or Slack DM.
- 🔵 **Weekly review generator** — Friday 4pm. Reads the week's shipped portfolio entries + morning briefs + issues closed. Writes a 5-bullet "this week at Lux" for your own records. → `/personal/weeks/<date>.md`.
- 🟡 **Calendar-aware task prep** — daily, 15 min before next meeting. Pulls context from recent emails/chats about that meeting, surfaces a 3-bullet brief. (Needs Gmail/Calendar MCP.)
- 🟡 **Tuesday-night planning prompt** — weekly. Reads last week's shipped doc + this week's calendar, drafts "here are the 3 things worth protecting time for this week." → morning brief.

---

## 🧠 Meta (routines about routines)

- 🔵 **Issue triage** — auto-categorize open issues by label suggestions, flag stale (>14 days no activity). Weekly.
- 🔵 **Routine effectiveness report** — which routines found actionable findings in the last 30 days vs which just spam noise. Monthly. → decide what to kill.
- 🟡 **Token burn analyzer** — which routines cost the most tokens per useful finding. Monthly.
- 🟡 **Orchestrator routine** — reads `/queue/pending/` in the repo, each file is a task spec with target-routine tag. Decides what runs today and triggers via webhook. Daily. (See PLAYBOOK for pattern.)
- 🟠 **Cross-repo diff** — once backend (`luxury-language-api`) also has routines, diff architecture/patterns between frontend and backend monthly.

---

## 💣 One-Offs (queue as single runs)

- 🔵 **`_api/migrate.js` missing-endpoint fix** — already on deck from nightly scan #22. Queue as one-off with PR output.
- 🟡 **ARCHITECTURE.md reconciliation** — fix stale `api/` vs `_api/` references in one pass.
- 🟠 **Repo tour generator** — produce a 10-minute "new contributor" walkthrough as a markdown file.
- 🟠 **README for every subfolder** — one pass, one README per meaningful directory.
- ⚪ **Easter egg hunt** — scan for all your commented jokes, personality tags, funny variable names. Collect in `docs/EASTER_EGGS.md`.

---

## 🧪 Experimental / Wild

> Stuff that might not land but costs almost nothing to try.

- 🟠 **Dependency "if I removed this, what breaks" audit** — pick 3 random deps, simulate removal. Monthly.
- 🟠 **"What would a senior engineer say?"** — rotate a reviewer persona each week (Security SRE, DX-obsessed Staff, Perf lead, a11y specialist) and critique one module. Weekly.
- 🟠 **Naming consistency rant** — pick 20 variable/function names, judge consistency. Monthly.
- 🟠 **Git commit poetry** — turn this month's commit titles into a haiku stack. Monthly. (For morale.)
- ⚪ **Architecture mermaid-diagram auto-generator** — parse the repo, emit a mermaid diagram of module relationships. Monthly.
- ⚪ **"Junior dev onboarding test"** — pick one module, have the routine draft 10 understanding-check questions a new hire would need to answer. One-off.

---

## 🗂 Queue Strategy (suggested starter config)

> Full rationale in PLAYBOOK. Model assignment matters — see PLAYBOOK's Opus→Sonnet downgrade table.

**Nightly (aim for 5–7 active):**
Health scan · Bundle size · Vercel function count · Secret scanner · Morning brief · `passage_key` fallback (Lux-specific) · Canary verifier

**Weekly (aim for 5–7 active):**
Architecture audit · Deep code review · Dep vuln scan · RLS audit · Coverage trend · Competitor watcher · Supabase/Azure/OpenAI/ElevenLabs digests (rotate)

**Monthly (aim for 3):**
Hygiene sweep · Scenario four-axis re-audit (Lux-specific) · CSS/design inspiration scrape

**Queued behind everything:**
Lux-from-catalog routines (see separate file) + experimental tier.

---

## ➕ How to Add a New Entry

```
- [priority emoji] **Name** — one-line description. Frequency. → output target.
```

**Rules of thumb:**
1. If it's universal (applies to any repo), it goes here.
2. If it's specifically derived from `LUX_MASTER_IDEA_CATALOG.md`, it goes in `LUX_ROUTINES_FROM_CATALOG.md`.
3. If you can't decide, drop it in Parking Lot below and sort later.
4. Use the priority emoji honestly. Don't 🔵 everything.
5. Always specify where the output goes — silent routines get killed.

---

## 🅿️ Parking Lot (half-baked, uncategorized)

> Dump new ideas here first. Sort into sections later. No pressure to formalize immediately.

- 💡 [new idea goes here]

---

## 📌 Operating Notes

- Every routine should output to an issue, a PR, or a markdown file in `docs/` or a dedicated folder. **No silent routines.**
- Label every routine-generated issue with `routine:<n>` for effectiveness reports.
- If a routine hasn't produced an actionable finding in 60 days, **kill it and promote a queued idea.**
- **15 active cap.** Pick ruthlessly. The queue is where ambition lives.
- When in doubt about model choice → see PLAYBOOK's cost table. Default is Sonnet; Opus only for genuinely reasoning-heavy work.