# Scenario Alignment Report — Pass 1 of 2 (Rerun)
## Scenarios 1–13 · 2026-04-24

> **Source evaluated:** `features/convo/scenarios.js` (file order, scenarios 1–13)
> **Rubric:** `docs/SCENARIO_ALIGNMENT_RUBRIC.md` (last revised 2026-04-23)
> **Scope:** Scenarios 1–13 in file order: `quick-practice`, `coffee`, `doctor`, `job`, `airport`, `restaurant`, `school`, `banking`, `calling`, `car`, `choosing`, `concern`, `party`
> **Method:** Each scenario scored on all 16 axis × layer cells (4 axes × 4 layers). Verdicts: **PASS**, **FAIL**, or **UNSURE** (borderline/needs tightening).
> **Note on `quick-practice`:** Template status is under separate review; scored against the rubric as written.
> **Note on `party`:** The `id=party` scenario is the 26th entry in `scenarios.js`. The rubric's canonical list names exactly 25 scenarios and does not include `party`. It is scored here against the rubric criteria as written; its canonical standing is a separate question. The rubric does reference a `[PASS: id=couple, axis=P, layer=bullets]` example whose text matches `party`'s targets line verbatim, suggesting `party` may have replaced or evolved from a prior `couple` entry that was never added to the canonical list.

---

## Executive Summary

**208 cells scored** (13 scenarios × 16 cells).

| Verdict | Count | % |
|---|---|---|
| PASS | 194 | 93.3 % |
| UNSURE | 7 | 3.4 % |
| FAIL | 7 | 3.4 % |

**Scenarios fully aligned (all 16 cells PASS): 6 of 13**
`doctor` · `airport` · `restaurant` · `school` · `calling` · `concern`

**Scenarios with at least one FAIL: 4 of 13**
`quick-practice` (3 FAILs) · `coffee` (1 FAIL) · `choosing` (1 FAIL) · `party` (2 FAILs)

**Scenarios with UNSURE only (no FAIL): 3 of 13**
`job` · `banking` · `car`

**Scenarios with both FAIL and UNSURE: 2 of 13**
`quick-practice` (1 UNSURE) · `party` (2 UNSUREs)

**Key findings for this pass:**

1. **`quick-practice` is the highest-risk scenario (3 FAILs).** Its descriptor is two sentences (violates the 1-sentence rule), its bullets lack a `Hurdles:` entry entirely (schema broken), and the second bullet introduces a named-system reference ("Lux wants to weave in specific sounds and words naturally") that constitutes an AI-method prescription — a P:FAIL. These defects are consistent with `quick-practice` being a template/meta scenario rather than a standard scene entry.

2. **`coffee` carries the one confirmed kind=real residual in this batch.** The barista NPC's "Repeats orders back to confirm" is the rubric's own flagged real-FAIL for P × roles and remains unresolved.

3. **`party` (non-canonical) has structural title and perspective problems.** Title is 6 words (limit is 4). The hurdles bullet anchors entirely to the newcomer's situation ("breaking into an existing conversation"), making it role-asymmetric. Additionally, `party` is absent from the rubric's canonical 25-scenario list and should be formally added or removed.

4. **`choosing` has a single title-length defect.** "Choose at the Grocery Store" is 5 words against a 4-word maximum; all other 15 cells are PASS.

5. **Length drift at roles upper boundary.** Three scenarios (`banking`, `car`, `party`) each have one NPC description at 22 words, matching the upper-tolerance boundary established by the rubric's `[FAIL: id=understanding, axis=L, layer=roles, kind=real]` example. These are flagged UNSURE rather than FAIL; tightening is advisable if descriptions grow further.

6. **`job` has a single CEFR borderline in bullets.** "professional register" uses the linguistics term "register" in a targets bullet; whether it clears the B1 pedagogical-term bar is uncertain. All other `job` cells are PASS.

7. **Axis E (Emotion) is clean across all 13 scenarios.** Zero FAIL or UNSURE cells on the emotion axis in this pass — no dramatizing adjectives appear in any layer.

---

## Per-Scenario Sections

---

### 1. `quick-practice` — "Quick Practice"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | **FAIL** | PASS | PASS | PASS |
| bullets | **FAIL** | PASS | PASS | **FAIL** |
| roles | PASS | PASS | PASS | **UNSURE** |

