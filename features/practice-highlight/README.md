# features/practice-highlight

Renders practice-passage text with phoneme-aware highlighting. Words that contain the focus phoneme get a blue background (`lux-hl2`); trouble words get a yellow background (`lux-hl`); words that are both get the double-hit style. Within a focus-phoneme word, the specific letters producing the phoneme get an additional bold-underline (`lux-hl-letters`) driven by `phoneme-spelling-map`.

## Key Files

- `practice-highlight.js` — The whole module. `tokenize(text)` (words + separators), `normWord`, and the main `renderPracticePreview({ text, focusIpa, troubleWords })` that emits escaped HTML. Import dependency on `features/convo/phoneme-spelling-map.js` for IPA → common spelling rules.

## Conventions

- **Always escape first.** HTML output is built by inserting escaped words into spans; never bypass `escapeHtml`.
- **Class taxonomy.** `lux-hl` = trouble-word yellow, `lux-hl2` = focus-phoneme blue, `lux-hl-letters` = sub-word letter-group bold underline. Don't invent parallel class names.
- **Input is passage text + a single focus IPA phoneme.** The planner in `features/next-activity/next-practice.js` picks the focus phoneme — this module just renders it.

## See Also

- [features/next-activity/next-practice.js](../next-activity/next-practice.js) — the primary caller
- [features/convo/phoneme-spelling-map.js](../convo/phoneme-spelling-map.js)
