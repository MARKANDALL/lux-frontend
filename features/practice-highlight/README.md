# features/practice-highlight

Renders passage text with targeted visual highlighting: words containing the focus phoneme get blue, trouble words get yellow, and the specific letter group inside a word that maps to the phoneme gets bold-underline.

Surfaces a "preview" of a Next Practice Plan before the learner accepts it — they can see exactly what they're about to practice.

## Key Files

- `practice-highlight.js` — single-file module. Exports `renderPracticePreview` and the tokenization + highlighting logic.

## Conventions

- Tokenizes into `{word, sep}` pairs so whitespace and punctuation are preserved losslessly.
- Sub-word letter-group highlighting uses `getPhonemeSpellingRule` from [features/convo/phoneme-spelling-map.js](../convo/phoneme-spelling-map.js) — the mapping from IPA phoneme → likely English spelling is shared with Convo.
- All output runs through `escapeHtml` first — no raw text ever reaches `innerHTML`.

## See Also

- [features/next-activity/](../next-activity/) — the plan this module previews
- [features/convo/phoneme-spelling-map.js](../convo/phoneme-spelling-map.js) — phoneme-to-spelling mapping