**FAIL — descriptor × L**
The descriptor is two sentences ("A relaxed, open-ended conversation focused on natural speaking practice. There is no rigid setting, so the topic can drift wherever it feels most natural."). The rubric requires exactly one sentence per descriptor.

**FAIL — bullets × L**
The three-bullet schema must be `setting · hurdles · targets`. The second bullet ("Best for targeted pronunciation practice when Lux wants to weave in specific sounds and words naturally") is neither a `Hurdles:` entry nor follows that label schema. The `Hurdles:` slot is absent entirely, making this a schema break rather than a word-count issue.

**FAIL — bullets × P**
The second bullet prescribes AI system behavior: "Lux wants to weave in specific sounds and words naturally." This assigns an intention and a conversational method to the Lux AI rather than framing a neutral scene situation. The P criterion requires bullets to frame the situation, not to script any actor's method — including the system's.

**UNSURE — roles × P**
The Learner NPC reads: "Someone doing a focused speaking practice conversation. Trying to speak naturally and clearly." The phrase "Trying to speak naturally and clearly" describes a behavioral goal or manner of speaking for the character, which borders on the method-scripting class the rubric prohibits. It is less directive than "Repeats orders back to confirm" but not purely identity + scene function. Flag for review; given `quick-practice`'s special template status this may be intentional.

---

### 2. `coffee` — "Order Coffee"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | **UNSURE** | **FAIL** |

**FAIL — roles × P**
The barista NPC: "A café worker in her 20s on a busy morning shift. Repeats orders back to confirm." The clause "Repeats orders back to confirm" is a conversational-method instruction — it scripts *how* the character interacts rather than stating identity or scene function. This is the rubric's own `[FAIL: id=coffee, axis=P, layer=roles, kind=real]` example, flagged as a known residual pending tightening.

**UNSURE — roles × C**
The customer NPC describes the character as "Decisive." The rubric's C criterion for roles requires "B1 descriptors for age/role/trait." "Decisive" is listed at C1 on the Oxford 5000 and is above the B2 tolerance ceiling. "Direct," "clear about what they want," or similar B1-level phrasing would align. Not a hard FAIL because CEFR-J placement can vary, but the word warrants replacement.

---

### 3. `doctor` — "Doctor Visit"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | PASS |

No issues. All 16 cells PASS.

The role length asymmetry (Patient: 17 words; Doctor: 4 words) is explicitly validated by the rubric's own `[PASS: id=doctor, axis=L, layer=roles]` example, which marks both as "brief, well within tolerance." The setting bullet's reference to "the doctor asks follow-up questions" describes a typical scene dynamic, not a conversational-method prescription, and clears the P × bullets bar.

---

### 4. `job` — "Job Interview"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | **UNSURE** | PASS |
| roles | PASS | PASS | PASS | PASS |

**UNSURE — bullets × C**
The targets bullet includes "professional register." While "professional register" is common in language-teaching materials, "register" is a linguistics/applied-SLA term that a B1 learner may not decode without teacher mediation. The rubric's C criterion for bullets explicitly prohibits linguistics jargon. "Formal language" or "professional vocabulary" would be B1-safe alternatives. Borderline; marking UNSURE rather than FAIL given common usage in EFL contexts.

---

### 5. `airport` — "Airport Problem"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | PASS |

No issues. All 16 cells PASS. Descriptor, bullets, and roles are all cited as PASS examples in the rubric.

---

### 6. `restaurant` — "Restaurant Order"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | PASS |

No issues. All 16 cells PASS. Descriptor and targets bullets are cited as PASS examples in the rubric.

---

### 7. `school` — "School Meeting"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | PASS |

No issues. All 16 cells PASS. Descriptor is cited as a P × descriptor PASS example in the rubric. Teacher role is cited as a C × roles PASS example.

---

### 8. `banking` — "Open a Bank Account"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | **UNSURE** | PASS | PASS | PASS |

**UNSURE — roles × L**
The customer NPC is 22 words ("Someone in their 20s who just moved to the area. Has questions about accounts but tends to hold back rather than ask."). The rubric's `[FAIL: id=understanding, axis=L, layer=roles, kind=real]` example flags 22 words as the upper-tolerance boundary for a single NPC description. This cell matches that boundary exactly. Not a hard FAIL, but the description is at risk of drifting further and should not grow. The bank-rep NPC (13 words) is well within range and is a C × roles PASS example in the rubric.

---

### 9. `calling` — "Make a Phone Call"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | PASS |

