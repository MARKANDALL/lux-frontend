# admin

Standalone admin HTML pages. Each file is a self-contained, script-tag-based dashboard — not part of the Vite-bundled main app. Admin token is prompted for and stashed in `sessionStorage` under `lux_admin_token` (mirrors `K_ADMIN_TOKEN`).

## Key Files

- `index.html` — admin landing / overview with navigation.
- `overview.html` — aggregate charts (Chart.js via CDN): attempts, scores, session patterns.
- `user.html` — per-user attempt history, rollups, and inspection.

## Conventions

- Pages use vanilla JS inline in `<script>` blocks and pull Chart.js / other libraries from CDN — no bundler, no npm install path.
- All admin endpoints are gated behind `x-admin-token`; the page prompts once per session and caches to `sessionStorage`.
- Keep admin UI intentionally minimal — it is an operator tool, not a product surface.

## See Also

- [`_api/util.js`](../_api/util.js) — `apiFetch()` / `getAdminToken()` used by admin AJAX calls
- [`app-core/lux-storage.js`](../app-core/lux-storage.js) — `K_ADMIN_TOKEN` constant
