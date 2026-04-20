# R11 · Frontend Accessibility Audit

<!-- Path: docs/routines/registry/R11-frontend-accessibility-audit.md — Live registry entry for the weekly frontend accessibility audit (paused). Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R11 · Frontend Accessibility Audit *(renamed 2026-04-20; was `lux-frontend-accessibility-audit`)*
- 🟡 Paused · `lux-frontend` · lux-specific · reactivation-candidate
- Thursdays 4:00 AM EDT (`0 4 * * 4`) · Opus 4.7 (1M) · cron
- **Output:** `kodama-reports/accessibility/YYYY-MM-DD.md` + draft PR "Accessibility audit — YYYY-MM-DD" + comment on issue "Accessibility Tracker" (creates if missing)
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-16 17:05 (manual — only run; paused before first scheduled fire)
- **Depends on:** —

## Prompt

```
You are performing a weekly accessibility audit on the Lux Pronunciation Tool frontend. ESL learners often use assistive technology — accessibility failures disproportionately affect this user base.

SCOPE: Scan .html, .js, .jsx. Skip node_modules/, dist/, _ARCHIVE/, _agents-archive/, underscore folders except _api/. Include all *.html files (dashboard.html, convo.html, progress.html, etc.).

CHECKS:

1. IMAGES WITHOUT ALT TEXT — Find <img> elements without an alt attribute. Empty alt="" is acceptable for purely decorative images; missing attribute entirely is not. Also check innerHTML strings and template literals constructing <img> tags.

2. INTERACTIVE ELEMENTS WITHOUT ACCESSIBLE NAMES — Find <button>, <a>, or elements with role="button" that have NO text content, NO aria-label, and NO aria-labelledby. Icon-only buttons are the main offender. Check both static HTML and dynamic DOM creation in .js (e.g., `el.innerHTML = '<button class="..."><svg>...</svg></button>'` with no aria-label).

3. FORMS WITHOUT LABELS — Find <input>, <select>, <textarea> not associated with a <label> via for/id, and lacking aria-label or aria-labelledby. Placeholder text alone is NOT sufficient — placeholders disappear on input and are invisible to many screen readers.

4. COLOR-ONLY STATE INDICATORS — Cases where status is conveyed by color alone (e.g., CSS classes .score-good/.score-warn/.score-bad applied without accompanying text, icon, or aria-label). Cap this check at top 5 most impactful cases — don't audit every .score-* instance.

5. HEADING HIERARCHY SKIPS — In HTML files, flag any heading structure that skips levels (h2 → h4 with no h3). Screen readers use hierarchy for navigation.

DO NOT FLAG:
- Decorative elements correctly using aria-hidden="true"
- Elements where accessible name is provided programmatically at mount time (if a mount* function attaches aria-label after creation, that's fine — mark as LOW if uncertain)
- Canvas/SVG visualizations with aria-label or <title> child

Self-check per finding: is there a programmatic path (event handler, mount function) that adds the attribute at runtime? If unsure, severity = LOW rather than HIGH.

OUTPUT:
- Create kodama-reports/accessibility/YYYY-MM-DD.md
- Draft PR titled "Accessibility audit — YYYY-MM-DD"
- Summary comment on GitHub issue titled "Accessibility Tracker" (create if missing)

REPORT STRUCTURE:
# Accessibility Audit — YYYY-MM-DD
## Summary
- Images without alt: [X]
- Interactive elements without accessible names: [X]
- Form inputs without labels: [X]
- Color-only indicators (top impact): [X]
- Heading hierarchy issues: [X]
## Findings
[Per check, each finding tagged HIGH / MED / LOW]
## Notes
[What the codebase does well — positive reinforcement matters]

RULES:
- Report only.
- Severity tiers: HIGH (blocks assistive tech), MED (significant barrier), LOW (minor / programmatically resolved).
- Cap each category at top 10 most impactful findings — don't dump 200.
- If a file is clean, say so.
```

## Notes

Paused during Tier-1 sprint. Maps to "Accessibility Sweep" in `LUX_ROUTINES_FROM_CATALOG.md` §4.

The prompt opens with an ESL-specific framing worth preserving on any rewrite: *"accessibility failures disproportionately affect this user base."*

Checks: missing alt text, interactive elements without accessible names, unlabeled form inputs, color-only indicators (cap 5), heading hierarchy skips.

Severity tiers HIGH/MED/LOW with a "self-check for programmatic attribute attachment" escape hatch that downgrades uncertain findings to LOW — a nice guard against false positives from mount-time aria application.

Per-category cap: 10 findings.

Explicit **"positive reinforcement matters"** line in the report Notes section — unusual for an audit prompt, worth keeping.

**✅ Utility Gate v2 applied 2026-04-20.** SHA-pinned, scope-filtered, scan-only-what-changed. Input globs: `'**/*.html' '**/*.js' '**/*.jsx'`. State file: `.routine-state/lux-frontend-accessibility-audit.sha`. Force-override: `[force-scan]` commit trailer OR `.routine-state/lux-frontend-accessibility-audit.force` sentinel. Safe to reactivate — the gate will prevent wasteful full-HTML-scans on quiet weeks.

`kodama-reports/accessibility/` output path is vestigial.
