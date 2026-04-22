# features/practice-highlight

Renders a preview of the current practice text with phoneme-containing words highlighted blue, trouble words highlighted yellow, and the sub-word letter group corresponding to the target phoneme bolded and underlined. Used by the Next Practice plan preview.

## Key Files

- `practice-highlight.js` — `renderPracticePreview(...)` — tokenizes text into words/separators, decides which letter spans belong to the target phoneme (via `features/convo/phoneme-spelling-map.js`), and emits HTML with `escapeHtml` applied to every token.

## Conventions

- All output is HTML-escaped before any highlight spans are wrapped. Never add a code path that emits user text without routing through `escapeHtml`.
- Tokenization preserves punctuation and whitespace so the highlighted preview is a faithful rendering of the input.

## See Also

- [features/next-activity/README.md](../next-activity/README.md) — primary caller
- [features/convo/phoneme-spelling-map.js](../convo/phoneme-spelling-map.js)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
