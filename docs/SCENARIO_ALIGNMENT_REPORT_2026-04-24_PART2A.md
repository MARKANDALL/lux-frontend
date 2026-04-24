# Scenario Alignment Report — Pass 2A of 2
**Date:** 2026-04-24  
**Scope:** Scenarios 14–20 (file order, 1-based) from `features/convo/scenarios.js`  
**Rubric:** `docs/SCENARIO_ALIGNMENT_RUBRIC.md` (last revised 2026-04-23)  
**Evaluator note:** No modifications were made to `scenarios.js` or the rubric.

---

## Executive Summary

Seven scenarios scored across 112 cells (16 axis × layer combinations each).

| Verdict | Count | % |
|---|---|---|
| PASS | 102 | 91.1 % |
| UNSURE | 7 | 6.3 % |
| FAIL | 3 | 2.7 % |

**Clean passes (all 16 cells):** `dinner` (#14), `joke` (#15), `networking` (#18) — three of seven entries are fully aligned.

**FAIL cells (3):**
- `parking` — L × roles: driver NPC at 25 words exceeds the rubric's 22-word borderline threshold; 3.6× length gap vs. the officer stub.
- `parking` — P × roles: known `kind=real` residual flagged in the rubric itself — "Believes the sign was unclear" imposes a stance.
- `police` — P × bullets: all three hurdles and all four targets are citizen-role-specific; zero cross-role applicability.

**UNSURE cells (7):**
- `lifeguard` P × bullets: hurdles layer is exclusively visitor/parent-role; partial symmetry survives only in targets.
- `mail` L × roles: sender NPC (22 words) matches the rubric's "borderline; near upper tolerance" marker.
- `mail` P × bullets: two of three hurdles are customer-side only.
- `parking` P × bullets: hurdles and targets lean toward the driver's perspective.
- `police` L × title: 5 words vs. 2–4 ceiling (consistent with several other set members but technically over-range).
- `police` L × roles: citizen NPC (21 words) is near the borderline; 2.3× ratio vs. officer falls within the doctor-scenario PASS precedent.
- `police` P × title: imperative "Ask an Officer for Help" names the citizen's action; the officer cannot be said to "ask for help."

**Systemic observation:** The four UNSURE/FAIL P × bullets findings (`lifeguard`, `mail`, `parking`, `police`) share a structural pattern — service or authority interactions where the learner-facing role's challenges are front-loaded in the hurdles bullet. None of these impose an emotional stance on the other party, so none rises to the FAIL drift class described in the rubric's P × bullets section; the underlying issue is framing asymmetry.

---

## Scenario 14 — `dinner` · "Catch Up over Dinner"

### Verdict Table

| Layer | L | E | C | P |
|---|---|---|---|---|
| **title** | PASS | PASS | PASS | PASS |
| **descriptor** | PASS | PASS | PASS | PASS |
| **bullets** | PASS | PASS | PASS | PASS |
| **roles** | PASS | PASS | PASS | PASS |

All 16 cells pass. No rationales required.

**Measurement notes:** Title 4 words. Descriptor 18 words. Bullets 15 / 16 / 8 words. NPCs 18 / 9 words (2.0× ratio — within doctor-precedent tolerance). The rubric uses this descriptor as an explicit E × descriptor PASS example: "warmth via specifics, no saccharine."

---

## Scenario 15 — `joke` · "Tell a Joke"

### Verdict Table

| Layer | L | E | C | P |
|---|---|---|---|---|
| **title** | PASS | PASS | PASS | PASS |
| **descriptor** | PASS | PASS | PASS | PASS |
| **bullets** | PASS | PASS | PASS | PASS |
| **roles** | PASS | PASS | PASS | PASS |

All 16 cells pass. No rationales required.

**Measurement notes:** Title 3 words. Descriptor 18 words. Bullets 15 / 14 / 8 words. NPCs 16 / 8 words (2.0× ratio). The imperative "Tell a Joke" follows the established set convention (cf. "Order Coffee," "Make a Phone Call," "Raise a Concern"); the scenario descriptor establishes bidirectional joke exchange ("jokes flying back and forth"), so both roles participate in the named activity. "Comedic timing" and "punchline" in bullets are scenario-domain terms acceptable under the C × bullets criterion for specialised vocabulary.

---

## Scenario 16 — `lifeguard` · "Beach Emergency"

### Verdict Table

| Layer | L | E | C | P |
|---|---|---|---|---|
| **title** | PASS | PASS | PASS | PASS |
| **descriptor** | PASS | PASS | PASS | PASS |
| **bullets** | PASS | PASS | PASS | **UNSURE** |
| **roles** | PASS | PASS | PASS | PASS |

15 PASS · 1 UNSURE · 0 FAIL

**Measurement notes:** Title 2 words (rubric PASS example). Descriptor 16 words. Bullets 13 / 12 / 12 words. NPCs 11 / 7 words (1.6× ratio). E × title, E × bullets, and C × title are all rubric PASS examples for this scenario.

---

### Rationale: P × bullets — UNSURE

**Criterion:** Hurdles and targets apply symmetrically regardless of which role the learner plays.

**Hurdles bullet:** `losing clarity in the moment · not knowing safety vocabulary · hesitating to interrupt`

All three hurdles are visitor/parent-role challenges:
- *Losing clarity in the moment* — the visitor is in a stressful, unfamiliar situation; the lifeguard is a professional responding to a known emergency type.
- *Not knowing safety vocabulary* — the visitor lacks rescue terminology by definition; the lifeguard possesses it.
- *Hesitating to interrupt* — the visitor must decide to approach and interrupt an on-duty professional; the lifeguard is already on duty and initiates responses.

None of these hurdles maps onto what a learner playing the lifeguard role would face.

**Targets bullet:** `giving clear information · describing a location · following directions · getting to the point`

Partial symmetry survives here: *giving clear information* applies to both parties (visitor reports to lifeguard; lifeguard instructs visitor). *Following directions* is also plausible for either role. However *describing a location* and *getting to the point* are still visitor-centric in context. The targets layer is less unbalanced than the hurdles layer, which is why this cell is UNSURE rather than FAIL.

**Why not FAIL:** The rubric's P × bullets FAIL class is defined as "bullets phrase hurdles or targets from one role's vantage point, **or** prescribe emotional stances toward the other role." No emotional stance toward the officer/lifeguard is present here. The asymmetry is structural to the emergency scenario type and does not editorially colour either role. Compare `police` P × bullets (FAIL below), where all four targets are also citizen-specific.

---

## Scenario 17 — `mail` · "Ask about Mail"

### Verdict Table

| Layer | L | E | C | P |
|---|---|---|---|---|
| **title** | PASS | PASS | PASS | PASS |
| **descriptor** | PASS | PASS | PASS | PASS |
| **bullets** | PASS | PASS | PASS | **UNSURE** |
| **roles** | **UNSURE** | PASS | PASS | PASS |

14 PASS · 2 UNSURE · 0 FAIL

**Measurement notes:** Title 3 words. Descriptor 13 words. Bullets 14 / 16 / 10 words. Sender NPC 22 words (2 sentences); clerk NPC 19 words (2 sentences); 1.16× ratio.

---

### Rationale: L × roles — UNSURE

**Criterion:** 1–2 sentences per NPC, roughly matched between the two roles.

The sender NPC runs to 22 words: *"Someone in their 20s mailing a package for the first time. Unsure which service to use or what forms to fill out."* This matches the word count the rubric explicitly marks as "borderline; near upper tolerance" for the `understanding` scenario (`kind=real` FAIL). The sentence count (2) is within bounds. The extra length is scene setup (knowledge gap), not behavioural scripting, so this does not compound into a P × roles concern. Ratio to the clerk (19 words) is 1.16× — well inside tolerance. The cell is UNSURE on absolute length only, not ratio or content quality.

---

### Rationale: P × bullets — UNSURE

**Criterion:** Hurdles and targets apply symmetrically regardless of which role the learner plays.

**Hurdles bullet:** `not knowing which service to choose · catching an answer the first time · keeping the interaction moving`

The first two hurdles are customer-exclusive:
- *Not knowing which service to choose* — the postal worker knows all services; this is the customer's knowledge gap.
- *Catching an answer the first time* — frames the customer as the listener who must comprehend; the postal worker is the speaker giving the answer.

*Keeping the interaction moving* has cross-role applicability (both parties benefit from efficient throughput) and partially restores balance.

**Targets bullet:** `focused questions · understanding answers on the first pass · transactional vocabulary`

*Focused questions* and *understanding answers on the first pass* are customer-centric. *Transactional vocabulary* applies to both. One of three targets is symmetric.

**Why not FAIL:** No single hurdle or target is phrased in a way that colours the postal worker role or imposes a stance. The asymmetry is an artefact of the service-counter scenario type (cf. `lifeguard` above). Structural imbalance without editorial stance = UNSURE.

---

## Scenario 18 — `networking` · "Networking Event"

### Verdict Table

| Layer | L | E | C | P |
|---|---|---|---|---|
| **title** | PASS | PASS | PASS | PASS |
| **descriptor** | PASS | PASS | PASS | PASS |
| **bullets** | PASS | PASS | PASS | PASS |
| **roles** | PASS | PASS | PASS | PASS |

All 16 cells pass. No rationales required.

**Measurement notes:** Title 2 words. Descriptor 13 words. Bullets 13 / 13 / 9 words. NPCs 11 / 12 words (1.1× ratio — the closest-matched NPC pair in this pass). The rubric uses the hurdles bullet of this scenario as its canonical P × bullets PASS example. NPCs are well-matched in length, neutral in register, and free of conversational-method scripting.

---

## Scenario 19 — `parking` · "Parking Ticket Situation"

### Verdict Table

| Layer | L | E | C | P |
|---|---|---|---|---|
| **title** | PASS | PASS | PASS | PASS |
| **descriptor** | PASS | PASS | PASS | PASS |
| **bullets** | PASS | PASS | PASS | **UNSURE** |
| **roles** | **FAIL** | PASS | PASS | **FAIL** |

13 PASS · 1 UNSURE · 2 FAIL

**Measurement notes:** Title 3 words (rubric P × title PASS example). Descriptor 13 words (rubric P × descriptor PASS example). Bullets 12 / 12 / 9 words. Driver NPC 25 words (2 sentences); officer NPC 7 words (1 sentence); 3.6× ratio.

---

### Rationale: L × roles — FAIL

**Criterion:** 1–2 sentences per NPC, roughly matched between the two roles.

The driver NPC runs to 25 words: *"A driver in their 30s who just found a ticket on the windshield. Believes the sign was unclear and wants to understand the appeals process."* The rubric flags the `understanding` scenario's confused-party NPC (22 words) as "borderline; near upper tolerance" — a `kind=real` FAIL signal. At 25 words the driver NPC exceeds that marker. The officer NPC is a 7-word stub. The 3.6× length ratio means the driver side is substantially more authored, violating the "neither side feels more authored than the other" criterion. The excess length is also the vehicle for the P × roles drift addressed below.

---

### Rationale: P × bullets — UNSURE

**Criterion:** Hurdles and targets apply symmetrically regardless of which role the learner plays.

**Hurdles bullet:** `staying factual · defaulting to excuses instead of questions · not knowing appeal options`

*Defaulting to excuses instead of questions* and *not knowing appeal options* are driver-role challenges; the enforcement officer does not default to excuses or lack knowledge of the appeals process. *Staying factual* has nominal cross-role applicability (the officer also states facts) but in context it addresses the driver's tendency toward excuse-making.

**Targets bullet:** `factual narration · staying credible · accepting outcomes · asking about process`

*Accepting outcomes* and *asking about process* are driver-centric. *Staying credible* and *factual narration* skew driver-side in context. Symmetric reading of all four targets simultaneously is not plausible for a learner playing the officer role.

**Why not FAIL:** No target or hurdle colours the officer role or imposes a stance on the learner playing the officer. The rubric's FAIL class requires either one-sided POV phrasing *or* emotional-stance prescription toward the other role; this is the former at a moderate level, landing UNSURE rather than FAIL.

---

### Rationale: P × roles — FAIL (kind=real)

**Criterion:** Each `npc` is identity + scene function only; no conversational-method scripting, no imposed learner stance.

> *"A driver in their 30s who just found a ticket on the windshield. Believes the sign was unclear and wants to understand the appeals process."*

This is the exact residual flagged in the rubric as `[FAIL: id=parking, axis=P, layer=roles, kind=real]`:

> "Believes the sign was unclear" imposes a stance on whichever side the learner plays. Flag for tightening.

The failure has two components:
1. **Stance imposition:** *"Believes the sign was unclear"* assigns a viewpoint to the driver character that the learner playing either role must then inhabit or respond to from a pre-determined position.
2. **Goal scripting:** *"wants to understand the appeals process"* scripts the driver's conversational goal, narrowing the interaction in a way that encroaches on the conversational-method territory the 2026-04-03 NPC-pass removed.

Both clauses should be trimmed to an identity + factual-scene-context description (e.g., *"A driver in their 30s who just found a ticket on the windshield."*).

---

## Scenario 20 — `police` · "Ask an Officer for Help"

### Verdict Table

| Layer | L | E | C | P |
|---|---|---|---|---|
| **title** | **UNSURE** | PASS | PASS | **UNSURE** |
| **descriptor** | PASS | PASS | PASS | PASS |
| **bullets** | PASS | PASS | PASS | **FAIL** |
| **roles** | **UNSURE** | PASS | PASS | PASS |

12 PASS · 3 UNSURE · 1 FAIL

**Measurement notes:** Title 5 words. Descriptor 13 words. Bullets 18 / 12 / 8 words. Citizen NPC 21 words (2 sentences); officer NPC 9 words (1 sentence); 2.3× ratio.

---

### Rationale: L × title — UNSURE

**Criterion:** 2–4 words, uniform across the 25-scenario set.

"Ask an Officer for Help" is 5 words, one over the stated ceiling. The full set contains multiple 5-word titles ("Open a Bank Account," "Choose at the Grocery Store," "Video Call with a Colleague") and one 7-word title ("Chat with Strangers at a Party"), so the *de facto* set range is wider than the rubric's stated 2–4. The title does not break picker-deck visual rhythm relative to actual set norms. UNSURE rather than FAIL because the violation is marginal and consistent with established set practice; a strict reading of the rubric criterion would make this a FAIL.

---

### Rationale: L × roles — UNSURE

**Criterion:** 1–2 sentences per NPC, roughly matched between the two roles.

Citizen NPC: 21 words (2 sentences). Officer NPC: 9 words (1 sentence). The 2.3× ratio is well within the precedent set by the rubric's doctor-scenario PASS example (4 words vs. 17 words = 4.25× ratio, explicitly PASS). The citizen NPC's absolute length (21 words) sits just below the rubric's 22-word "borderline" marker. The extra length is scene function ("Needs to report something minor or find a specific address"), not behavioural scripting. UNSURE on absolute-length proximity to the borderline, not on ratio or content quality.

---

### Rationale: P × title — UNSURE

**Criterion:** Title names the situation without taking a side or issuing an imperative that only works for one role. The same title works regardless of which role the learner plays.

"Ask an Officer for Help" uses the verb *ask* in a way that is unambiguous only from the citizen's vantage point. A learner playing the officer role does not "ask for help" — they receive a request and respond. The title therefore does not serve both roles equally. This contrasts with, for example, "Raise a Concern" (either side of a tenant-manager dispute can be said to raise a concern) or "Parking Ticket Situation" (fully role-neutral). The set's imperative-title convention is established, but most other imperative titles name a shared activity rather than one role's directed action toward the other.

UNSURE rather than FAIL because: (a) no emotional or verdict stance is loaded into the title; (b) the set convention normalises imperative titles; (c) the scenario descriptor recovers with neutral third-person framing ("A street-corner interaction between a citizen and a police officer on foot patrol").

---

### Rationale: P × bullets — FAIL

**Criterion:** Hurdles and targets apply symmetrically regardless of which role the learner plays.

**Hurdles bullet:** `unfamiliarity with the interaction · vague location descriptions · cultural differences in approaching authority`

All three hurdles are exclusively citizen-role challenges:
- *Unfamiliarity with the interaction* — the police officer is the professional in this interaction type; unfamiliarity is the citizen's.
- *Vague location descriptions* — the citizen is providing the location description; the officer receives and clarifies it.
- *Cultural differences in approaching authority* — directly names the citizen's cultural posture toward the officer; has no applicability to the officer's own challenges.

Zero cross-role applicability in the hurdles layer.

**Targets bullet:** `factual reporting · location description · organized answers · appropriate register`

All four targets are also citizen-centric:
- *Factual reporting* — the citizen is reporting a fact (incident or address); the officer is receiving and acting on it.
- *Location description* — the citizen describes a location to the officer.
- *Organized answers* — the citizen must organize their response; the officer already operates within a structured response protocol.
- *Appropriate register* — in context, this refers to the citizen calibrating register when addressing an officer, not the inverse.

**Why FAIL (not UNSURE):** Every hurdle and every target maps to the citizen role. A learner playing the officer would find no applicable skill surface in either bullet. This exceeds the partial asymmetry of `lifeguard` and `mail` (both of which preserve at least one symmetric element in each layer) and meets the rubric's criterion for FAIL: "bullets phrase hurdles or targets from one role's vantage point." Note that no emotional stance is imposed on the officer, so the FAIL is the "one-sided POV phrasing" variant, not the "emotional-stance" variant.

**Remediation path:** Rewrite hurdles to include officer-side friction ("assessing urgency quickly · managing multiple requests · understanding non-native speech") and rewrite targets to include officer-appropriate skills ("active listening · asking clarifying questions · giving clear directions"). Alternatively, acknowledge the inherent asymmetry and split into shared-framing language that does not presuppose which role the learner occupies.
