# Scenario Alignment Rubric

> **Purpose:** Source of truth for the four-axis × four-layer alignment criteria applied to every entry in `features/convo/scenarios.js`. Downstream QA routines (e.g. the Scenario Four-Axis Neutrality Drift Watcher in `docs/routines/LUX_ROUTINES_FROM_CATALOG.md`) consume this file as machine-readable spec.
>
> **Scope:** The 25 scenarios currently defined in `features/convo/scenarios.js` (Step 2 stricter-NPC-pass baseline, 2026-04-03). All 25 are treated as the aligned reference set.
>
> **Last revised:** 2026-04-23.

---

## Legend

- **Axes** (bias dimensions, per `scenarios.js` header):
  - `L` = **Length** — text mass uniformity across scenarios.
  - `E` = **Emotion** — tonal neutrality; factual over dramatized.
  - `C` = **CEFR** — level-appropriate vocabulary accessible to B1 readers.
  - `P` = **Perspective** — situational framing without learner-POV steering or NPC conversational-method scripting.
- **Layers** (fields in each scenario object):
  - `title` — the `title` string.
  - `descriptor` — the `desc` string.
  - `bullets` — the three `more` bullets (setting · hurdles · targets).
  - `roles` — the `npc` strings inside each `roles[]` entry.
- **Scenario ids** — the `id` field on each entry in `features/convo/scenarios.js`. Canonical ids: `quick-practice`, `coffee`, `doctor`, `job`, `airport`, `restaurant`, `school`, `banking`, `calling`, `car`, `choosing`, `concern`, `couple`, `dinner`, `joke`, `lifeguard`, `mail`, `networking`, `parking`, `police`, `shopping`, `student`, `technology`, `understanding`, `videocall`, `hiking`.
- **Example tag grammar:**
  - `[PASS: id=<scenario-id>, axis=<L|E|C|P>, layer=<title|descriptor|bullets|roles>]` — verbatim quote from current `scenarios.js` that exemplifies alignment on this axis × layer.
  - `[FAIL: id=<scenario-id>, axis=<X>, layer=<L>, kind=real]` — verbatim quote from current `scenarios.js` that is borderline or residual on this axis × layer (flagged for tightening).
  - `[FAIL: id=<scenario-id>, axis=<X>, layer=<L>, kind=drift-rewrite]` — **synthesized** hypothetical drift of the named scenario, not present in the file; illustrates what a regression on this axis × layer would look like.
- **Tolerance defaults** (rubric-wide, QA routines may override):
  - Length: per-layer word counts within ±50% of the 25-scenario median for that layer.
  - Emotion: zero dramatizing adjectives (panic, desperate, furious, overwhelming, thrilling, heartbreaking, etc.).
  - CEFR: vocabulary ≤ B2 on the Oxford 5000 / CEFR-J lists; rare technical jargon allowed only when the scenario domain requires it and the word is the simplest available term.
  - Perspective: no second-person imperatives, no imposed learner stance ("you think X"), no NPC conversational-method instructions ("will say X", "responds by Y", "repeats back").

---

## Summary Table

| Layer ↓ / Axis → | Length (L) | Emotion (E) | CEFR (C) | Perspective (P) |
|---|---|---|---|---|
| **Title** | 2–4 words, uniform across set | Event-factual, no dramatizing adjectives | A1–A2 common vocabulary | Situation-named, not stance-named |
| **Descriptor** | 1 sentence, 12–28 words | Stakes factual, not coloured | B1 everyday vocabulary, short clauses | Third-person scene sketch, no learner POV |
| **Bullets** | 3 parallel bullets, 8–20 words each, fixed setting · hurdles · targets schema | Hurdles stated factually, not catastrophized | Neutral pedagogical terms, no linguistics jargon | Frames the situation, not one role's internal state |
| **Roles** | 1–2 sentences per NPC, roughly matched between the two roles | Character traits restrained, no emotional amplifiers | B1 descriptors for age/role/trait | Identity + scene function only; no conversational-method scripting |

---

## Axis L — Length

### L × title

**Aligned:** Titles are 2–4 words naming the scene in plain noun-phrase form. Length is uniform across the 25-entry set so the picker deck reads as a grid of peers, not a mix of headlines and tags.

**Drift:** A title grows into a descriptive sentence, or collapses to a single bare noun, breaking the visual rhythm of the picker deck.

- `[PASS: id=doctor, axis=L, layer=title]` → "Doctor Visit"
- `[PASS: id=parking, axis=L, layer=title]` → "Parking Ticket Situation"
- `[FAIL: id=coffee, axis=L, layer=title, kind=drift-rewrite]` → "Order a Complicated Latte During the Packed Monday Morning Rush at a Popular Café"

