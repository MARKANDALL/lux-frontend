# admin

Admin-only HTML pages for inspecting cohort data, individual user attempts, and per-user progress. These are intentionally minimal: inline HTML/CSS/JS, no Vite imports, no build step. They prompt for the admin token on load and store it in `sessionStorage` under `lux_admin_token` (mirrors `K_ADMIN_TOKEN` from `app-core/lux-storage.js`).

## Pages

- `index.html` — User Progress: pulls one user's attempt history and renders score/trouble dashboards (uses Chart.js from CDN).
- `overview.html` — Cohort Overview: aggregate metrics across users with sparkline rendering.
- `user.html` — Attempts: simple table of the most recent attempts for a single UID.

All three share the same top nav linking between them.

## Conventions

- These pages are deliberately framework-free. Adding Vite imports here would force a build step and pull them into the main bundle — do not.
- The admin token is sourced from `sessionStorage` so it doesn't leak into long-term storage. Never persist it to `localStorage`.
- Chart.js is pulled from `cdn.jsdelivr.net` — no local bundling.
- The backend admin routes that these pages call live in [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api) and require the `Authorization: Bearer <admin-token>` header.

## See Also

- [`_api/util.js`](../_api/util.js) for `apiFetch`'s admin-token injection (the production path used by everything outside `admin/`)
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
