# SCENARIO CREATION CHECKLIST
Pass/fail gate for every new AI Conversation scenario.

## A. Code Entry (scenarios.js)
- [ ] `id` — lowercase, one word, unique, matches portrait filenames
- [ ] `title` — 2–4 words
- [ ] `desc` — one sentence, A2–B1 vocab, matches the image exactly
- [ ] `img` / `thumb` / `video` — `/convo-img/{id}.webp` · `/convo-img/thumbs/{id}.webp` · `/convo-vid/{id}.mp4` (or `""`)
- [ ] `more` — three bullets: (1) Setting, (2) Difficulties, (3) Objectives
- [ ] `roles` × 2 — each has `id`, `label`, `npc`, optional `ttsVoice`

## B. Role Rules
- [ ] Every role states gender (M/F) and age decade in the npc line
- [ ] Mixed-gender pairs → woman is the speaking role
- [ ] NPC principle: identity + scene function only — no personality traits, no mood, no conversational style
- [ ] Difficulties are role-neutral — apply equally to either side the learner might play
- [ ] Objectives are skill-named, not feeling-named

## C. Language
- [ ] A2–B1 ceiling — no B2+ vocabulary, no idioms
- [ ] Use "Difficulties" and "Objectives" (not hurdles/challenges/targets/goals)
- [ ] Desc and more line 1 don't repeat — less than 25% word overlap
- [ ] No emotional overlay in desc or more — no mood words, no tension-building adjectives
- [ ] Check repetition across full set — no word in more than ~4 scenario descriptions

## D. Image / Video Assets
- [ ] Image (1024×1024 WebP), thumbnail, video (8s MP4 or deferred), two character portraits (`{id}-{role.id}.webp`)
- [ ] Image matches description — if they conflict, rewrite text
- [ ] No camera stares, garbled text, AI generation artifacts

## E. Visual Audit (Internal Only — Not User-Facing)
Record per character: age range · race/ethnicity · gender · body type · clothing/wealth signals · disability if visible

## F. Portfolio Balance (After Adding)
- [ ] Gender balance even; women speak in mixed pairs
- [ ] Age spread across 20s–60s+, not clustered in 30s
- [ ] Ethnicity — no group overrepresented
- [ ] Setting variety — service, authority, social, professional, emergency, phone, video
- [ ] Socioeconomic range — not all middle-class
- [ ] No two scenarios too similar — if close, document the differentiator

## G. Final Gate
- [ ] Play through end-to-end locally
- [ ] Character cards show correct portraits and labels
- [ ] TTS voices match role genders
- [ ] AI bot stays on-scenario when user goes off-script