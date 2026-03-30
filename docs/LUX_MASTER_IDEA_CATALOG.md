# Lux Pronunciation Tool — Master Idea Catalog (v2)

> **Purpose:** Every idea, fix, feature, dream, and design note — organized by attack phase, prioritized within each phase. Nothing lost, everything findable.
>
> **Priority Key:** 🔴 Critical / Now · 🟠 High / Soon · 🟡 Medium / Next · 🟢 Long-term / Dream
>
> **Phase Logic:** Fix → Differentiate → Polish → Dogfood (Spanish) → Teach → Expand → Platform. Each phase makes the next one more effective.

---

---

# PHASE 1 — FIX WHAT'S BROKEN & SOLIDIFY THE BACKBONE

> *Everything else plugs into this. If the foundation leaks, nothing built on top holds.*

## 1.1 Critical Fixes

- 🔴 **Fix Save Progress functionality.** Broken — nothing else matters if user data doesn't persist.
- 🔴 **Fix WaveSurfer TTS waveform rendering.** Intermittent failure where the visual doesn't render for text-to-speech.
- 🔴 **Fix syllable stress-shift feature** in Word & Phoneme chart. The column breaks words into syllables but the stress-changes-meaning feature isn't working.
- 🟠 **Fix custom emails.**
- 🟠 **Fix warp — make it work across all page changes.**

## 1.2 Unified Data Aggregation (The Spine)

> *The diagnosis engine, the personalized curriculum, the progress map, the Spanish version — they all depend on this.*

- 🔴 **Unified data aggregation across all features:** Pronunciation data from passages AND AI conversations aggregated under one login/identity. Per-session reports plus lifetime rollups. This is the backbone everything else connects to.
- 🔴 **Uniform scoring and color-coding across the entire app.** Every feature, every page, every feedback display must use the same scoring system and color scheme. No inconsistencies.
- 🔴 **DB writes/reads immediately reflected in UI.** Saved progress, checkpoints, and history update instantly and reliably.
- 🟠 **"Never overwhelming" expandable UI for data:** Fix database tracking display (single/day/week) so it shows less by default but expands on demand.
- 🟠 **Clean dropdown tracking list:** No duplicates, sorted, clear timestamps. Accurate history with filters by date, passage, and session.

## 1.3 "Generate My Next Practice" — Universalized

- 🔴 **Make it universal:** Apply across all AI systems AND Practice Skills passages. Generate targeted practice based on aggregate trouble data. Currently scoped narrowly; needs to touch everything.
- 🔴 **Phoneme-first targeting (the differentiator):** The accumulated trouble phoneme data drives what gets practiced. This is what separates Lux from other tools and what makes Azure particularly useful as a measurement tool.
- 🟠 **But also let users choose:** User should be able to manually select a sound or word to practice, not only rely on auto-generation.

---

---

# PHASE 2 — CORE INTELLIGENCE & DIFFERENTIATION

> *Once the data backbone works, this is what transforms Lux from a measurement tool into a coach. This is the moat.*

## 2.1 L1 Pronunciation Profiling System

> *Before the user even speaks, we should already know what to listen for.*

- 🔴 **L1-based error profiling:** When a user selects their first language, Lux should automatically load a known pronunciation profile — Korean → L/R confusion, most languages → TH sounds, Hindi/Russian → V/W swaps, Spanish → vowel reduction struggles, etc. This gives Lux a head start on diagnosis before a single recording is made.
- 🟠 **Opt-in with strong nudge:** Don't force L1 selection, but strongly encourage it. Explain why it matters ("This helps us find your specific challenges faster"). Offer a neutral/skip option, but make the value of selecting clear.
- 🟠 **L1 profile as hypothesis, not assumption:** The profile sets initial expectations, but actual user data always overrides. If a Korean speaker's L/R is fine but their TH is the real issue, the system adapts. The L1 profile is a starting point, not a cage.

## 2.2 Diagnosis Engine (Scores → Root Cause → Drill)

- 🔴 **Error signature detection (rolling profile):** Build a persistent profile per user tracking phoneme confusions (e.g., /ɪ/→/iː/), final consonant deletions, stress placement errors, and rhythm issues (syllable-timed vs. stress-timed). This is Lux's secret weapon — and it compounds with L1 profiling data (2.1).
- 🔴 **"One fix" coaching (anti-overwhelm):** After any attempt, surface the single correction most likely to improve intelligibility. Everything else stays collapsed behind "More."
- 🟠 **Root-cause narration from audio evidence:** AI Coach explains what the system "heard" vs. what was intended, in a friendly, non-judgmental tone. Example: "Your *th* is coming out like *d* here. Try pushing air forward with your tongue between teeth."
- 🟠 **Adaptive minimal-pair generator:** When user confuses /b/ and /v/, generate relevant word pairs drawn from their daily life vocab and turn it into a quick drill.

## 2.3 Staggered Intelligence — Progressive Feedback Depth

> *"The more it learns, the more it suggests, and the more serious the fix." This is a core Lux philosophy, not just a feature.*

