# features/practice-highlight

Tokenises a practice passage and returns HTML with three visual layers: trouble phoneme-containing words (blue), trouble words (yellow), and sub-word letter groups corresponding to the target phoneme (bold underline). Used to preview what a Next Practice plan will focus on.

## Key Files

- `practice-highlight.js` — sole module. `tokenize()` splits text into word/separator tokens; renders HTML using phoneme-spelling rules from `features/convo/phoneme-spelling-map.js` and escapes via `helpers/escape-html.js`.

## Conventions

- Input text is treated as untrusted — always route through `escapeHtml` before inserting.
- Letter-group matching is rule-based (not per-word phoneme-dictionary lookup) to keep the preview synchronous.
- Keep the renderer pure: same input → same HTML, no DOM reads.

## See Also

- [`features/convo/phoneme-spelling-map.js`](../convo/phoneme-spelling-map.js) — the rule source
- [`features/next-activity/`](../next-activity/) — primary caller