No issues. All 16 cells PASS. Targets bullet is cited as a C × bullets PASS example in the rubric. Caller NPC is 20 words — within L tolerance per rubric standards established by the doctor PASS example.

---

### 10. `car` — "Conversation in the Car"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | **UNSURE** | PASS | PASS | PASS |

**UNSURE — roles × L**
The passenger NPC is 22 words ("A friend in their 30s who's a bit quieter today. Will chat if topics come up but is also comfortable with silence."). As with `banking` above, this matches the upper-tolerance boundary established by the rubric's understanding FAIL example. The passenger NPC's opening phrase is the rubric's own `[PASS: id=car, axis=E, layer=roles]` example, so E is clean; the length concern is the only flag. The driver NPC (15 words) is well within range.

---

### 11. `choosing` — "Choose at the Grocery Store"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | **FAIL** | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | PASS |

**FAIL — title × L**
"Choose at the Grocery Store" is 5 words. The rubric's L × title criterion is 2–4 words. The fix is straightforward: "Grocery Store Choice," "At the Grocery Store," or "Grocery Store Help" would bring the title within range and remain situation-named. The descriptor (a rubric PASS example for C × descriptor) and all other layers are clean.

---

### 12. `concern` — "Raise a Concern"

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | PASS |

No issues. All 16 cells PASS. Title and tenant-role NPC are both cited as PASS examples in the rubric (E × title and E × roles respectively).

---

### 13. `party` — "Chat with Strangers at a Party"

> **Canonical status:** `id=party` is not present in the rubric's canonical 25-scenario list. It is the 26th entry in `scenarios.js`, inserted between `concern` and `dinner`. Scored against the rubric as written; its addition to the canonical list (and to the rubric's scope and tag examples) is a separate action item.

| Layer | L | E | C | P |
|---|---|---|---|---|
| title | **FAIL** | PASS | PASS | **UNSURE** |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | **FAIL** |
| roles | **UNSURE** | PASS | PASS | PASS |

**FAIL — title × L**
"Chat with Strangers at a Party" is 6 words. The rubric's L × title criterion is 2–4 words. Candidate replacements: "Party Conversation," "Meet at a Party," or "Party Introductions."

**UNSURE — title × P**
"Chat with Strangers at a Party" uses "Strangers" from a vantage point where the speaker is the one who doesn't know anyone — that is, the newcomer's perspective. The party regulars already know each other and would not describe the newcomer as more than one stranger. The rubric requires a title that "works regardless of which role the learner will play." "Party Conversation" or "Party Introductions" are role-neutral alternatives.

**FAIL — bullets × P**
The hurdles bullet: "breaking into an existing conversation · keeping talk balanced · leaving gracefully." The first hurdle, "breaking into an existing conversation," applies exclusively to the newcomer — someone arriving at an already-in-progress conversation. The party regulars face no such hurdle; they are already in the conversation. The rubric's P criterion for bullets requires hurdles to apply symmetrically regardless of which role the learner plays. The second and third hurdles ("keeping talk balanced," "leaving gracefully") are symmetric and would survive a rewrite; the first does not.

**UNSURE — roles × L**
The newcomer NPC is 22 words ("Someone in their late 20s who arrived at the party alone. Takes a moment to warm up once a conversation gets going."). Same upper-boundary concern as `banking` and `car`. The regulars NPC is 13 words, well within range.

---

## Cross-Scenario Patterns

**Axis E is clean across all 13 scenarios.** No dramatizing adjectives appear in any title, descriptor, bullets, or roles layer in this batch. The emotion axis is the most consistently aligned.

**Axis P failures concentrate in two categories:**
- *Method scripting in roles:* `coffee` barista ("Repeats orders back to confirm"). Known residual (kind=real). One instance.
- *POV anchoring in bullets:* `quick-practice` (Lux system reference) and `party` (newcomer-only hurdle). Two instances.

**Axis L failures concentrate in titles:**
`choosing` (5 words) and `party` (6 words) both exceed the 4-word ceiling. The 22-word upper-bound concern surfaces as UNSURE in `banking`, `car`, and `party` roles — consistent with the rubric's understanding warning.

**Axis C has no confirmed FAILs.** One FAIL-risk (`coffee` "Decisive") and one borderline jargon case (`job` "professional register") are flagged as UNSURE.

---

*End of Part 1 — scenarios 1–13. Part 2 will cover scenarios 14–26 (`dinner` through `hiking`).*