### L × descriptor

**Aligned:** A single sentence of roughly 12–28 words that establishes place, stakes, and texture without exposition. The 25-scenario median is ~18 words.

**Drift:** Descriptor becomes a paragraph with multiple sentences, or shrinks below ~10 words and loses scene texture.

- `[PASS: id=airport, axis=L, layer=descriptor]` → "A cancelled flight, a long rebooking line, and a connection to save."
- `[PASS: id=restaurant, axis=L, layer=descriptor]` → "A busy restaurant meal where dietary needs, wrong orders, and specials all come into play."
- `[FAIL: id=airport, axis=L, layer=descriptor, kind=drift-rewrite]` → "A cancelled flight has thrown everything off. There is a long rebooking line. Documents must be produced. A connecting flight is still possible if everything goes right in the next hour."

### L × bullets

**Aligned:** Exactly three bullets in the fixed schema — setting beat · hurdles · targets — each 8–20 words, with hurdles and targets rendered as middle-dot-separated clauses.

**Drift:** A bullet runs past ~25 words, a fourth bullet appears, the middle-dot schema is abandoned, or one of the three slots is dropped.

- `[PASS: id=coffee, axis=L, layer=bullets]` → "Hurdles: noisy environment · mishearing size or milk options · a growing line"
- `[PASS: id=banking, axis=L, layer=bullets]` → "Targets: requesting repetition · comparing options · confirming understanding"
- `[FAIL: id=coffee, axis=L, layer=bullets, kind=drift-rewrite]` → "Hurdles: a noisy environment full of espresso machines, baristas calling out names, and other customers chatting, which makes it hard to hear when the barista asks about size, milk type, sweetener, and temperature, all while a line of impatient commuters grows longer behind the customer"

### L × roles

**Aligned:** Each `npc` is 1–2 sentences. The two NPCs in a scenario are roughly matched in word count so neither side feels more authored than the other.

**Drift:** One NPC is a page of backstory while the other is a stub; or a single NPC balloons into a character sheet.

- `[PASS: id=doctor, axis=L, layer=roles]` → "A physician in her 40s." (4 words) paired with "Someone in their 30s visiting for a new symptom. Not sure how to describe what's going on." (17 words) — both sides are brief, well within tolerance.
- `[PASS: id=joke, axis=L, layer=roles]` → "A coworker in their 30s on lunch break." (9 words)
- `[FAIL: id=understanding, axis=L, layer=roles, kind=real]` → "A coworker in their 30s who tends to take things literally. Reads emails quickly and sometimes jumps to conclusions before asking follow-ups." (22 words) — borderline; near the upper tolerance and trending toward behavioral description. Flag for tightening if it grows further.
- `[FAIL: id=doctor, axis=L, layer=roles, kind=drift-rewrite]` → "A physician in her 40s who trained at Johns Hopkins, completed a fellowship in internal medicine, has two children, runs marathons on weekends, and prefers a collaborative bedside manner…"

---

## Axis E — Emotion

### E × title

**Aligned:** Titles name the event in neutral, event-factual language. No dramatizing adjective decorates the scenario.

**Drift:** Titles use words like "desperate", "crisis", "nightmare", "heartbreaking" to preload emotional stakes the scene itself should carry neutrally.

- `[PASS: id=lifeguard, axis=E, layer=title]` → "Beach Emergency" — states the event type, not the panic.
- `[PASS: id=concern, axis=E, layer=title]` → "Raise a Concern" — action-neutral.
- `[FAIL: id=lifeguard, axis=E, layer=title, kind=drift-rewrite]` → "Desperate Panic at the Beach"

### E × descriptor

**Aligned:** Stakes are set with concrete nouns and small verbs. The reader infers urgency from the scene, not from mood words.

**Drift:** Emotionally loaded adjectives and adverbs do the work the scene should do ("devastating", "frantic", "overwhelmingly").

- `[PASS: id=airport, axis=E, layer=descriptor]` → "A cancelled flight, a long rebooking line, and a connection to save." — urgency via facts.
- `[PASS: id=dinner, axis=E, layer=descriptor]` → "Two old friends catching up over dinner — stories to tell, news to share, and a long evening ahead." — warmth via specifics, no saccharine.
- `[FAIL: id=airport, axis=E, layer=descriptor, kind=drift-rewrite]` → "A devastating cancellation, an exhausting line, and a connection that desperately needs saving."

### E × bullets

