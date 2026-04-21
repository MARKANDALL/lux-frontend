# admin

Small standalone admin surface for inspecting user progress. These pages use inline `<script>` rather than a Vite entry — they're minimal, rarely-changed tools meant for the author and any future admin.

Every page prompts for an admin token at load (cached to `sessionStorage` under `lux_admin_token`, mirroring `K_ADMIN_TOKEN` in [app-core/lux-storage.js](../app-core/lux-storage.js)) and injects it as a header on all API calls.

## Key Files

- `index.html` — User progress dashboard. Loads Chart.js from a CDN, hits admin-scoped endpoints on the backend, renders per-user attempt history.
- `overview.html` — Higher-level rollup across all users.
- `user.html` — Drill-down for a specific user.

## Conventions

- These pages are intentionally standalone HTML with inline scripts — they should never grow into a feature module. If something here gets complex, it belongs in `features/` with its own entry in [src/](../src/).
- Admin-token injection mirrors the runtime app — the token key and header name must match what the backend expects.
- No production styling pass — these are internal utilities.

## See Also

- [app-core/lux-storage.js](../app-core/lux-storage.js) — `K_ADMIN_TOKEN` constant
- [_api/util.js](../_api/util.js) — how the rest of the app injects the admin token