- 🔴 **Intelligently staggered feedback depth:** As Lux accumulates more data about the user's weaknesses, the depth and specificity of feedback increases over time. This is NOT just "show more stuff." It's a designed escalation:
  - **Immediate (first use):** Basic scores, color-coded results, general tips. The user gets value from minute one.
  - **After a few sessions:** AI Coach starts referencing patterns — "You've struggled with /θ/ in 3 of your last 4 sessions." Feedback becomes specific to *their* data.
  - **After sustained use:** Targeted drills auto-generated from accumulated weak spots. Individual phoneme coaching videos surfaced for their specific problem sounds. Reduced-word chunk practice (I wanna, I'm going to) if those patterns emerge.
  - **Deep engagement tier:** Option to book a session with Mark (see 2.5). System-generated weekly/monthly progress reports. Root-cause analysis that connects multiple error types ("Your final consonant deletion and your stress timing may both relate to your L1's syllable structure").

- 🟠 **Each AI touchpoint serves a unique role in the escalation:**
  - **Practice Skills feedback:** Immediate, per-attempt scoring and color-coded results.
  - **AI Coach (in-session):** Pattern-aware, references recent history, gives the "one fix" recommendation.
  - **AI Coach (in summary):** Broader perspective, connects dots across an entire session, suggests next steps.
  - **Weekly/periodic digest:** Aggregate view, trend lines, celebrates improvements, flags persistent issues.

- 🟠 **Progressive complexity in UI:** Start simple and clear. Always offer the option to expand in information and complexity. As database knowledge accumulates, surface deeper layers — tiered reveals, not upfront stacking. Information appears when the user is ready for it, not before.

## 2.4 AI Coach — Deep System Message Refinement

> *The AI Coach needs to be genuinely smart about the user, not generic.*

- 🔴 **AI Coach system message overhaul:** The system prompt needs to know how to point itself most effectively at the user — understand their patterns, reference their L1 profile, link error signatures to actionable advice. This is where the L1 profiling (2.1), diagnosis engine (2.2), and staggered intelligence (2.3) all come together in the user's experience.
- 🔴 **Hard-wall all AIs to their mission:** No open-ended ChatGPT interaction. Each AI stays focused only on its designated role. No off-topic responses.
- 🟠 **AI tuning/calibrating — for all of them:** Systematic review and tightening of every AI persona's behavior.
- 🟠 **Custom responses always:** AIs should never repeat the exact same response anywhere. Every interaction should feel fresh and tailored.
- 🟠 **Make AIs aware of themselves:** Each AI should understand its own role, context, and what it knows about the user. Introduce RAG system for truly smart, useful, interactive AI.
- 🟡 **Conversational AI Coach:** Should the AI Coach be conversable — a back-and-forth dialogue rather than one-way feedback?

## 2.5 Mark as Personal Coach — Booking & Revenue

> *Not buried in monetization — this is a feature, a differentiator, and a revenue stream. The expert behind the tool is available.*

- 🟠 **"Book a Session with Mark" feature:** A calendar/booking option where users can schedule 1-on-1 pronunciation coaching with Mark — the person who built the entire tool. This serves multiple purposes:
  - **Revenue stream** that works whether the app has 50 users or 50,000.
  - **Brand credibility** — "Not only did I build this, I can teach you personally."
  - **Resume/profile value** for ID career positioning.
  - **Product feedback loop** — direct contact with real users.

- 🟠 **Two access paths (not just one):**
  - **Staggered escalation path:** As the system learns more about the user and surfaces increasingly deep help, at some point it naturally offers: "For personalized coaching on these patterns, you can work directly with Mark." This is the organic path that emerges from sustained use.
  - **Direct access path:** A visible but non-intrusive way to find Mark's coaching from the beginning — not in-your-face, not the first thing you see, but findable. The app is the app. But if someone wants human help immediately, the door is open.

- 🟠 **Pricing strategy:** Rates set high — this is premium, expert coaching, not budget tutoring. Limited availability by design. If the app takes off, Mark is rarely available and the scarcity is real. If it doesn't, this is sustainable income.
- 🟡 **Profile/bio page for Mark:** Teaching credentials, the Lux story, approach philosophy. Makes the human behind the tool real.

## 2.6 Free-Speech Scoring (Without Feeling Like a Test)

- 🟠 **Auto-reference loop (stealth reference text):** Azure transcribes the user → treat transcript as provisional reference for a second scoring pass → GPT flags low-confidence words and asks for quick confirm/edit ("Did you say *sheet* or *seat*?"). Turns unscripted speech into something scorable.
- 🟠 **Confidence-weighted scoring UI:** Words where ASR confidence is low get a "⚠️ uncertain" halo. Lux stays trustworthy: "We can score this, but this word may be misheard."
- 🟡 **Micro-references inside free chat:** When a pattern emerges (e.g., /θ/ struggles), AI injects tiny 1-sentence challenges every few turns to collect clean reference data inside the conversation experience.
- 🟡 **Conversation prompts that generate reference text naturally:** Instead of "read this passage," the bot says: "Say this sentence the way you'd say it in real life."

## 2.7 Scoring System & Standards

- 🟠 **CEFR transparency:** Make CEFR scoring criteria fully visible and explained to the user — not just badge labels, but what each level means for pronunciation specifically. This is open-source and already our alignment framework; make it explicit.
- 🟠 **Clarify prosody & score breakdown into sub-scores:** Separate visual metrics for accuracy, prosody, fluency, and completeness, each with a one-line tooltip explanation.
- 🟡 **Toggle between scoring frameworks:** Allow users to switch display between CEFR and other major testing standards (IELTS, TOEFL, etc.) — future build, CEFR first.

---

---

# PHASE 3 — UX POLISH, PROGRESSIVE DISCLOSURE & AESTHETIC

> *You need the intelligence working before you polish how it's presented. This is where Lux goes from "powerful but confusing" to "powerful and intuitive." Must be solid before dogfooding the Spanish version.*

## 3.1 The Lux Aesthetic (North Star)

> *"Clinical, diagnostic, linguistic. Not bubbly. Not ELSA Speak. For a mature audience who's genuinely fascinated by how sounds work."*

- 🟠 **Mature, clinical, diagnostic tone:** The entire app should feel like a professional linguistic tool, not a gamified toy. Think: fascination with the mechanics of sound production, confidence through understanding, not gold stars and cartoon celebrations.
- 🟠 **The "statistics confidence" principle:** Like Mark's own Spanish journey — knowing the specific data about your sound production gives you something concrete to grasp and improve. That specificity breeds confidence.
- 🟠 **Positive reinforcement, not nagging reminders:** Encouragement that feels genuine, not annoying notification spam.

## 3.2 Progressive Disclosure & Simplicity

- 🔴 **"Plain simple farmer grandma kindergarten explanatory":** Every label, every piece of text — dead simple. For you (the dev) AND the user. If grandma can't understand the label, rewrite it.
- 🔴 **Avoid upfront stacking:** Immediate turn-off. Never overwhelm on first view.
- 🔴 **Always simple and clear initially, always with option to expand.**
- 🟠 **Keep initial UI minimal:** Simple defaults with expandable controls to avoid overwhelming new users.
- 🟠 **Observable clicks and loads everywhere:** Especially where delays are anticipated. User should never wonder "Did it work? Is it loading?" Every interaction needs visible feedback.

## 3.3 Layout & Visual Consistency

- 🔴 **Uniformity across the entire app:** Text, shadows, clicks, hovers, boxes, actions, sounds, color/themes — everything consistent. Including the Wix marketing site.
- 🟠 **Clean up AI Conversation space aesthetically.**
- 🟠 **Think about Practice Skills layout:** Especially Harvard List placement — how to display it well.
- 🟠 **Make modal card "grabbability" clear** where drag interaction exists.
- 🟠 **Click anywhere within phoneme box or TTS/SPB drawers to open/close them.**
- 🟠 **Differentiate Summary vs. My Progress History:** Avoid redundancy between post-passage summary, modal cards, and progress history. Each should serve a distinct purpose.
- 🟠 **Make "My Progress" items clearly understandable:** What does each element do? Obvious wording, clear purpose.

## 3.4 AI Conversations UX

- 🟠 **Fuller scenario descriptions:** When clicking a scenario card, show a detailed paragraph close to the system prompt — not just a title.
- 🟠 **AI Coach collapsible/expandable:** All AI Coach output should be collapsible/expandable, starting opened.
- 🟠 **AI feedback autoscroll with on/off toggle:** New feedback scrolls into view automatically unless user disables it.
- 🟠 **AI-detected error highlighting linked to waveform/timecode:** Clickable highlights that jump to the exact audio moment for targeted practice.
- 🟠 **System-prompt conversations to nudge challenging words:** GPT conversation creator should push the user toward challenging words (based on L1 and database info) while maintaining natural flow within the chosen scenario.
- 🟠 **Clean up AI-generated practice passages:** Don't bend over backwards inserting unnatural words. Do absolutely nail the target phonemes and highlight relevant words if they appear naturally.

## 3.5 Feedback Timing & Styles

- 🟠 **Live vs. later feedback toggle (AI Conversations):** This is actually quite important and nuanced. During a conversation, you often want to focus on the conversation, not be distracted by corrections. Options: live feedback, post-conversation feedback, or even weekly aggregated feedback. Each serves a different learning purpose.
- 🟠 **Streaming mode with live feedback toggle:** Can switch between real-time feedback (lower accuracy) and holding off for post-session analysis (higher accuracy).

## 3.6 Voice & Audio Polish

- 🟠 **Speed control over AI oral responses:** Layer over ChatGPT's oral response to slow it down or let user choose speed.
- 🟠 **Synced visual comparison — user recording vs. TTS:** Time-aligned waveforms and highlights showing where they differ from the model.
- 🟠 **Side-by-side TTS and user recording buttons:** Set up playback buttons next to each other for easy A/B comparison.
- 🟠 **Configure TTS drawer for AI Convo page:** "A" the speaker, "B" your selections — hear both.
- 🟠 **SPB layout:** Speed bar on its own row, laid next to Loop buttons, include download button (for user voice, not TTS).
- 🟠 **Three recording quality tiers:** Streaming/real-time (chunked, Opus/PCM via WebSocket), Standard/balanced (compressed WAV/Opus/Blob), High-precision/analysis (uncompressed PCM WAV, 16-bit, 48kHz).

## 3.7 Phoneme & Word Display Polish

- 🟠 **IPA symbols next to phonemes:** Render IPA clearly in its own font/color beside each phoneme description.
- 🟠 **Speed up phoneme loading:** Caching/prefetch strategies so panels open with minimal delay.
- 🟠 **Show similar words containing the phoneme in question:** Helps users link understanding by seeing the sound in other contexts.
- 🟠 **Show a word in L1 that represents the same phoneme/sound:** A reference point in their native language.
- 🟠 **Homophones/heterophones section:** Explain how some words sound the same but have different meanings/spellings. Could live in the syllable column or its own expandable area. Needs clear onboarding.
- 🟠 **Grouping minimal pairs or similar sounds into lessons:** Before-and-after walkthrough showing how to make the sound.
- 🟠 **Faster individual word scoring system:** A lighter-weight pipeline for single words — faster to load, maybe auto-formatted with its grading system.
- 🟡 **Phoneme tooltips with L1 translations:** Toggle/hover to see translated terms when L1 is selected.

## 3.8 Mobile — Responsive First Pass

- 🟠 **Responsive mobile version (first pass):** Core functionality preserved on phones/tablets. Start with simple/easy mobile-friendly fixes. Not a full mobile app yet — that's Phase 7 — but make it usable on a phone.

## 3.9 Cool Buttons & UI Flourishes

- 🟡 **Distinctive button designs for:** "All Data," "Practice Skills," "Creation of Custom Practice," "Cloud."
- 🟡 **Make "Generate My Next Practice" button cool:** Visually striking, based on aggregate data, highlights phonemes and words.

---

---

# PHASE 4 — SPANISH VERSION (DOGFOODING)

> *"If I could actually use it as a learner of a language, I could see where I think it's genuinely fun and interesting or not, or it's not really working." This is the single best testing strategy available: become your own power user.*

## 4.1 Spanish Pronunciation Tool — Core Build

- 🟠 **Spanish as the first non-English language:** Not just a translation — a genuine Spanish pronunciation tool. Mark uses it daily to work on his own Spanish pronunciation (especially open vowels). This serves as:
  - **Dogfooding:** Feel the UX as a real learner, not a builder. Find friction that imagination can't surface.
  - **Architecture proof:** Proves the system is truly language-agnostic, not English-hardcoded.
  - **Market expansion proof of concept:** If Spanish works, every other language becomes a known path.
  - **Personal value:** Mark genuinely wants this for his own ongoing Spanish work.

- 🟠 **What "Spanish version" actually requires:**
  - New phoneme inventory (~24 Spanish phonemes vs. English's ~44). Different sound system, different problem areas.
  - Spanish-specific Azure Speech scoring configuration.
  - Spanish CEFR pronunciation descriptors (what does B1 pronunciation sound like in Spanish?).
  - Spanish TTS voices.
  - Starter set of Spanish conversation scenarios.
  - L1 profiling in reverse — English speakers learning Spanish have predictable patterns (vowel reduction where Spanish wants pure vowels, rhotic R issues, etc.).
  - Spanish-facing UI text (distinct from the L1 translation system — this is the *target language* being Spanish, not just translating the interface).

- 🟡 **Start minimal:** A stripped-down Spanish version with core Practice Skills and basic AI Conversations. Not every feature from English day one — just enough to be a real, usable pronunciation practice tool.

---

---

# PHASE 5 — ONBOARDING, EDUCATION & CONTENT EXPANSION

> *You need the thing to be good before you teach people how to use it. And the ID portfolio work benefits from showcasing a polished product.*

## 5.1 User Onboarding

- 🟠 **Onboarding questionnaire:** Age, gender, level, L1, reason for learning, English usage frequency, prior lessons, target level, timeline, daily practice commitment, topic interests → generates a personalized learning plan/timetable. Let them choose when to do it (after they start, or skip and come back).
- 🟠 **Concise step-flow onboarding:** Short, optional walkthrough for typing, recording, playback, and review. "It shows you exactly what to do first and next."
- 🟡 **Walkthrough video — hyper clean and clear:** A polished demo video showing the full tool.
- 🟡 **Video questionnaire for onboarding:** Video-based intro that collects preferences.

## 5.2 Mark's Phoneme Coaching Videos

> *Individual videos for each phoneme sound, with Mark coaching how to produce it. Edited in CapCut. Pushed to users as they progress and specific problem sounds emerge.*

- 🟠 **Create individual coaching videos for each of the 47 phonemes:** Mark on camera demonstrating and explaining how to produce each sound. Not generic — expert-led, clinical, specific. These are the "deeper help" tier in the staggered intelligence system (Phase 2.3).
- 🟠 **Video surfacing tied to diagnosis engine:** Videos don't just sit in a library — they're pushed to the user when the system identifies that specific phoneme as a persistent problem. "You've struggled with /θ/ across 5 sessions — here's a 90-second video on exactly how to produce this sound."
- 🟡 **Reduced word chunk videos (later):** Once phoneme videos are done, consider videos for common reduced speech patterns (I wanna, I'm gonna, etc.) — but phonemes first.
- 🟡 **Explore VocalTractLab or similar** for enhanced 2D head/vocal tract animations to supplement Mark's videos.

## 5.3 Educational Content & Expert Demos

- 🟠 **Short expert demos:** Quick demonstrations of concepts and techniques — directly tied to the ID portfolio value.
- 🟠 **"Journey" video:** Explains the voice coaching and pronunciation improvement journey — timetables, difficulty, core concepts (placement, etc.), creating an "American character," having two heads (when to apply what), real conversation time vs. practice time.
- 🟡 **Articulation videos:** Slow-motion mouth/tongue/jaw movement demonstrations. Beyond the existing 2D cutout heads and front-facing mouth videos.
- 🟡 **Lip/tongue/jaw diagrams:** Enhanced anatomical reference.
- 🟡 **Watch-and-imitate videos:** Sound-specific videos going deeper than current phoneme demos.
- 🟡 **Cool phonetic alphabet descriptions/sounds display:** Could replace or run parallel to the tips that appear with phoneme pills.

## 5.4 Teaching the Concepts

- 🟠 **Teach feedback styles:** Explain to users when and why to use live vs. later feedback.
- 🟡 **Teach speed dial use:** Educate on why fluctuating playback speed matters for learning.
- 🟡 **CEFR explained for users:** Not just labels — actual explanation of what each level means and how Lux aligns.
- 🟡 **Better explanation of YouGlish — teach how to use it.**
- 🟡 **"Effective filter" concept:** Teaching users when to apply pronunciation focus (practice time) vs. when to just communicate naturally (real conversation). Two heads — knowing when to wear which hat.

## 5.5 Passages & Practice Material

- 🟠 **Many more practice passages:** Expanded library with L1-targeted difficulty profiles. Make some passages for every sound.
- 🟠 **Highlight words and phonemes in self-generated passages.**
- 🟡 **Streamline learning → practicing → repeating** in continuously larger formats with greater explanations.

## 5.6 Translation & L1 Support

- 🔴 **Universal translation — not just AI Coach/Deep Dive:** Currently only Deep Dive translates when L1 is selected. Quick Tips doesn't. The translation pipeline (via backend GPT) needs to flow through everything.
- 🔴 **When L1 is selected, flip everything:** Selecting a language should translate the entire UI into that L1. No English remnants after switching.
- 🟠 **Easy "flip to see English" toggle:** Quick switch back to English from any translated state.
- 🟠 **Audit for English remnants post-switch.**
- 🟠 **L1-targeted passage recommendations:** Passages recommended and visually tagged based on L1 relevance and common error patterns.
- 🟠 **Filter/sort passages by L1 relevance, topic, and difficulty.**
- 🟠 **Add language select to AI Conversations page.**
- 🟡 **L1 phoneme equivalents in tooltips:** Show a word in the user's first language that represents the target phoneme.

## 5.7 ID Career Tie-Ins

> *These items serve double duty: they improve Lux AND build Mark's ID portfolio.*

- 🟠 **Lux onboarding module (Articulate 360):** The first ID portfolio piece — a real product solving a real problem.
- 🟠 **Every onboarding/education feature is portfolio evidence:** Short expert demos, walkthrough videos, user flow documentation, progressive disclosure design — all demonstrable ID skills.
- 🟠 **ADDIE framework application:** The entire categorization and build-out process maps to ADDIE phases.

---

---

# PHASE 6 — ADVANCED FEATURES & EXPANSION

> *The innovative, differentiating features that require a solid foundation to build on.*

## 6.1 Voice Cloning for Pronunciation Modeling

- 🟡 **Voice cloning feature:** After a user records, generate a version of their own voice saying the phrase with perfect pronunciation. Technology exists now (ElevenLabs, etc.). User hears themselves — but correct. Potentially groundbreaking differentiator. No competitor does this.

## 6.2 Emotional & Psychological Dimension

> *"Very, very crucially important to me."*

- 🟠 **Emotional/psychological component of pronunciation work:** The anxiety, vulnerability, identity, and confidence aspects of working on your accent. Underrepresented everywhere and deeply important. Touches motivation, self-image, cultural identity, imposter syndrome, and the courage it takes to sound different. Needs concrete first steps — perhaps a confidence self-check-in tracked alongside objective scores.

## 6.3 Learning Paths & Advanced Progression

- 🟠 **Clear beginner-to-advanced progression:** Users need to see where they are, what's next, and the road ahead.
- 🟠 **2D progression map with checkpoints:** Visual roadmap showing completed nodes, current position, and next steps. Synced to database across sessions and devices.
- 🟡 **"Do this next" daily recommendations:** Lesson progressions and daily nudges based on where they are in the path.
- 🟡 **Goal-based mode selection:** User picks "Interview clarity" or "Customer service calls" → GPT chooses prompts and vocabulary, Azure measures, dashboard reflects that goal's KPIs.
- 🟡 **Visible content catalog:** A big, browseable catalog of everything available.
- 🟢 **Life-game concept:** A "Game of Life"–style experience where learning unfolds through a career/life narrative.

## 6.4 Auto-Generated Practice (Advanced)

- 🟠 **Auto-built "Pronunciation Playlist":** Daily 3–5 minute set from last session's weakest-but-fixable items: 2 minimal pairs → 1 stress pattern → 1 short sentence drill → 1 fluency repeat-after-me → 1 "use it in a real sentence" prompt.
- 🟡 **Spaced repetition for pronunciation:** Words/phonemes return on intervals based on improvement and decay.
- 🟡 **"Ask before you reveal" prompt:** Before showing results, ask: "Which sounds do you think you had the most trouble with?" Builds metacognition.

## 6.5 Personal Word Bank (Advanced)

- 🟠 **Auto-updating "problem word bank":** Words that repeatedly score low get saved, categorized, and turned into targeted drills automatically.
- 🟠 **"My Words" notepad — enhanced filtering:** Add more ways to filter. Build in a mastery color score that evolves as they practice each word more.

## 6.6 Scenario & Conversation Design (Advanced)

- 🟡 **Walk user through initial conversation prompts:** In the beginning, guide them between different starter questions.
- 🟡 **User-created characters:** Let users invent their own conversation character.
- 🟡 **AI-generated summary image:** Create an AI image based on the conversation summary.

## 6.7 Audio & Recording (Advanced)

- 🟡 **Session playback in summary:** Summary could replay user's recordings from that session. Auto-delete stored audio after a period, but let user download first. "Look how you sounded weeks ago vs. now!" growth demonstration.
- 🟡 **Phone microphone linking:** Explore whether users can link their phone's (often better) microphone to the browser app.
- 🟡 **Decouple phoneme demo sounds — use Mark's own voice:** Replace stock sounds with Mark's recordings.

## 6.8 Timers & Time Tracking

- 🟡 **Timer feature:** Optional visibility — user can see it while working or get it in summary ("Your total time on task was...").
- 🟡 **Accumulated time tracking:** Per session, day, week, all-time practice totals.
- 🟡 **Remind users of research-based time requirements:** Encouraging, not nagging.

## 6.9 Games & Interactive Activities

- 🟡 **Unscramble words / missing letters game.**
- 🟡 **Sound elongation game:** How long can they hold out and elongate sounds?
- 🟡 **Guitar Hero–style visual** for pronunciation practice.
- 🟡 **2D world map concept:** World's tallest mountains, one per continent, representing different pronunciation challenges.

## 6.10 Video & Media Content (Advanced)

- 🟠 **Ensure all phoneme images have accompanying video.**
- 🟠 **Fix thumbnails — lazy load:** Only a few load at a time, not all at once.
- 🟡 **YouGlish/YouTube thumbnail hover preview:** Mini preview + link on hover.
- 🟡 **Link each word to a top YouTube/YouGlish example with fallback.**
- 🟡 **Find a video copier/recreator for the 47 phoneme 2D heads:** Maybe VocalTractLab.

## 6.11 Characters & Animated Visuals

- 🟠 **All AI characters present in both Deep Dive and Quick Tips.**
- 🟡 **Mouth-synced characters in AI Conversation space:** Emoji, blank face, or face from photos? Linked to emotional tone? For both user and GPT character sides.
- 🟢 **AI-generated progress imagery:** Journey/growth-themed images — mountains, roads, trees, space, evolution, raindrop cycle.

## 6.12 NATO Phonetic Alphabet

- 🟡 **Add NATO phonetic alphabet reference.**

## 6.13 "What Are We Missing?" Meta-Analysis

- 🟠 **Every angle audit:** Every possible way to analyze pronunciation data — step back and look at it in the meta sense. There must be more dimensions.
- 🟡 **Challenging words in a thought cloud:** Size and frequency of mistakes rendered visually.
- 🟢 **Initial voice scan to determine accent:** User records a sample; system identifies accent characteristics and tailors initial recommendations.

---

---

# PHASE 7 — PLATFORM, BUSINESS & EXPANSION

> *The mobile app, the teacher version, monetization structure, competitive positioning. After the product is proven with real users (including Mark as Spanish-version user).*

## 7.1 Mobile App (Full Build)

- 🟡 **Full mobile app:** A true mobile experience — not just responsive tweaks but a purpose-built mobile version preserving core functionality. Massive undertaking; justified only after the product is validated.
- 🟡 **Quick/easy phone-friendly version (interim):** A stripped-down mobile experience as a stepping stone.

## 7.2 Teacher-Facing Version

- 🟢 **Version for teaching teachers:** A mode/version that teaches pronunciation instructors how to teach pronunciation. Very important to Mark. Could be a separate product line / dashboard rather than a toggle — B2B potential to language schools.

## 7.3 Monetization & Business

- 🟠 **Founder cost tracker / unit economics system:** Create one clear internal source of truth for every Lux-related cost — APIs, hosting, database, storage, subscriptions, domains, tools, and future services. Track fixed monthly costs vs. usage-based costs, what feature each service supports, and where each account is managed.

- 🟠 **Simple internal cost dashboard:** Build a lightweight internal-only dashboard/page showing all current Lux expenses in one place, total monthly burn, estimated variable spend, and simple revenue-vs-cost math. It should make it easy to answer: "Am I spending more than I'm bringing in?"

- 🟡 **Per-feature cost visibility:** Estimate which Lux features cost the most to operate — for example AI Conversations, realtime voice, Azure pronunciation analysis, storage, email, and future coaching-related tooling. This helps guide pricing, premium limits, and product decisions.

- 🟡 **Usage + pricing decision support:** Use dashboard data to shape payment plans, free-tier limits, premium feature gating, usage caps, and long-term business decisions. The goal is not just to track spend, but to make smart decisions from it.

- 🟡 **Payment plans:** Structure and present pricing options.

- 🟡 **Price positioning against competitors:** Demonstrate value for cost.

- 🟡 **Side-by-side feature comparison chart:** Lux features vs. each competitor.

- 🟡 **Price advantage display:** Show Lux stacked up — cheaper than all paid alternatives.

## 7.4 Competitive Analysis

### Competitor Landscape (Ranked by Cost)

| Tool | Cost | Notes |
|------|------|-------|
| SpeechAce (Enterprise/API) | Up to $500/mo | Top API tier |
| SpeechAce (Institution) | $1,999/yr for 500 users | Group licensing |
| Pronounce (Professional) | High-end (price varies) | Unlimited recording + premium |
| BoldVoice | ~$150/yr | Full access annual |
| ELSA Speak | $12–15/mo, $70–90/yr, $150–200 lifetime | Various market pricing |
| Forvo, HowToPronounce | Free/freemium | Basic lookup tools |
| **Lux** | **TBD — cheaper** | **Show this advantage** |

### What Competitors Do Well (Learn From)

- Paths forward for practice, built-in notes / study groups + dictionary
- Role play varieties, different approaches to presenting AI feedback
- IPA or L1-phoneticized word under English word, daily lesson plans
- Orientation from start, clock feature encouraging more time
- Payment plans, grouping feedback clearly, roadmap / 2D vision forward
- 🟡 **Study ELSA Speak and BoldVoice:** Try BoldVoice free for one week.
- 🟡 **Differentiate from ELSA's style:** Lux is clinical/diagnostic/linguistic, not bubbly/gamified/simplified.

## 7.5 Language Expansion (Beyond Spanish)

- 🟢 **Additional languages:** Once Spanish proves the architecture is language-agnostic, expand to other high-demand languages.

## 7.6 Downloads, Reports & Email

- 🟡 **Quick download from My Progress overall data page.**
- 🟡 **Periodic reports or assessments every X amount of time.**
- 🟡 **Personalized Supabase email links.**

---

---

# ONGOING — TECHNICAL & INFRASTRUCTURE

> *These run in parallel across all phases, not sequenced.*

## Performance

- 🟠 **Performance audit everywhere:** Where it's slow, speed it up. AI feedback load times, phoneme/word analysis, page load/first paint.
- 🟠 **Background workers for heavy processing:** Assessment, phoneme processing, and large transforms off the main thread.

## Code Quality

- 🟠 **Continuous hygiene / modularize / refactor:** Ongoing discipline.
- 🟡 **Codex for finding incongruencies and fixes?**

## Security

- 🟠 **Security all around:** Comprehensive security pass.

## Accessibility

- 🟠 **Error messages, ARIA labels, keyboard navigation:** Accessible alerts, full keyboard support.

## Conceptual Flow

- 🟠 **Communicate the flow idea:** Conversations (zoom out) → Practice Skills (zoom in). Make this spatial metaphor visible and intuitive.
- 🟠 **Identify and publish the user flow:** The user's path through Lux should be a deliberate, designed journey.

---

---

# CLAUDE'S OBSERVATIONS & SUGGESTIONS

> *Patterns and gaps noticed while organizing.*

### What's Already Strong

1. **The phoneme-first philosophy is your moat.** Most competitors treat pronunciation at the word or sentence level. Phoneme-level diagnosis, if fully built, is genuinely differentiated.

2. **The "clinical, diagnostic, linguistic" aesthetic is the right call.** There's an underserved market of serious adult learners turned off by gamification.

3. **The staggered intelligence concept (Phase 2.3) is now the connective tissue of the whole product.** It ties together the L1 profiling, the diagnosis engine, the AI Coach, the phoneme videos, and the Mark-as-coach feature into a single coherent escalation path. This is the user journey.

4. **The auto-reference loop concept is clever.** Turning free speech into scoreable data without making it feel like a test — real UX innovation if executed well.

5. **The voice cloning idea is genuinely novel.** No competitor does this. "Hear yourself but correct" is psychologically powerful. Worth prototyping even if it ships later.

### Gaps & Suggestions

6. **The L1 profiling system (Phase 2.1) should be backed by a real data table.** Build a concrete L1 → expected error patterns matrix. This is researchable — there's extensive SLA (second language acquisition) literature on transfer errors by L1. A solid table for the top 10–15 L1s would cover the vast majority of users.

7. **Recording storage / privacy policy** needed — especially with voice cloning on the roadmap. Both a legal and trust issue.

8. **Missing: offline/low-connectivity mode.** Many ESL learners practice in contexts with unreliable internet. Even a basic offline drill mode using cached phoneme data could be valuable.

9. **Missing: social/community layer.** Study groups, practice partners, shared progress. May conflict with clinical aesthetic — worth thinking about.

10. **The teacher-facing version could be a separate product line** rather than a toggle — distinct dashboard aggregating student data with teaching guidance. B2B potential to language schools.

11. **The Mark-as-coach feature creates a natural feedback loop for product development.** Every 1-on-1 session is also a user research session. Consider keeping lightweight notes from coaching sessions that feed back into product priorities.

---

---

# APPENDIX A — V2 RESTRUCTURE SUMMARY

> *What changed between v1 (topic-organized) and v2 (phase-ordered), and why.*

## The Big Shift

Instead of organizing by topic (Scoring, Personalization, Phonemes, etc.), v2 reorganizes the entire catalog into seven sequential phases — Fix, Differentiate, Polish, Dogfood Spanish, Teach, Expand, and Mobile. You work your way down the document and you're building in the right order.

**Phase 1 — Fix What's Broken.** Foundation work. Save Progress, WaveSurfer TTS rendering, syllable stress functionality, uniform scoring and color-coding across the whole app. And critically, the data aggregation layer — pulling pronunciation data from both passages and AI conversations into one unified profile under one login. This is the backbone that everything else hangs on.

**Phase 2 — Core Intelligence.** This is where Lux becomes genuinely different. The diagnosis engine (error signature detection, root-cause narration), phoneme-first targeting, the auto-reference loop for free speech. Intelligence escalates over time: simple immediate feedback for one attempt, then as patterns form, the system gets more serious — drills, phoneme coaching videos, targeted recommendations, and eventually offering Mark himself as a personal coach. That staggered escalation is the connective tissue of the whole product. Also here: L1 profiling as an upfront hypothesis (not a cage), feeding into everything downstream.

**Phase 3 — Polish and UX.** Progressive disclosure, the "plain simple farmer grandma kindergarten" labeling pass, observable clicks and loads, the clinical diagnostic aesthetic baked in consistently. Hard-wall all the AIs to their missions. This is where Lux goes from powerful-but-confusing to powerful-and-intuitive.

**Phase 4 — Spanish Version.** Dogfooding phase. Mark becomes his own power user. New phoneme inventory, Spanish Azure scoring, Spanish CEFR descriptors, Spanish TTS, new scenarios. Proves the architecture works across languages, which is huge for the long-term vision.

**Phase 5 — Onboarding, Education, Content.** Walkthrough video, expert demos, more passages, the Articulate 360 onboarding module for the ID portfolio. The product needs to be genuinely good before you teach people how to use it.

**Phase 6 — Advanced Features.** Voice cloning (genuinely novel — no competitor does this), the emotional/psychological dimension, games, spaced repetition, the teacher-facing version as potentially its own product line.

**Phase 7 — Mobile.** After the product is proven with real users, then tackle true mobile.

## What Got Boosted

- **Staggered Intelligence** got its own full section showing the escalation from immediate feedback all the way to Mark as personal coach. Was scattered across two small bullets before.
- **L1 Profiling** is now the opening move of Phase 2. Was buried in L1 content recommendations before.
- **Phoneme Coaching Videos** — 47 individual CapCut-edited videos surfaced by the diagnosis engine — now its own section in Phase 5. Wasn't a distinct item before.
- **Mark as Personal Coach** moved from a throwaway monetization bullet to a proper feature section with two access paths (staggered escalation + direct from the beginning) and pricing philosophy.
- **Spanish Version** went from a single 🟡 bullet called "Spanish flip" to an entire phase with rationale and concrete build requirements.

## The Pattern

About sixty percent of the ideas in this catalog plug directly into the three locked roadmap items — phoneme-driven passage library, generate next practice, and data aggregation. Build those well first and a lot of the rest becomes natural extensions.

---

---

# APPENDIX B — HONEST ASSESSMENT

> *Claude's unfiltered take on the overall vision, strengths, risks, and what to watch for.*

## What's Right

The philosophy underneath everything is right. Lux isn't chasing gamification or simplification — it's leaning into "the fascinating science of sound" for serious learners. That's genuinely underserved. ELSA and BoldVoice own the bubbly lane. Lux owns the clinical, diagnostic, linguistic lane. That's a stronger position because it attracts people who actually want to improve, not just rack up streaks.

The phoneme-first architecture is the real moat. Most tools treat pronunciation as word-level or sentence-level noise. Lux goes phoneme-level with error signatures, root-cause narration, and triggered coaching. If executed well, competitors can't copy it without rearchitecting everything. That's defensible.

## The Honest Concern

This is a really ambitious vision. Seven phases. Forty-seven coaching videos. L1 profiling. Voice cloning. Teacher dashboards. Spanish version. The locked roadmap alone is massive work. And Mark is solo on this, working full-time teaching ESL.

The question isn't whether this vision is good — it is. The question is: **what's the minimum viable version of Phase 1 and Phase 2 that gets a product real users will actually use and pay for?** Not stripped down to nothing, but focused. Trying to do all of Phase 1 perfectly before touching Phase 2 means months in the weeds.

## Recommended Focus

Fix the data aggregation (table-stakes), nail the diagnosis engine (differentiator), get the phoneme-coaching videos working, and get the one-fix feedback loop solid. Ship that. Get five real users. Watch what breaks. Iterate outward from there.

The Spanish version as dogfooding is genius timing-wise — Mark will feel the friction immediately and iterate faster. But it might work as a Phase 4.5 (lighter, faster) rather than a full phase, until the English version is validated.

## Gaps Worth Watching

- **Offline/low-connectivity mode** — many ESL learners practice in contexts with unreliable internet.
- **Voice data privacy** — especially with voice cloning on the roadmap. Both a legal and trust issue.
- **Social/community layer** — study groups, practice partners. May conflict with clinical aesthetic, but worth considering.
- **Teacher-facing version as its own product line** — separate dashboard, B2B potential to language schools, rather than a toggle in the same app.
- **Voice cloning** — genuinely novel, no competitor does it. Worth prototyping early even if it ships later.
- **Mark-as-coach sessions as user research** — every 1-on-1 is also a product feedback session. Keep lightweight notes that feed back into priorities.