**Aligned:** The hurdles bullet lists concrete obstacles. Targets are skill-named, not feeling-named.

**Drift:** Hurdles list internal emotional states as if they were scene obstacles ("panic", "shame", "crushing anxiety").

- `[PASS: id=lifeguard, axis=E, layer=bullets]` → "Hurdles: losing clarity in the moment · not knowing safety vocabulary · hesitating to interrupt" — behavioral friction, not affect.
- `[PASS: id=job, axis=E, layer=bullets]` → "Hurdles: underselling experience · losing focus mid-answer · pausing after tough questions"
- `[FAIL: id=lifeguard, axis=E, layer=bullets, kind=drift-rewrite]` → "Hurdles: paralyzing panic · racing heartbeat · overwhelming guilt"

### E × roles

**Aligned:** Character traits are described in neutral, observational language. Where a disposition appears ("quieter today", "a lot going on"), it is offered as colour, not amplified.

**Drift:** NPCs get emotional-state labels as identity ("furious tenant", "anxious student", "heartbroken friend").

- `[PASS: id=concern, axis=E, layer=roles]` → "A tenant in their 30s with a real maintenance problem that hasn't been fixed." — the grievance is named factually; the tenant is not labelled "angry".
- `[PASS: id=car, axis=E, layer=roles]` → "A friend in their 30s who's a bit quieter today."
- `[FAIL: id=concern, axis=E, layer=roles, kind=drift-rewrite]` → "An enraged tenant, fed up and seething, who has been emotionally worn down by months of negligence."

---

## Axis C — CEFR

### C × title

**Aligned:** Titles use A1–A2 common vocabulary — words any beginner reader recognises. Any domain noun (bank, doctor, airport) is itself high-frequency.

**Drift:** Titles reach for C1+ or Latinate formal vocabulary that obscures what the scenario is about.

- `[PASS: id=banking, axis=C, layer=title]` → "Open a Bank Account"
- `[PASS: id=mail, axis=C, layer=title]` → "Ask about Mail"
- `[FAIL: id=parking, axis=C, layer=title, kind=drift-rewrite]` → "Contesting Municipal Parking Adjudication"

### C × descriptor

**Aligned:** B1 everyday vocabulary, short coordinated clauses. Where a phrase leans idiomatic ("won't wait", "on the spot"), it is a high-frequency collocation a B1 reader can decode.

**Drift:** Rare idioms, dense nominalisations, or domain jargon that a B1 reader would need a dictionary for.

- `[PASS: id=coffee, axis=C, layer=descriptor]` → "A morning rush, a café line that won't wait, and an order to get right the first time."
- `[PASS: id=choosing, axis=C, layer=descriptor]` → "A grocery store aisle, a missing ingredient, and a decision to make on the spot."
- `[FAIL: id=coffee, axis=C, layer=descriptor, kind=drift-rewrite]` → "An unforgiving matinal queue that brooks no dithering when articulating one's preferred order of bespoke espresso beverages."

### C × bullets

**Aligned:** Hurdles and targets use plain pedagogical terms ("requesting repetition", "describing symptoms", "asking for clarification") that a B1 learner can read and self-assess against.

**Drift:** Linguistics or applied-SLA jargon ("illocutionary force", "pragmatic competence", "turn-taking prosody") that only a teacher would parse.

- `[PASS: id=restaurant, axis=C, layer=bullets]` → "Targets: making requests · addressing mistakes · menu vocabulary · dietary restriction language"
- `[PASS: id=calling, axis=C, layer=bullets]` → "Targets: phone openings and closings · spelling and number dictation · requesting repetition"
- `[FAIL: id=restaurant, axis=C, layer=bullets, kind=drift-rewrite]` → "Targets: illocutionary force modulation · gastronomic pragmatic competence · deictic reference repair"

### C × roles

**Aligned:** NPC descriptions use B1 vocabulary for age, job, and trait ("experienced teacher", "walks customers through", "knows the store well"). Job titles are the common-register version (teacher, not pedagogue).

**Drift:** Formal or rare vocabulary for what should be a plainspoken identity line.

- `[PASS: id=school, axis=C, layer=roles]` → "An experienced teacher in her 30s with prepared observations."
- `[PASS: id=mail, axis=C, layer=roles]` → "A postal worker in her 40s who handles hundreds of people a day. Knows the services and options well."
- `[FAIL: id=school, axis=C, layer=roles, kind=drift-rewrite]` → "A seasoned pedagogue in her 30s bearing meticulously curated didactic observations."

---

## Axis P — Perspective

### P × title

