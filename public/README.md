# public

Static assets served verbatim by Vite (no bundling, no hashing). Referenced by absolute `/...` paths from HTML and CSS.

## Key Files

- `convo-img/` — character portraits, scenario hero images, and generated WebP thumbnails (`convo-img/thumbs/`, produced by `scripts/make-thumbs.mjs`).
- `convo-vid/`, `vid/` — scenario background videos and other MP4/WEBM video loops.
- `vendor/` — third-party libraries pinned as static files: `wavesurfer-7.8.11.min.js`, `d3.v7.min.js`, `d3.layout.cloud.js`. Loaded via `<script>` rather than imported through the bundler.
- `assets/` — miscellaneous static assets (icons, images, etc.) referenced by pages and CSS.
- `lux-popover.js` — shared popover helper loaded as a static script on pages that don't bundle it.

## Conventions

- **Never import from `public/`.** Use paths like `/vendor/d3.v7.min.js` in HTML/CSS; do not `import` these files — Vite will not rewrite the path.
- **Thumbnails are generated.** Don't hand-edit files under `convo-img/thumbs/` — rerun `node scripts/make-thumbs.mjs` instead.
- **Pin vendor versions.** Files in `vendor/` include the version in the filename (`wavesurfer-7.8.11.min.js`) so an upgrade is an explicit filename change, not a silent content swap.

## See Also

- [scripts/make-thumbs.mjs](../scripts/make-thumbs.mjs) — generator for `convo-img/thumbs/`
