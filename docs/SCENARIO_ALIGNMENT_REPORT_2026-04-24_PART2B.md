# Scenario Alignment Report — Pass 2B of 2
**Scenarios scored:** 21–26 (file order) · `shopping`, `student`, `technology`, `understanding`, `videocall`, `hiking`
**Rubric source:** `docs/SCENARIO_ALIGNMENT_RUBRIC.md` (last revised 2026-04-23)
**Scored against:** `features/convo/scenarios.js` SHA `9dd6ab0` (Step 2 stricter-NPC-pass baseline)
**Date:** 2026-04-24

---

## Executive Summary (Pass 2B)

96 cells scored (6 scenarios × 16 axis × layer cells).

| Verdict | Count | % |
|---|---|---|
| PASS | 85 | 88.5 % |
| FAIL | 9 | 9.4 % |
| UNSURE | 2 | 2.1 % |

**All 9 FAILs cluster in two axes: L (Length) and P (Perspective).** Axes E (Emotion) and C (CEFR) are clean across all 6 scenarios — zero failures, zero UNSURE.

**L failures (2):** Both in the `title` layer. `videocall` ("Video Call with a Colleague") and `hiking` ("Chat on a Winter Hike") each reach 5 words, one above the 2–4 word ceiling.

**P failures (7):** Split across `title`, `bullets`, and `roles` layers.
- `title`: `student` — second-person possessive "Your Teacher" anchors the learner in one role.
- `bullets`: `shopping` and `technology` — hurdles/targets are role-asymmetric (shopper-side and user-side, respectively).
- `roles`: `student`, `technology`, `videocall` — NPC descriptions include conversational-method instructions (the same drift class the rubric flags for `coffee` barista).

**UNSURE (2):** `student` P×bullets (three of five items are student-centric but two are symmetric) and `understanding` P×roles (both NPCs describe behavioral patterns that approach but do not clearly cross the method-scripting threshold).

No FAILs in `understanding` or `hiking` beyond L×roles (already confirmed `kind=real` by the rubric) and L×title respectively. `hiking` is the blank-template scenario designated for passage-generated AI convos; its single L×title failure is a real rubric deviation, not a template artifact.

---

## Scenario 21 — `shopping` · "Shopping Assistance"

### Verdict table

| Layer \ Axis | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | **FAIL** |
| roles | PASS | PASS | PASS | PASS |

### Rationales

**FAIL P×bullets**
Hurdles: `not knowing sizes in another system · navigating add-on offers · describing preferences clearly`
Targets: `declining offers · describing preferences · retail vocabulary · making a decision`

"Not knowing sizes in another system" and "describing preferences clearly" are squarely shopper-side — a sales associate would not face either obstacle. "Declining offers" only makes sense from the shopper's position; the associate is the one extending offers, not declining them. "Navigating add-on offers" is ambiguous but reads as shopper-perspective in context.

The rubric criterion for P×bullets: hurdles and targets should apply symmetrically regardless of which role the learner plays. Three of five hurdle/target items here do not satisfy that test. The two symmetric items ("retail vocabulary," "making a decision") do not rescue the bullet set as a whole.

**Suggested tightening:** Replace role-specific items with scene-level obstacles — e.g., `size systems · offer language · preference vocabulary` — so both learner roles find the bullets equally relevant.

---

## Scenario 22 — `student` · "Talk to Your Teacher"

### Verdict table

| Layer \ Axis | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | **FAIL** |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | **UNSURE** |
| roles | PASS | PASS | PASS | **FAIL** |

### Rationales

**FAIL P×title**
"Talk to Your Teacher" uses the second-person possessive "Your," which embeds the learner in the student role before any selection is made. A learner who plays the teacher side cannot read the title as describing their scenario neutrally. The rubric criterion: "The same title works regardless of which role the learner will play." A neutral alternative — "Student–Teacher Talk" or "After-Class Question" — would satisfy this.

**UNSURE P×bullets**
Hurdles: `not knowing how to phrase a question · vague questions · limited time`
Targets: `admitting confusion clearly · asking focused questions · appropriate register`

