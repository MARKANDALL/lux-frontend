# admin

Admin-only HTML pages for inspecting live data. Each page is a self-contained `<script>`-driven view behind an admin-token prompt — they are not part of the main learner surface and are not linked from the public UI.

## Key Files

- `index.html` — admin landing page. Prompts for the admin token on load (mirrors `K_ADMIN_TOKEN` from `app-core/lux-storage.js`) and stores it in `sessionStorage`.
- `overview.html` — cross-user overview / aggregate charts (uses Chart.js from CDN).
- `user.html` — per-user deep dive: attempt history, rollups, trouble sounds.

## Conventions

- **Token-gated.** Every page checks `sessionStorage.lux_admin_token` before hitting any endpoint. Never bake tokens into the HTML.
- **CDN for charting.** Admin pages load Chart.js from a CDN at `<script src=...>` rather than going through Vite — keeps these pages usable even if the main bundle breaks.
- **Static, no framework.** Pages are plain HTML + inline JS; avoid pulling in feature code. Admin is intentionally separate from the learner app.

## See Also

- [_api/util.js](../_api/util.js) — `K_ADMIN_TOKEN` and `getAdminToken()` used by the learner-side UI with the same storage key
- [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api) — the admin endpoints these pages hit
