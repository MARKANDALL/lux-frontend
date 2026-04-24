# features/practice-highlight

Renders practice text with three layered highlights:

1. **Phoneme-containing words** (blue) — words that exercise the focus phoneme.
2. **Trouble words** (yellow) — words the learner has historically struggled with.
3. **Sub-word letter groups** (bold underline) — the specific letters inside a word that produce the focus phoneme.

Used by the Next Practice plan preview so the learner sees *why* a passage was chosen for them before they record it.

## Key Files

- `practice-highlight.js` — `renderPracticePreview`. Tokenizes the passage into words and separators (`/([a-zA-Z'-]+)|([^a-zA-Z'-]+)/g`), checks each word against the focus phoneme via `getPhonemeSpellingRule` from `features/convo/phoneme-spelling-map.js`, and emits HTML.

## Conventions

- All HTML output is escaped via `escapeHtml` from `helpers/escape-html.js` before any markup is added.
- Phoneme → spelling rule lookups must go through the canonical `phoneme-spelling-map.js` table — do not inline new rules here.
- Renderer is pure — it returns a string and never touches the DOM directly.

## See Also

- [`features/next-activity/next-practice.js`](../next-activity/next-practice.js) — primary caller
- [`features/convo/phoneme-spelling-map.js`](../convo/phoneme-spelling-map.js) — the canonical spelling-rule table