"Not knowing how to phrase a question" and "vague questions" are student-centric; a professor would not share these obstacles. "Admitting confusion clearly" is a student-side target. Against that, "limited time" is a shared situational constraint, and "appropriate register" and "asking focused questions" apply to both sides (the professor also manages register and asks diagnostic questions). The asymmetry is real but partial — more than half the items are student-specific — hence UNSURE rather than a clean FAIL. If the set grows more student-centric, re-evaluate as FAIL.

**FAIL P×roles**
Student NPC: *"A college student in their early 20s who stayed after class. Wants to ask about a concept they missed but tends to start with vague questions."*

"Tends to start with vague questions" prescribes a conversational method — it instructs how the student will open exchanges, not simply who they are or their function in the scene. This is the exact drift class the rubric identifies as residual in `coffee` barista ("Repeats orders back to confirm") and flags for tightening. The parallel construction is close: both tell the AI how a character habitually performs in dialogue.

The teacher NPC ("A college professor in his 50s wrapping up after class. Available for a few minutes between classes.") is clean — identity plus situational constraint, no method scripting.

**Suggested tightening (roles):** Drop the behavioral clause: *"A college student in their early 20s who stayed after class with a question about a concept from the lecture."*

---

## Scenario 23 — `technology` · "Tech Support Problem"

### Verdict table

| Layer \ Axis | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | **FAIL** |
| roles | PASS | PASS | PASS | **FAIL** |

### Rationales

**FAIL P×bullets**
Hurdles: `vocabulary gaps · describing what's on screen · losing track mid-instruction`
Targets: `describing what's happening · following sequential instructions · asking for clarification`

"Describing what's on screen" is entirely user-side — the support agent never has to describe their own screen in this scenario. "Losing track mid-instruction" is user-side; the agent gives instructions rather than receives them. "Following sequential instructions" is user-side for the same reason. "Describing what's happening" is user-side (the user narrates the problem state, not the agent). Of the six items, only "vocabulary gaps" (both sides face terminology mismatches) and "asking for clarification" are genuinely symmetric.

**FAIL P×roles**
User NPC: *"Someone in their 40s whose laptop keeps crashing. Describes what's happening in their own words."*

"Describes what's happening in their own words" scripts the user's conversational method — it tells the AI playing this role how to narrate. Compare the rubric's cited real failure: coffee barista "Repeats orders back to confirm." Both clauses are conversational-procedure instructions masquerading as identity or trait description.

The support NPC ("A tech support agent in his 30s.") is clean — the briefest NPC in any of these six scenarios, and that brevity keeps it well clear of drift.

**Suggested tightening (roles):** Remove the method clause: *"Someone in their 40s whose laptop keeps crashing."*

---

## Scenario 24 — `understanding` · "Clear Up a Misunderstanding"

### Verdict table

| Layer \ Axis | L | E | C | P |
|---|---|---|---|---|
| title | PASS | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | **FAIL** | PASS | PASS | **UNSURE** |

### Rationales

**FAIL L×roles**
Clarifier NPC: *"A coworker in their 30s who said something ambiguous and doesn't realize it was taken the wrong way. Needs a nudge to see the disconnect."* (~24 words)
Confused Party NPC: *"A coworker in their 30s who tends to take things literally. Reads emails quickly and sometimes jumps to conclusions before asking follow-ups."* (~22 words)

Both NPCs run long. The rubric already carries the Confused Party as `[FAIL: id=understanding, axis=L, layer=roles, kind=real]` (borderline, near upper tolerance, flagged for tightening). The Clarifier at ~24 words is in the same range. Together they are the two longest NPC texts in the scenarios 21–26 pass, and both are within a sentence of overflowing into character-sheet territory.