**Aligned:** Title names the situation without taking a side or issuing an imperative to the learner. The same title works regardless of which role the learner will play.

**Drift:** Title embeds a stance ("Fight an unfair…"), a verdict ("A Rude Barista"), or steers the learner toward one role's feelings.

- `[PASS: id=parking, axis=P, layer=title]` → "Parking Ticket Situation" — neutral across driver and officer roles.
- `[PASS: id=understanding, axis=P, layer=title]` → "Clear Up a Misunderstanding" — neutral across both coworkers.
- `[FAIL: id=parking, axis=P, layer=title, kind=drift-rewrite]` → "Fight an Unfair Parking Ticket"

### P × descriptor

**Aligned:** Third-person scene sketch. Both roles are visible in the framing; neither is treated as the "real" protagonist.

**Drift:** Second-person address, an imposed learner stance, or a descriptor that only makes sense from one role's POV.

- `[PASS: id=parking, axis=P, layer=descriptor]` → "A parking ticket, an officer still nearby, and two sides of the story." — explicit both-sides framing.
- `[PASS: id=school, axis=P, layer=descriptor]` → "A parent-teacher conference where both sides discuss progress, expectations, and next steps."
- `[FAIL: id=parking, axis=P, layer=descriptor, kind=drift-rewrite]` → "A parking ticket you didn't deserve, an officer who won't listen, and your last chance to explain yourself."

### P × bullets

**Aligned:** Bullets describe the situation and the skill surface it exercises. Hurdles and targets apply symmetrically regardless of which role the learner plays.

**Drift:** Bullets phrase hurdles or targets from one role's vantage point, or prescribe emotional stances toward the other role.

- `[PASS: id=networking, axis=P, layer=bullets]` → "Hurdles: stumbling over self-introductions · gaps in the conversation · not knowing when to wrap up" — applies to both the newcomer and the veteran.
- `[PASS: id=couple, axis=P, layer=bullets]` → "Targets: introductions · small talk · finding common ground · social exit phrases"
- `[FAIL: id=networking, axis=P, layer=bullets, kind=drift-rewrite]` → "Targets: breaking the ice with the intimidating senior professional before she loses interest" — pre-assigns which role is the learner and colours the other role.

### P × roles

**Aligned:** Each `npc` is identity + scene function only — age, profession, a brief trait or situational fact. The learner can play either side and get a coherent partner; the AI can play either side without a script.

**Drift:** The `npc` instructs *how the character converses* ("responds by restating", "always asks follow-ups", "repeats orders back to confirm") or imposes a POV on the learner ("believes the sign was unclear"). This is the exact drift class the 2026-04-03 stricter-NPC pass removed and the class QA routines must watch for.

- `[PASS: id=banking, axis=P, layer=roles]` → "A bank representative in his 40s who walks customers through the account-opening process." — scene function, not conversational method.
- `[PASS: id=airport, axis=P, layer=roles]` → "An airline agent in her 30s handling rebookings at the gate."
- `[FAIL: id=coffee, axis=P, layer=roles, kind=real]` → "A café worker in her 20s on a busy morning shift. Repeats orders back to confirm." — the "repeats orders back to confirm" clause is a conversational-method instruction and is the most drift-prone residual in the current set. Flag for tightening.
- `[FAIL: id=parking, axis=P, layer=roles, kind=real]` → "A driver in their 30s who just found a ticket on the windshield. Believes the sign was unclear and wants to understand the appeals process." — "believes the sign was unclear" imposes a stance on whichever side the learner plays. Flag for tightening.
- `[FAIL: id=doctor, axis=P, layer=roles, kind=drift-rewrite]` → "A physician in her 40s who responds by asking open-ended follow-up questions, then summarizes the patient's symptoms back in plain language."

---

## Using this rubric in QA routines

A routine that consumes this file should:

1. Parse the Summary Table to get the per-cell one-line criterion.
2. Parse each `### <Axis> × <layer>` block for the full Aligned / Drift definitions.
3. Parse `[PASS: ...]` and `[FAIL: ...]` tag lines as structured records: `id`, `axis`, `layer`, and (for FAIL) `kind`.
4. For each scenario in `features/convo/scenarios.js`, score the four layers against the four axes and emit a 16-cell verdict per scenario.
5. Flag any `kind=real` FAIL tag as a known residual; regressions past those should be surfaced as new drift.
6. Tolerances listed in the Legend are defaults — routines may tighten them but must log the override.

When this rubric is updated, bump the `Last revised` date at the top and keep the tag grammar stable; downstream parsers depend on it.
