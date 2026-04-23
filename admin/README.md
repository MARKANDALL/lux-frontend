# admin

Internal admin dashboard HTML pages. These are standalone static pages that prompt for an admin token, then call the same `luxury-language-api` endpoints the main app uses — but with the `x-admin-token` header attached directly (not through `_api/util.js`).

## Key Files

- `overview.html` — Cohort overview. Shows aggregate attempts per user across a configurable time window (14 / 30 days), uses Chart.js for sparklines, and links to the per-user attempts and progress pages.
- `user.html` — Per-user attempts table. Prompts for the admin token, fetches recent attempts for a specified UID, and renders them in a sortable table.
- `index.html` — Per-user progress dashboard with charts (Chart.js). Writes the token into `sessionStorage` under the `lux_admin_token` key (mirrors `K_ADMIN_TOKEN`).

## Conventions

- **Admin-token-gated.** All three pages prompt for a token and stash it in `sessionStorage.lux_admin_token`. The key value must stay in sync with `K_ADMIN_TOKEN` in `app-core/lux-storage.js`.
- **No framework.** Each page is a single HTML file with inline `<script>` blocks and Chart.js loaded from CDN. No Vite entry, no module bundling.
- **Read-only surfaces.** These pages display admin data but do not mutate production state.

## See Also

- [_api/util.js](../_api/util.js) — how the main app attaches the same admin token
- Backend: [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api)
