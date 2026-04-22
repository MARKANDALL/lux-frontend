# admin

Admin-only HTML pages for inspecting user progress and recent attempts. Each page prompts for the admin token (stored in `sessionStorage['lux_admin_token']`, matching `K_ADMIN_TOKEN` in `app-core/lux-storage.js`) and then calls admin-gated backend routes on `luxury-language-api`.

## Key Files

- `index.html` — User Progress admin page. Prompts for the admin token, loads Chart.js via CDN, renders per-user progress summaries.
- `overview.html` — Cross-user overview/rollup view.
- `user.html` — Per-user attempts table: loads recent attempts for a chosen user and renders them in a simple table.

## Conventions

- Admin pages are standalone HTML, not Vite entries — keep them that way so they can be served directly if the main app is broken.
- The token prompt lives inline at the top of each page so the admin surface never boots without one.
- No learner-facing UI goes here. These pages exist for operating the product, not using it.

## See Also

- [_api/util.js](../_api/util.js) — shared `getAdminToken` helper used by the main app
- Backend repo `luxury-language-api` for the admin-gated endpoints these pages call
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