**UNSURE P×roles**
"Needs a nudge to see the disconnect" (Clarifier) describes what the character will require from the conversation — a soft prescription for how the interaction must proceed. "Reads emails quickly and sometimes jumps to conclusions before asking follow-ups" (Confused Party) describes a reading and reasoning habit that will manifest as a conversational pattern. Neither is as explicit as "Repeats orders back to confirm" or "Describes what's happening in their own words," but both move meaningfully beyond pure identity + scene function. If either clause were strengthened (e.g., "Will not acknowledge the disconnect until presented with the original message"), the cell would shift to a clear FAIL.

The rubric's existing `kind=real` tag covers L×roles; this UNSURE in P×roles is a new observation not captured in the rubric's current annotations.

---

## Scenario 25 — `videocall` · "Video Call with a Colleague"

### Verdict table

| Layer \ Axis | L | E | C | P |
|---|---|---|---|---|
| title | **FAIL** | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | **FAIL** |

### Rationales

**FAIL L×title**
"Video Call with a Colleague" is 5 words. The rubric ceiling is 4 words. No other scenario in the 21–26 block reaches 5 words except `hiking` (see below), and the rubric's cited PASS examples are all ≤4 words ("Parking Ticket Situation" = 3; "Doctor Visit" = 2; "Open a Bank Account" = 4). A tighter alternative that stays within ceiling: "Video Call" (2 words) or "Remote Colleague Call" (3 words).

**FAIL P×roles**
Presenter NPC: *"A colleague in their 30s who has a lot to report and tends to go off-topic."*

"Tends to go off-topic" prescribes a conversational behavior — it instructs the AI playing this role to drift from the agenda. This is structurally identical to the rubric's flagged residuals: coffee barista "Repeats orders back to confirm" and (above) student "tends to start with vague questions." All three use the same "tends to [verb phrase]" construction to script how a character performs in dialogue rather than describing who they are.

The Call Runner NPC ("A remote colleague in her 40s running the call.") is clean — scene function without method scripting.

**Suggested tightening (roles):** Drop the behavioral clause: *"A colleague in their 30s with a full project update to share."*

---

## Scenario 26 — `hiking` · "Chat on a Winter Hike" *(blank-template scenario)*

> **Template note:** `hiking` is designated as the blank-template scenario for passage-generated AI convos (26th entry; the file header comments "all 25 AI conversation scenarios," confirming `hiking` sits outside the primary 25). It is scored here on equal footing with the other five scenarios. The single FAIL below is a genuine rubric deviation, not an artifact of its template status.

### Verdict table

| Layer \ Axis | L | E | C | P |
|---|---|---|---|---|
| title | **FAIL** | PASS | PASS | PASS |
| descriptor | PASS | PASS | PASS | PASS |
| bullets | PASS | PASS | PASS | PASS |
| roles | PASS | PASS | PASS | PASS |

### Rationales

**FAIL L×title**
"Chat on a Winter Hike" is 5 words, matching `videocall` in exceeding the 2–4 word ceiling. Of the 16 cells scored for this scenario, this is the only deviation. All other layers and axes — including the role NPCs ("A friend in their 30s who's a bit quieter on the trail." / "A close friend in their 30s on a familiar trail.") — are clean.

The "quieter on the trail" trait in the Hiker NPC is a mild personality observation consistent with the rubric's own PASS citation of car scenario's "a bit quieter today"; it does not prescribe conversational method.

A tighter title that clears the length ceiling: "Winter Hike Chat" (3 words) or "Trail Walk" (2 words).

---

## Cross-scenario patterns (Pass 2B)

| Pattern | Scenarios affected | Axis × Layer |
|---|---|---|
| 5-word title | `videocall`, `hiking` | L×title |
| Shopper/user-centric bullets | `shopping`, `technology` | P×bullets |
| "tends to [verb]" NPC method scripting | `student`, `videocall` | P×roles |
| "describes/narrates" NPC method scripting | `technology` | P×roles |
| Long role NPCs (borderline–upper tolerance) | `understanding` | L×roles |
| Second-person title possessive | `student` | P×title |

Axes E and C are clean across all 96 cells in this pass. Emotion neutrality and CEFR accessibility are well-maintained in the scenarios 21–26 block.
