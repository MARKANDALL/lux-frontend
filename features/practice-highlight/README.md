# features/practice-highlight

Renders the highlighted practice-preview text — words containing a target phoneme appear blue, trouble words appear yellow, and the specific letters inside a word that correspond to the target phoneme are bold-underlined.

## Key Files

- `practice-highlight.js` — `renderPracticePreview(...)` — tokenizes text into words + separators, looks up phoneme-spelling rules via `features/convo/phoneme-spelling-map.js`, and emits escaped HTML with layered class tags.

## Conventions

- **Always escape.** Every rendered token goes through `helpers/escape-html.js` before class tags are added. Never inject raw user text.
- **Single public function.** Consumers call `renderPracticePreview`; the internal `tokenize` and `normWord` helpers are not exported.

## See Also

- [features/next-activity/next-practice.js](../next-activity/next-practice.js) — the primary caller
- [features/convo/phoneme-spelling-map.js](../convo/phoneme-spelling-map.js) — the phoneme→spelling rule table
