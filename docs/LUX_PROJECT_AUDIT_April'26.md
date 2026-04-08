# Lux Project Audit — April 2026

> **Context:** This audit was originally conceived as a baseline test before handing the project over to OpenClaw / Simoishi (the autonomous code-janitor bot). It grew into the most thorough end-to-end review the project has had — possibly ever. It captures what's working, what's broken, what needs polish, and a long list of feature ideas, organized by page and feature area.
>
> **How to read this:** Each section keeps the original checklist (✅ working / ❌ broken / ⚠️ partial), followed by observations, bug notes, polish ideas, and feature thoughts. Console errors are preserved verbatim. Nothing has been deleted — only reorganized.
>
> **Strategic context (read this first):** Mark is preparing to shift focus to a career transition into Instructional Design. The goal is to get Lux to a *safe-to-leave-for-a-while* state in **days, not weeks**. Priority is the **core practice loop** (Practice Skills page + Guided AI Conversations). Lower priority: Streaming (push if time allows), Word Cloud, Life Journey, admin data tracking. Future-priority: mobile responsiveness, full onboarding rebuild (which doubles as ID portfolio work).

---

## Table of Contents

1. [Page 1: Practice Skills (`index.html`)](#page-1-practice-skills-indexhtml)
2. [Page 2: AI Conversations (`convo.html`)](#page-2-ai-conversations-convohtml)
3. [Page 3: Progress Dashboard (`progress.html`)](#page-3-progress-dashboard-progresshtml)
4. [Page 4: Word Cloud (`wordcloud.html`)](#page-4-word-cloud-wordcloudhtml)
5. [Page 5: Life Journey (`life.html`)](#page-5-life-journey-lifehtml)
6. [Page 6: Streaming (`stream.html` / `stream-setup.html`)](#page-6-streaming-streamhtml--stream-setuphtml)
7. [Cross-Cutting Checks](#cross-cutting-checks)
8. [Project-Wide Issues Log](#project-wide-issues-log)
9. [Sign-off & Strategic Priorities](#sign-off--strategic-priorities)

---

# Page 1: Practice Skills (`index.html`)

## 1A. App Boot & Layout

### Checklist
- ✅ Page loads without console errors
- ✅ Top banner renders — *note: not entirely clear what "Lux logo" referred to, but the area called "Tips" loads correctly*
- ✅ Passage dropdown is visible and populated
- ✅ Harvard Sentences picker is visible and functional
- ✅ Record / microphone button is visible
- ✅ Bottom nav bar renders
- ✅ Warp transition animation plays between pages

### Bugs / Console Errors

**Bug 1A.1 — `setString is not defined` when opening Harvard Sentences list:**
```
lux-warn.js:70 [LUX_SWALLOW] features/harvard/modal-actions.js
ReferenceError: setString is not defined
  at selectHarvardList (modal-actions.js:94:5)
  at setSelected (interaction-handlers.js:20:10)
  at setSelected (modal-controller.js:233:12)
  at renderHarvardModalList (modal-render-list.js:297:35)
```
Stack trace continues through `renderList`, `open`, `openBrowse` (index.js:242). This is a real reference error that should be fixed — looks like a missing import in `modal-actions.js`.

**Bug 1A.2 — Phoneme Hover re-init warning** (observed when rolling the dice for a Harvard passage):
```
index.js:38 [LUX] Phoneme Hover System already active. Skipping re-init.
  setupPhonemeHover @ index.js:38
  wirePostDom @ header.js:207
  (anonymous) @ render-core.js:77
  requestAnimationFrame
  renderPrettyResultsCore @ render-core.js:77
  showPrettyResults @ render-modern.js:20
  showPrettyResults @ index.js:102
  handleRecordingComplete @ index.js:189
  await in handleRecordingComplete
  mediaRecorder.onstop @ media.js:129
```
Probably harmless (it's a guard doing its job), but flagged for awareness.

### UX / Polish Notes

**1A.3 — "Troubled Sounds / Troubled Words" labeling is unclear:**
The recent split of "What You Just Did" vs "Your Combined Total" into two distinct, independently actionable fields was a good change, but the area marked "Troubled Sounds" or "Troubled Words" sits below both, and it's not clear which one it belongs to. It probably belongs to the Combined Total — but that needs to be made explicit. The current layout is starting to slip into the "overwhelming / too much at once" zone, which violates the core aesthetic. The whole block needs rethinking. Also: what appears when you click on a sound or word that's marked as "bad" needs to be cleaned up and made more useful.

**1A.4 — AI Coach / metric scoring misalignment:**
The AI Coach is suggesting to focus on `/l/`, but the trouble sound in "What You Just Did" is flagged as `/z/`, and the "Your Combined Total" focus phoneme is `/t/`. This is part of a broader scoring alignment problem — either these need to agree, or if they're intentionally measuring different things, we need to explain *why* they differ (both for me to understand, and for the user).

**1A.5 — Score-area cleanup (general):**
When entering the different scoring parts — Prosody, Pronunciation, Accuracy, Fluency, Completeness, Overall — all of these fields need cleaning up and improving.

**1A.6 — Warp transition smoothness:**
Warp does function between all pages, but I want to improve it. Or at least rethink it — I'm not totally satisfied with it. It might just be that it needs more frames in the transition to look smoother.

**1A.7 — Picker page drawer smoothness:**
While I'm thinking about smoother transitions: the drawers on the picker page that open from the left (characters) and right (settings) sides could also use more injected frames. They're not as smooth as I'd like.

**1A.8 — TTS drawer / Voice Mirror reveal animation:**
On the TTS drawer, with the new voice cloning / mirroring feature, we need to add a smoother appearance for the mirror part. Currently the drawer is a container that shrinks to fit its content, so the voice mirroring weirdly pops in suddenly when it loads after the drawer is opened. It should appear to slide open and down underneath the drawer cleanly.

---

## 1B. Passage Selection

### Checklist
- ✅ Select a passage from the dropdown → text updates in the practice area
- ✅ Select a Harvard sentence → text updates, parts info tip shows list count
- ✅ "Random" Harvard sentence works (picks a new one each tap)
- ⚠️ Practice highlight renders correctly — blue (phoneme words), yellow (trouble words)

### Observations on Practice Highlight (1B partial)

The highlighting is working in the AI Conversation page (it highlights blue for the target sounds), but **it is NOT highlighting in the Practice Skills page input field**. It's not highlighting words at all in either context — only sounds in the convo space.

Design philosophy on this:
- The sound (phoneme) should be the primary, most prominent focus.
- A target word that pops up naturally in conversation should get *the slightest* nudge — not forceful, just enough to remind the user "we're practicing these words."
- The conversation flow being natural is more important than injecting target words awkwardly.
- We need yellow word highlighting to be functional in both spaces.

The legend itself (in both AI conversation and practice skills) is way too small and not clearly explained or defined.

This connects to the core access flow: when the user opens "My Progress" after recording something, they can choose either "What You Just Did" or "Your Combined Total," and from there hit Start Harvard / Start Passage / Drill / Quick Practice / Choose Scenario. Those buttons all work, but the highlighting in the input field after selection is broken on the Practice Skills side. The legend is also too small and unclear in both spaces.

---

## 1C. Recording & Pronunciation Assessment

### Checklist
- ✅ Tap Record → microphone permission prompt appears (or recording starts)
- ✅ Audio mode switch works (toggles between hold-to-record and tap modes)
- ✅ Recording indicator / visualization shows while speaking
- ✅ Stop recording → results appear (1–3 seconds for Azure response)
- ✅ No "Failed to fetch" or network errors during assessment

### Observations on Audio Mode Switch (1C related)

The audio mode switch *works*, but the whole **Streaming page** needs updating, investigation, and work. Specifically:

1. **Auto mode won't initiate from cold start.** I have to put it on Tap first, then switch it to Auto, after which everything works fine. It needs that initial "ignition" to happen on Tap.
2. **No assessment connected to Streaming.** The streaming service has none of the pronunciation assessment / analysis / testing pipeline connected to it. The back-and-forth conversation is awesome and happens fast and naturally — but there's no actual assessment of any kind happening yet. It would probably be relatively easy to pull over what we already have for the other modes.

---

## 1D. Results Display

### Checklist
- ✅ Score ring renders with a numeric score (0–100)
- ✅ Metric tiles show (Accuracy, Fluency, Completeness, Prosody)
- ✅ Tapping a metric tile opens the Metric Score Modal with detailed breakdown
- ✅ Trouble chips render below results
- ✅ Word-level results table shows (color-coded)
- ⚠️ Syllable stress view renders correctly — *only partially working. It does split the syllables up, but...*
- ❌ Passage summary / results summary path is currently unstable — *see console error below*

### Bugs / Console Errors

**Bug 1D.0 — Passage summary throws `mountVoiceMirrorButton is not defined`:**
When trying to open the passage summary, the summary page throws a front-end reference error and stops rendering correctly:

```
main.js:49 [LUX] Uncaught error: Uncaught ReferenceError: mountVoiceMirrorButton is not defined http://localhost:3000/features/results/summary.js 179
(anonymous) @ main.js:49
requestAnimationFrame
showSummary @ summary.js:178
showSummaryWithTracking @ summary-shell.js:76
showSummary @ index.js:126
(anonymous) @ main.js:239

summary.js:179 Uncaught ReferenceError: mountVoiceMirrorButton is not defined
    at summary.js:179:7
```

This whole summary page is likely getting revamped anyway, but this specific error should be logged explicitly because it blocks the current passage-summary flow from rendering cleanly.

### Big Issue: Metric Modal Cards Need Major Improvement

Looking at the metric modal cards (e.g. for Pronunciation):

1. **CSS work needed.** Cleanup pass required. The buttons don't have any hover or darkening effect.
2. **Too wordy.** We could do a better job showing less information up front, with crucial info first, and drawers to expand for more.
3. **The "How to interpret it" section is static and dumb.** Example: it says "if completeness is low, slow down and prioritize saying every word" — but it shows that even when the user's completeness is 100%. It needs to react to the actual score.
4. **Same problem on Fluency.** It says "a few long pauses hurt more than many tiny pauses" — even when the fluency score is 99%. Generic boilerplate. Make it specific and relevant to the actual score in each category.
5. **Repetition.** Some content is repeated across cards. E.g., "lowest driver is prosody" appears in every single card. Maybe that's intentional for cross-comparison, but I'm not sure. Worth re-examining.

**Bottom line:** Clean it up, **make it smarter, more reactive, friendlier, and more useful**. We've already built it and we have the means to make it smart — we just need to actually wire that intelligence in.

### Trouble Chips & Word-Level Table — Same Pattern

- ✅ Trouble chips render — **but they need to be made more intelligent too.**
- ✅ Word-level results table renders — **same as phoneme chips. Make them smart and actually useful. Shouldn't be a huge task.**

### Syllable Stress View (partial)

It does split the syllables up, but the rest of the rendering is incomplete. Needs investigation.

---

## 1E. Phoneme Hover System

### Checklist
- ⚠️ Hover/tap a phoneme chip → tooltip with IPA symbol, example word, mouth diagram
- ⚠️ Tap "Expand" on tooltip → Video Focus Modal opens with pronunciation video
- ✅ Video plays in the modal
- ✅ Close the modal → returns to results view cleanly

### Observations

**1E.1 — Sound delay / cold-start failure on tooltips:**
All the hover features are working, which is great, but the **sound frequently doesn't start right away**. The video shows immediately, then the sound kicks in late. Sometimes it has to be restarted a few times before sound plays.

**1E.2 — Button contrast in expanded view:**
On second investigation, there are no console errors, but the CSS needs work. The buttons in the expanded view need more contrast — it's like dark gray on black, hard to see where the buttons actually are.

**1E.3 — Tooltip content gaps (huge):**
The tooltips have placeholders. We've got to actually fill in all the different tooltip content for each phoneme. There are three cycles through:
- Plain tip
- Technical tip
- Common mix-ups

I think **none of them have the technical explanation**. I think all of them have the plain one, but the technical and common mix-ups are often missing or incomplete. This needs a content pass.

**1E.4 — New tooltip cycle: Example Words:**
We don't have sample words that contain the sound. That should be added — possibly as a fourth cycling tooltip alongside Plain / Technical / Common Mix-ups: *Example Words That Use The Sound*.

**1E.5 — Side / front video toggle bugs:**
In the expanded field, when you click on the videos, there are two views (side and front). Sometimes one will work, sometimes it won't. We need it more consistent.

**1E.6 — Click-to-play directly on video:**
The user should be able to click on the video itself to make it play or pause, not have to use the buttons that say Side / Front / Both. The buttons more reliably work, but the user should intuitively understand to click the video. **Clicking directly on the videos in both expanded and normal views should consistently make them play and pause.**

**1E.7 — 1.6× speed sound bug:**
When I put the video on 1.6× speed, the sound is just not working, period. The video plays, but the sound does not accompany it.

---

## 1F. AI Coach Feedback

### Checklist
- ✅ After results, AI Coach panel appears (or "Ask AI Coach" button)
- ✅ Coach generates feedback text about your pronunciation
- ✅ Feedback references specific phonemes/words you struggled with
- ✅ No 429 or API rate limit errors

### Major Re-Think Needed: AI Coach Across The App

This is a really big category that needs deep investigation. The AI coaches are great, but we really need to **calibrate them better**. The utility isn't being fully maximized, and I haven't even thought of all the ways it could be — there are probably a million ways I'm leaving possible utility out.

It's incredible that we have an AI wrapper right here to tell you specific, real-human-language information about your pronunciation. So this whole field needs deep diving. I'm going to ask Claude (and/or ChatGPT) to help me think through how we can use it, because we've got the entire AI's abilities in this one box, and there are so many ways it could possibly be utilized.

#### Layout & Structure Concerns

- The layout could probably be improved.
- We have ~5 metrics currently.
- Coaching styles: Tutor, Sergeant, Expert. **This could be improved** — possibly more styles, possibly a "directed at a teacher" style for ID/teacher use.
- Modes: Quick Tips or Deep Dive.
- When it renders, it gives 6 different possible categories that it responds to in chunks of two. **I want to reanalyze: are we really asking the 6 most important questions? Is presenting them in chunks of 2 the best format?**
- Possibly add **adjustable knobs** like the convo picker — particularly for **length of response**.

#### Smarter Model?

I'm not totally sure it's actually being very accurate right now. We need a smart enough model to really interpret and give reliably good responses. Maybe we need to hook it up to a smarter model. The user probably won't be calling on it constantly, so when they do, **it needs to be really good**. Worth making sure it's very well constructed even at the cost of latency.

#### Coverage Across The App

The AI Coach is strategically placed in many different parts of the app:
- **Practice Skills area** — present.
- **AI Conversations (guided practice)** — present, basic build.
- **All Data / shared aggregated page** — present but **not even hooked up yet**.
- **AI Conversation space (deeper integration)** — probably not really hooked up either.

Each location needs to be **uniquely targeted to its area**, not just generic "give responses to stuff." From the drawing board up, I'd like to reanalyze and rethink the whole AI Coach category.

**1F.1 — AI Coach should react to the selected L1, not stay generic/neutral:**
This is a genuinely important refinement. If the user has selected a first language, the AI Coach should be aware of that and tailor its explanations, likely transfer issues, and wording accordingly. That does **not** mean drowning the user in linguistic jargon or turning every response into translation mode. It means the coach should be *smart in relation to the user's L1* when that's helpful.

Examples of what this could mean:
- anticipating likely sound confusions tied to the user's L1,
- adjusting explanation style,
- optionally giving short strategic comparisons when useful,
- staying simple and supportive instead of neutral-to-the-point-of-vagueness.

#### Open Question: Should The User Be Able To Type To The AI Coach?

I've been toying with this for a while. We could build it in, but is it a good idea?

Arguments for: huge interactivity and depth.
Concerns: lots of work, and we'd have to be very careful with system-wide constraints / guardrails so it doesn't get used the wrong way (e.g., "what's the weather in Sydney today?"). It needs to stay focused on what it's supposed to do.

Related principle: if the AI Coach becomes more interactive, it should stay anchored to **Lux content, Lux results, and pronunciation work happening inside the app**, not become a general-purpose chatbot.

I do think we should think about making it interactive. **Want Claude's opinion on this.**

### Observation on "Feedback References Specific Phonemes/Words" (1F partial)

This is pretty complicated and I'm not sure how to weigh it up, but **we may need to reconsider the math** by which we determine which phoneme or word is the user's actual focus area. Word frequency is the tricky variable: we've adjusted for it so that "the / a / and" don't dominate, but how that interacts with poorness-of-pronunciation needs another deep look. Are we using the best method possible right now to surface trouble sounds and words?

---

## 1G. TTS (Text-to-Speech) Drawer

### Checklist
- ✅ Speaker icon is visible on the passage text
- ✅ Tap speaker icon → TTS drawer slides open from bottom
- ✅ Audio plays the passage text in the model voice
- ✅ Playback controls work (play/pause, scrub)
- ✅ Waveform visualization renders (WaveSurfer)
- ✅ Close drawer → drawer slides shut cleanly

### Observations (TTS + Self-Playback combined notes)

> Note: this section and 1H below got a little entangled in the original audit because TTS and Self-Playback share a lot of UI surface. Both sets of notes are preserved.

**1G.1 — Cold-open glitch / spasm:**
The TTS drawer loads in a weird way. The first time you click it open, it opens out — but then it expands again to accommodate the Voice Mirror button. It looks like a glitch, like it spasms into existence.

**Idea:** Make this *intentional* with a smooth animation. After the drawer fully loads its initial pullout (with just the cleanly-wrapped TTS controls), do a cool little animation to reveal the Voice Mirror dropping down smoothly.

**1G.2 — Play button needs multiple presses sometimes:**
In the TTS drawer, pressing play frequently doesn't make the audio work on the first try. Have to press it a couple times. Needs cleanup.

**1G.3 — Voice Mirror button width:**
The Voice Mirror is a little blue box, but I'd like it to stretch the full width of the drawer. Currently there's lots of empty space that looks odd.

**1G.4 — Download button consistency:**
We have a download button for TTS and Self-Playback, but **not for "Hear It In My Voice"** (the voice mirror). I want to be able to download that too. The download button visual isn't consistent across the three places either — pick one design and use it everywhere, including for the voice mirror.

**1G.5 — TTS in AI Conversations renders differently:**
Worth flagging that the TTS drawer behaves a little differently in the AI Conversation space. Details under section 1H below and section 2E.

---

## 1H. Self-Playback Drawer

### Checklist
- ✅ After recording, "Listen to yourself" tab/button appears
- ✅ Tap it → Self-Playback drawer opens
- ✅ Your recording plays back
- ✅ Karaoke word highlighting syncs with playback
- ✅ Close drawer → returns cleanly

### Observations

**1H.1 — Symmetry between SPB (left) and TTS (right) is broken:**
A lot of self-playback drawer behavior was already noted in 1G. But on the **expanded view**, it's all over the place. As much as possible, I wanted symmetry between SPB (left) and TTS (right), but it wasn't fully symmetrical even before the Voice Mirror was added — and now it's even worse.

In an attempt to organize earlier, we actually made things worse:
- The play button is really small on the TTS side.
- Should be consistent between sides.
- I remember the issue was that there was a hover bug where it would look ugly if you moused over it. So we may need to look at this from an aesthetic point.
- All the actual buttons appear to be working — **there's just a delayed start from the audio side at times.**

**1H.2 — AI Conversation page TTS/SPB is a "spaghetti mess":**
All the prior notes were focused on the Practice Skills page. When you go to the AI Conversations page, **it's a different and much worse story**. The text-to-speech side is truly, totally entangled hideously:

- The expand button is included *inside* the expanded section already. Doesn't make sense.
- The TTS drawer in convo has an extra dropdown for selecting *who speaks* (you can go back and forth between AI / Me / a selection — choosing whose voice to hear). That additional dropdown has made things almost impossible to see anything meaningful.
- Everything is technically *working*, but it's such a jumbled mess that some features are actually impossible to interact with because they're hidden behind other features crammed in.

**1H.3 — PROPOSAL: Move Voice Mirror from TTS drawer to Self-Playback drawer.**

This is the most significant idea in this section. Currently the Voice Mirror lives in the TTS drawer, which makes some sense (it's a TTS feature), but the SPB drawer has more space and would benefit from grouping "your voice" things together:

**Reasons to move:**
- **Logical adjacency:** "Hear your own voice" (SPB) and "Hear the cloned version of your voice" (Voice Mirror) make sense together.
- **Faster button-clicking workflow** — they'd be physically closer.
- **More space in the expanded SPB view.** The TTS drawer already has many features to manipulate; SPB has comparatively few.
- **Frees up space in the TTS drawer** — currently very crammed.

**The reason it was in TTS originally:** I didn't want SPB using more real estate because the My Words notepad has to load under it. That constraint may need re-thinking too (see 1J below — the proposal there is to let whichever drawer was opened *last* overlap the other one, removing the rigid stacking constraint).

**Action item:** Make a note to consider moving Voice Mirror to the Self-Playback drawer (under the existing controls in the expanded view). This is probably the best positioning.

---

## 1I. Voice Mirror ("Hear it in my voice")

### Checklist
- ✅ "Hear it in my voice" button appears in TTS drawer (if voice profile exists)
- ✅ If no profile: tapping opens the Voice Onboarding modal
- ✅ Voice Onboarding: multi-step recording flow works (record → upload → clone)
- ✅ If profile exists: tapping plays the passage in your cloned voice
- ✅ Audio plays without errors

### Observations (Voice Onboarding improvements)

**1I.1 — Match ElevenLabs onboarding pattern:**
ElevenLabs doesn't even give you a script. It just gives you a clock that counts up, and says "up to 30 seconds, minimum 10 seconds." We should do that as well for our onboarding. For the first part — and ideally for **each of the five recordings**:
- Add the clock.
- Add the "at least 10 seconds" minimum.
- Add a message: *"the more recordings, the better"* (if not already obvious).

**1I.2 — Freestyle vs Read-from-script choice:**
Let the user choose between:
- **Freestyle** — just blab about whatever they want.
- **Read from script** — use the provided text.

Either is fine.

**1I.3 — Retry button:**
Add a retry button so they can re-do a recording if they feel the first one wasn't good.

**1I.4 — Quality / environment messaging:**
Add the ElevenLabs-style messages: *"Avoid noisy environments / check microphone quality / use consistent equipment."* In fact, **this messaging should probably also be in the first onboarding slideshow**, not just in the Voice Mirror onboarding.

(There were a few other Voice Mirror references earlier in the document — see 1G and 1H notes above.)

---

## 1J. My Words Panel

### Checklist
- ✅ My Words panel is visible (compact mode on main page)
- ✅ Words you've practiced appear in the list
- ✅ "View Library" button opens the full Library Modal
- ✅ Library Modal: Active and Archived tabs work
- ✅ Archived tab: Send / Restore / Delete actions work
- ✅ Word Reference and Youglish links open correctly

### Observations

**1J.1 — Drop the "always under SPB" constraint:**
Originally I built it so the My Words side panel (bottom-left) had to fit under the Self-Playback drawer and never go too far wide relative to the input field. **I want to scratch that.** New rule: whichever drawer was opened *last* (SPB or My Words) is the one that overlaps the other. That'll let My Words breathe — sometimes it's currently cramped because of the constraint. And SPB will be even larger after we move Voice Mirror to it (see 1H.3).

**Sizing rule:** Maybe relative to the viewport — vertical up to 3/4 of screen height, horizontal out to about 1/5 of screen width (1/4 is too much). The original "relative to input field" approach works on the Practice Skills page but breaks on the AI Conversation page where it doesn't line up to the input field's far left. Worth thinking about further.

**1J.2 — Words over 5 disappear silently — should auto-archive:**
The compact panel is correctly limited to ~5 words/phrases so it doesn't scroll forever. But if you add more, **it's not obvious that they go to the archive — they just disappear.** When the user goes over 5 words, they should automatically fill into the library, with clearer signaling.

**1J.3 — Permanent "View Library" button:**
We need a *permanent* "Go To My Library" button, available even when the library is empty. Currently the only way to enter the library is by hitting "Archive Word" — that's wrong. There needs to be a See My Library button always available, even with nothing in it.

**1J.4 — The 6 buttons need explanation (UX):**
We need to explain the six buttons. Either little question marks / parentheses (like we did much earlier for the recording quality metrics — pronunciation / prosody / completeness etc.), or some other tooltip-style explanation. As it is now, **it's not at all clear what the buttons do — confusing even for me, certainly for a user.**

**1J.5 — Library → Back → My Words flow:**
When you're in the library and click back to My Words, it just *closes* the library modal. It should close the library modal **and re-open the My Words panel**.

**1J.6 — The "Add" button:**
The Add button needs to be bigger and more clear about what it does. There's a little description next to it, but it's not enough. **All the buttons need better explanation, especially Add.**

**1J.7 — Always show View Library + word count badge:**
Always show the View Library button on the bottom (it currently only appears when there's something in the library). I like that it has a little number badge to indicate how many items are stored — keep that.

---

## 1K. Next Practice / Generate My Next Practice

### Checklist
- ✅ After practice sessions, "Next Practice" suggestion appears
- ✅ It targets your weakest phonemes (based on rollup data)
- ✅ Tapping it loads the recommended passage

### Observations

**1K.1 — Make My Progress squares collapsible:**
In the My Progress area (where Quick Practice / Choose Scenario / Start Harvard / Start Passage-Drill buttons live), there's no way to **collapse the three top squares** — Sessions, Average Score, Trends. They should be collapsible like everything else. There's no reason they should always be open.

**1K.2 — Buttons themselves work, but legend doesn't:**
Start Harvard, Start Passage, Quick Practice, Choose Scenario — all functioning. But:
- The legend for the color explanation **is too small** and not clearly explained.
- The input field on the Practice Skills page **is not doing blue/yellow highlighting at all**. We may need to change the format of that area to support highlighting.
- Same issue: the legend itself needs to be made clearer and more understandable in both contexts (Practice Skills and AI Convo).

> Note: this overlaps with 1B observations on highlighting.

---

## 1L. Save Progress / Auth

### Checklist
- ✅ "Save Progress" button is visible
- ✅ Tapping it opens the login modal
- ✅ Magic link sign-in flow works
- ✅ After login, badge/indicator changes to show logged-in state
- ⚠️ Practice history persists across sessions when logged in — *think it works but not 100% certain*

### Observations

**1L.1 — Magic link email itself could be cleaned up:**
Nothing is broken here, but the email itself could be improved. We'll analyze and think about how to make it nicer at some point — but **way down the priority list**.

**1L.2 — Verify cross-session history persistence:**
I'm not 100% sure on this one but I *think* it's good to go. Worth a deliberate test.

---

## 1M. Onboarding

### Checklist
- ✅ Add `?onboard=1` to URL → onboarding overlay appears
- ✅ 4 cards step through correctly (Next button advances)
- ✅ Microphone permission step works (with caveat — see notes)
- ✅ Final card dismisses the overlay
- ✅ Overlay does not reappear on refresh (localStorage flag set)

### Observations

This is a category we're going to be **massively expanding** — both for general onboarding and for tiered learning across the app — as part of the ID career shift. It's a huge area of focus going forward, kill-two-birds-with-one-stone style: ID portfolios are about demonstrating human thinking and logical sequencing, which is exactly what good onboarding documents.

**For now**, things to fix even before the bigger overhaul:

**1M.1 — Slide 1: "Master your pronunciation with 60-second sprints"** — I don't like this line. Don't know what to replace it with yet, but it needs to go. Possible replacement direction: make slide 1 the **L1 selection slide**, plus the line about progress saving automatically.

**1M.2 — Slide 1 should also offer L1 selection.**
Putting L1 here makes more sense than burying it later.

**1M.3 — Slide 2 (Mic):** The mic *does* turn on, but I was surprised — there was no message confirming it was on. I can see it in the little voice meter (the jittery sound-wave bar), but that's not enough. We need an explicit message like "You're now connected!" or similar. I expected the OS-level message in the top-left (asking for permission) to appear too, but it didn't. **We need confirmation messaging in addition to the voice meter.** Keep the voice meter — just add text confirmation.

**1M.4 — Slide 3 (First recording):**
It says "try a sample phrase" and then jumps into the next card. That's pretty sparse — needs more.

**1M.5 — Slide 4:**
Pretty good for now, I guess. But the way it looks, it implies that *only* Accuracy / Fluency / Prosody are scored. It's much more than that. That'll get rethought along with the bigger onboarding overhaul.

**1M.6 — Strategic note on full Onboarding rebuild:**
Onboarding is going to be a massive area of focus very soon. This isn't just initial-onboarding either — it's about *tiered* understanding of how to use the different functions and features as the user progresses. The goal is to demonstrate clear human thinking and logical chain sequencing for the ID portfolio.

---

## 1N. Dashboard (Mini Progress on Main Page)

### Checklist
- ✅ "My Progress" drawer/section is visible on the main page
- ✅ Expanding it shows recent practice attempts
- ✅ Score trends render correctly
- ✅ Clicking an attempt opens the Attempt Detail Modal

(See also 1K notes — same area, more issues there.)

---

## 1O. Balloon Animation

### Checklist
- ✅ Balloon appears and tracks practice count
- ✅ Pop animation triggers on milestone

---

# Page 2: AI Conversations (`convo.html`)

## 2A. Scenario Picker

### Checklist
- ✅ Picker deck loads with scenario cards (25 scenarios)
- ✅ Cards show images/thumbnails, titles, CEFR level badges
- ✅ Scrolling through the deck is smooth
- ✅ Tapping a card opens the scenario detail view
- ⚠️ "Quick Practice" option is available (bypasses scenario selection) — *not currently a Quick Practice button up front, see notes*

### Observations

**2A.1 — Load times need throttled testing (page-wide concern):**
For the scenario / picker page in particular — but this is true generally — we need to go to DevTools and Console, throttle the connection back to 2G/3G, and see how long the page takes to load. Load times have been an issue with this page specifically. **Needs to be done across all pages eventually** (also captured in the project-wide issue log).

**2A.2 — No Quick Practice button up front — proposal to add:**
There isn't actually a Quick Practice button up front on the convo hub. I could add one — as an *easier, quicker, just-get-me-talking-and-using-it* option. It could easily be wired to the same logic that the buttons in My Progress already use to launch a quick start with a neutral conversation style.

---

## 2B. Knobs / Settings Drawer

### Checklist
- ⚠️ Settings drawer opens (level, tone, length controls) — *animation polish needed, see notes*
- ✅ Changing a knob updates the stored preference
- ✅ Drawer closes cleanly

### Observations

**2B.1 — Smoother drawer animation (Scene Settings + Characters drawers):**
I want to make these smoother — possibly add more frames so it doesn't look quite as "da-da-da-da" / steppy. Both the Scene Settings drawer (right side) and the Characters drawer (left side) need this.

**2B.2 — X button + Drawer Title should slide in *with* the drawer:**
Very specific UX point: the X close button and the drawer title (e.g., "Scene Settings" / "Characters") should slide in *with* the drawer itself, from the very start of the animation. Everything else inside the drawer should follow our established system of rolling in *after* the drawer opens.

The reason: currently the drawer opens *empty* and then populates. If the X and title are present from frame one, the human eye catches the motion better and the slide-in feels more solid and visually integrated.

**2B.3 — Character / role cards should react when the user clicks outside them:**
Right now, on the character-card overlays, the user basically has to hit the X to exit. That's acceptable, but not ideal. If the user clicks outside the card, the app should give a clear visual cue — specifically the same kind of **red animated X reaction** used elsewhere: flash / bulge / rotate / twist, as if saying "close me with the X." That keeps behavior consistent without silently doing nothing.

**2B.4 — Character-card overlay should likely scroll-lock the background:**
At the moment, background scroll lock does not appear to be reliably in effect behind these overlays. I probably **do** want scroll lock here. It makes the card feel like a focused modal state rather than a loose floating element.

**2B.5 — Bring back the inner right-side drawer inside the actual conversation box:**
Separate from the outer picker-page drawers, we had already built a really nice drawer concept for the AI conversation space itself: the drawer should appear to emerge from the **right edge of the inner conversation box**, almost as if it is sliding out from behind that box into the space on the right. That behavior appears to have been lost and needs to be reconnected.

This same inner-drawer pattern is probably the right home for context-sensitive settings in Guided Practice, and later in Streaming too.

---

## 2C. Conversation Flow

### Checklist
- ✅ Select a scenario → conversation UI loads
- ✅ Character portrait / atmosphere renders for the selected scenario
- ✅ Scene atmosphere CSS applies (background, mood colors)
- ✅ Type or record a message → AI responds
- ✅ Recording in convo works (mic → transcription → AI response)
- ✅ Turn-by-turn chat renders correctly
- ✅ Pronunciation assessment runs on your spoken turns
- ✅ Trouble phoneme highlighting appears on assessed words

### Bugs / Anomalies

**Bug 2C.1 — Unexpected admin token prompt on convo page load:**
This time, when I chose a conversation and changed settings, the AI Conversation page loaded with a `localhost:3000` prompt asking for the admin token. I haven't seen that on this page before. Maybe it's a new security feature we added and I just forgot about it. **Needs investigating** — admin token shouldn't be asked for on the convo page.

**Bug 2C.2 — Mystery button in bottom-left:**
There's a weird little button just sitting in the bottom-left corner of the convo page. It must be a remnant of something. **I want to know what it is — and for it to disappear.**

### Observations

**2C.3 — Make character portraits bigger:**
Yes, the character portrait does render. **I'd like to make the portraits a little bigger, both of them**, in the actual practice space of the AI conversation after they've been selected from the scenario.

**2C.4 — Open question: Could *any* character work in *any* scenario?**
I wonder if we could make all of the characters available in all of the scenarios. Might be too complicated, might not even make sense — **want Claude's feedback on this.** If we did go that direction, we'd have to revisit the characters and make them all very *unique* enough to cover all the major situations users would want to interact with.

**2C.5 — AI image of the scenario (background or post-session):**
A few possibilities:
- **In-session background:** It's a lot of blank white right now, and I don't want to distract from the conversation, but maybe a background image (or decorative border) tied to the selected scenario, characters, settings, etc. The colors could even reflect the variables — e.g., a more stressful scenario gets more intense palette.
- **Post-session image:** When the session ends, generate an AI image summarizing the conversation. Could be part of the report.
- AI image generation is a bit slow currently, so it probably wouldn't be available on first page load — but is there a smart place to squeeze it in?

**Open question:** Is this a good idea, or unnecessary?

**2C.6 — AI summary of the conversation in the report:**
An AI summarization of the conversation could be made pretty immediately and added to the summary report.

**2C.7 — Highlighting + assessment understanding (deep one):**
With the trouble-phoneme highlighting on assessed words: I'm not entirely sure how the feedback flow is currently working. Need to understand it better — this is on me to dig into:
- Is the AI feedback based on each individual back-and-forth literally, or on the whole conversation?
- Should we make a downloadable transcript at the end?
- Could you also download the audio (the AI's side and your own)? We mostly have this through SPB / TTS / Voice Cloning (or will have soon).

**The highlighting itself only runs in the four launch options:** Passages, Harvard, Quick AI Convo, Scenarios → AI Convo. **We've got something in place, but we need to look deeper into how it's measuring the conversation and giving feedback.**

**2C.8 — Important: Upgrade highlighting features for both Practice Skills AND AI Convo. And eventually for Streaming:**
We need to upgrade the highlighting for both AI Convo and Practice Skills. Maybe later, for Streaming, it could do this *live* — catching the words and sounds in real-time as the conversation goes back and forth. (See also 1B and 1K notes.)

**2C.9 — Re-expose the inner settings drawer inside the guided conversation space:**
The guided conversation area should have its settings readily available from the inner conversation UI itself, not force the user back out into a separate setup mindset. This seems like a direct use case for the lost right-side drawer described in 2B.5.

---

## 2D. Conversation Report

### Checklist
- ❌ End conversation → Report overlay appears — **BROKEN**
- ❌ Report shows session stats (turns, pronunciation scores) — **BROKEN — not being generated at all**
- ⚠️ Coach turn list renders with assessed turns — *yes when working, but see Major Issue*
- ❌ Report can be dismissed — *can't even access it right now*

### **Bug 2D.1 — `convo-report` 404, "no_attempts_for_session" — BLOCKING**

Click "End Session" button on the convo page → endpoint fails:

```
[vite] connecting...
lux-warn.js:19 [LuxWarn] ready: important
client:912 [vite] connected.
audio-sink.js:54 [LUX] Audio Sink initialized
boot-tts.js:124 [Lux] TTS Peekaboo panel initialized (lazy).
boot-tts.js:124 [Lux] TTS Peekaboo panel initialized (lazy).
convo.html#intro:1 [Intervention] Images loaded lazily and replaced with placeholders.
[Violation] Forced reflow while executing JavaScript took 30ms

util.js:110 POST http://localhost:3000/api/convo-report 404 (Not Found)
  apiFetch @ util.js:110
  convoReport @ convo-report.js:9
  (anonymous) @ convo-handlers.js:239

convo-handlers.js:247 [Convo] end/report failed Error: no_attempts_for_session
  at jsonOrThrow (util.js:36:17)
  at async HTMLButtonElement.<anonymous> (convo-handlers.js:239:22)
```

**Two things wrong here:**
1. `POST /api/convo-report` returns 404 — the route is missing or misnamed.
2. The fallback path throws `no_attempts_for_session` — meaning the convo session didn't have any attempts associated when it tried to generate a report.

**Result:** End Session button does nothing useful. Report is never generated. Cannot be tested for dismissal because it never appears. **This is a blocking bug for the convo page.**

### Observations

**2D.2 — AI Coach in convo report needs the same overhaul as 1F:**
Yes, when working, the AI coach does bring back something based on the conversation. But once again — and this connects to 1F — we need a big look and investigation into all the AI Coaches everywhere they're injected. Not necessarily a "total overhaul," but a real review pass.

---

## 2E. TTS in Conversations

### Checklist
- ✅ AI responses have a "Listen" / speaker button
- ✅ Tapping it plays TTS audio of the AI's message
- ✅ TTS context updates correctly between turns

### Observations

I *believe* and think the core TTS function is good to go, but the convo-specific controls need much more deliberate UX treatment than this section originally captured.

**2E.1 — The top controls are too crowded to read comfortably:**
In AI Conversations, the TTS box is crowded enough that the top two dropdowns become hard to read and use. This is not just a small CSS annoyance; it actively hides functionality.

**2E.2 — "Selection" mode is a genuinely cool feature and should be advertised more clearly:**
A great capability is already here: if the user switches TTS to **Selection**, Lux can read aloud highlighted text — not just the conversation turns, but also things like AI Coach text below, as long as the text is selected inside the app. That's excellent and easy to miss right now. We should surface it more intentionally so users know it exists.

**2E.3 — See whether Voice Mirror / "Hear it in my voice" can also support Selection mode:**
Right now the cloned-voice behavior can jump between AI and Me, but apparently does **not** follow the same selection-based reading path that TTS does. If possible, it would be very valuable to connect that too.

**2E.4 — Guardrail: selection-based audio should stay scoped to Lux app content:**
If Selection mode gets stronger — especially if Voice Mirror joins it — we should make sure the feature is bounded to content **inside the app**. I do **not** want this turning into a way to jump to another monitor, another site, or some random long external document and have Lux read unrelated content. The feature should stay attached to Lux-owned UI/text surfaces.

Most of the earlier structural/layout problems are still captured in section 1H.2 ("spaghetti mess" expanded view), but these additional notes are new and important.

---

# Page 3: Progress Dashboard (`progress.html`)

## 3A. Dashboard Load

### Checklist
- ⚠️ Page loads and fetches practice history — *page loads correctly overall, but the contents are off — see notes*
- ⚠️ Dashboard renders with attempt cards/rows — *unclear what was being asked, see notes*
- ⚠️ Score trends chart renders
- ⚠️ Rollup stats show

### Observations — Major Page-Wide Concerns

This page is a mess and needs a deep re-evaluation. The page loads OK and there are **no red flags in the console**, but the content layout and data flow are confusing.

**3A.1 — Violates "Never Overwhelming" aesthetic goal.**
There's just so much happening on this page. It's not meeting the core aesthetic goal at all.

**3A.2 — Make it look like My Progress (consistency rebuild):**
For consistency across the app, the Progress Dashboard should mimic the layout of the My Progress section on the Practice Skills page. Specifically:
- The little **circular overall score** that flips when you hover over it. When you click it, it brings up the total aggregated score across everything.
- The five measurable metrics at the top.
- The whole "look and feel" of My Progress — that's what this page should look like.

It currently doesn't look like that. We need a rebuild for consistency.

**3A.3 — Missing "velocity trend":**
There's a little note saying "velocity trend will be added once we store/compute it." We need to actually go ahead and fill that in.

**3A.4 — Top three tiles aren't collapsible or clickable:**
The three top tiles can't be collapsed (they should be — everything else is collapsible). They also aren't clickable to learn more — **they should be clickable to expand into more detail.** They're not very clear as-is.

**3A.5 — Trouble Sounds / Trouble Words showing nothing:**
Something's off here — when I open Trouble Sounds or Trouble Words, very little comes up. Screenshot evidence captured. Doesn't match what's showing on Practice Skills / My Progress, so the data plumbing is broken or partial. Need to figure out **what it's actually pulling from and how**.

**3A.6 — AI Coach is here too, also not fully utilized:**
We've got the AI coach injected on this page too — same problem as 1F: it's not really hooked up or fully utilized. Needs the whole AI Coach review pass.

**3A.7 — Login button position consistency:**
The login button should be at the top right of this page too (it's elsewhere on other pages). That'll create consistency and help us visually remember whether we're in the correct login or not.

**3A.8 — Where is this page pulling its data from?**
Bottom line: this page is **not** pulling everything from Practice Skills, and it's not pulling everything from AI Conversations either. Very murky. We need to investigate the data plumbing in detail. For now: **"confusing — needs reevaluation of what's working and how — i.e., where is it pulling its info from and how is it displaying it?"**

---

## 3B. Attempt Detail

### Checklist
- ⚠️ Click an attempt → Detail Modal opens
- ⚠️ Modal shows full word-level breakdown, phoneme analysis
- ⚠️ Modal closes cleanly

### Observations

**3B.1 — Session Report looks off too.**
Screenshot captured. We need to go through this page carefully — can't say cleanly what's working and what isn't. Need to clean it up, check the data plumbing.

**3B.2 — Wrong link target on My Progress page:**
There are two book icons at the top of the My Progress page that bring you to two different places: Practice Skills and AI Conversations. But the AI Conversations link **shouldn't bring you into Guided Practice** — it should bring you into the **AI Conversations Hub** that has the three options (Guided Practice / Streaming / Life).

**3B.3 — Download Report and Download Troubleshooting buttons produce gobbledygook:**
Both buttons produce JSON-formatted output, not normal human language. Both are **not working currently**. We need to dig into this whole page deeply.

---

## 3C. Progress Rollups

### Checklist
- ⚠️ Phoneme rollups show your top trouble sounds across all attempts
- ⚠️ Word rollups show your most-practiced / weakest words
- ⚠️ Session summaries list recent sessions with scores

(See 3A.5 — Trouble Sounds and Trouble Words showing very little. Same data-plumbing concern.)

---

# Page 4: Word Cloud (`wordcloud.html`)

### Checklist
- ⚠️ Page loads the word cloud library
- ⚠️ Cloud renders with your practiced words
- ⚠️ Word size corresponds to frequency/trouble level
- ⚠️ Favoriting / pinning words works
- ⚠️ Timeline controls work

### Strategic Note: Deprioritized

Kicking the can down the road on Word Cloud. It needs reevaluation, partial functionality only, but **it's not a priority — it's a way-off-to-the-side feature you could totally ignore and it wouldn't matter.** Later priority.

---

# Page 5: Life Journey (`life.html`)

### Checklist
- ⚠️ Page loads the Life Journey game
- ⚠️ Events deck renders with scenario cards
- ⚠️ Tapping an event launches a conversation mission
- ⚠️ Mission bridge navigates to convo page with pre-loaded scenario

### Strategic Note: Forget About It For Now

Essentially nothing has been built here yet. This was always intended as a third space to build out later. **Totally forget about this page for now** — it's a future worry and we don't need to focus on it at all right now.

---

# Page 6: Streaming (`stream.html` / `stream-setup.html`)

### Checklist
- ✅ Setup page loads with configuration options
- ✅ WebRTC connection establishes
- ✅ Real-time conversation streaming works
- ✅ Audio capture and playback function

### Strategic Note: Two Options

Streaming is missing a lot of UI polish — it's very plain — but to my understanding (and per past full-project reports from Claude), **it's actually built out really well underneath**. The WebRTC piping is working. There's a lot of plumbing already in place. I just haven't messed with it enough to be able to tell you much from a user-facing point of view. It's been on the back burner while we focus on the Practice Skills page and the Guided Practice AI Convo page.

**Two options for the closing-up phase:**
1. **Forget it for now.** Punt to after the ID career shift.
2. **Push for a final closing-up of this page too.** Maybe not perfectly and not in every way, but get it to a "decent" state.

> **I'd kind of prefer Option 2** *if* it can be done well in limited time. Most of the WebRTC piping is already there — a small focused push could get it to a presentable state before I close the book to go ahead with the ID career shift.

### Bug Cross-Reference
Also see Bug 1C-related: Auto mode won't initiate from cold start on the Streaming page. Has to start on Tap, then switch to Auto.

More specifically: if Streaming enters on Auto, it often won't really respond until I manually toggle modes. I have to flip between **Tap** and **Auto** to "wake it up." So the issue is not just cold-start Auto in the abstract — it's that **mode switching / mode initialization is not reliably kicking the conversation into an active state**.

Also: the Streaming service has **no assessment connected to it at all** — just back-and-forth conversation. Pulling over the existing pronunciation assessment pipeline would probably be relatively easy and would dramatically boost this page's usefulness.

### Streaming UX / Layout Additions

**6.1 — Streaming should also get the inner settings drawer pattern:**
If we restore the right-side drawer that appears to slide out from behind the inner conversation box (see 2B.5), Streaming should get that too. The settings form should be readily available from inside the live conversation space, not tucked away as a separate setup-only concept.

**6.2 — Bring the self-playback and TTS drawers into Streaming too:**
Streaming should inherit the tool drawers we've already built elsewhere — especially **Self-Playback**, **TTS**, and the new **Voice Mirror** function. These should follow the same "never overwhelming, always expandable" rule, but the tools should be available where they meaningfully apply.

**6.3 — Streaming is part of the broader "tool portability" question:**
Big system-wide issue: we've already built some genuinely strong tools, but many of them are trapped in just one page. We need a deliberate pass on which tools should appear everywhere, which should appear only in certain spaces, and how to keep that access at the user's fingertips without shoving it in their face.

---

# Cross-Cutting Checks

## Network / API

### Checklist
- ✅ Open DevTools → Network tab during a full practice cycle
- ✅ `/api/assess` succeeds
- ✅ `/api/attempt` succeeds
- ✅ `/api/pronunciation-gpt` succeeds
- ✅ `/api/tts` succeeds
- ✅ `/api/convo-turn` succeeds
- ✅ No CORS errors in console
- ✅ No 500-level errors from backend

### Notes

Ran through most of the app, no 400s, no 500s, no major status errors or warnings. Everything looks healthy from the network side.

> Caveat: `/api/convo-report` returns 404 — see Bug 2D.1.

Also saw a browser performance warning about **non-passive scroll-blocking event listeners**. That's not necessarily catastrophic, but it is worth a cleanup pass because it can contribute to a less responsive feel during interaction-heavy UI.

## Storage & State

### Checklist
- ✅ Open DevTools → Application → Local Storage
- ✅ `LUX_USER_ID` key exists
- ✅ Practice data persists after page refresh
- ✅ Switching between pages and back preserves state

## Visual / CSS

### Checklist
- ⚠️ No layout shifts or overlapping elements on any page — *one bad area, see notes*
- ⚠️ Mobile responsiveness — *needs huge overhaul, deferred*
- ✅ All modals/overlays dismiss cleanly without orphan backdrops
- ✅ Body scroll lock works

### Notes

**Visual.1 — Worst layout area: TTS+SPB expanded view on AI Conversation page.**
Screenshot captured. The expanded view of the TTS and SPB drawers on the convo page is one of the few really badly laid-out spots in the app. (See 1H.2 for the deep dive on this — "spaghetti mess.")

**Visual.2 — Character / role card overlays need modal clarity:**
On the AI conversation side, the character or role cards feel too loose right now:
- they rely too much on the user explicitly hitting X,
- the background should probably scroll-lock,
- clicking outside should trigger a clear animated cue on the X instead of just feeling dead.

This is a consistency / polish issue, but it matters because these cards are part of the "first impression" interaction.

**Visual.3 — Mobile responsiveness: deferred overhaul.**
The mobile layout is going to need a huge overhaul. (And this time I mean it.) **Excited to do that someday soon, but it will definitely be after the big career shift push into ID.**

## Warp Transitions

### Checklist
- ✅ Navigating between pages plays the warp animation
- ✅ Animation completes and doesn't leave a frozen overlay
- ✅ Back button works after warp navigation

(See 1A.6 — wants more frames for smoothness, captured there.)

---

# Project-Wide Issues Log

These are the items the original audit captured in the Issues Found table. They are project-wide concerns (not page-specific) and apply across multiple areas of the app.

## Issue 1 — Practice Skills Main Input Field: Highlighting Architecture

**Where:** Practice Skills page, main input field.
**Problem:** As-is, the input field is *unable* to do the blue or yellow highlighting of words or phonemes we want to bring attention to. We need to possibly change its configuration / replace the underlying element to support inline highlighting.

(Connects to 1B, 1K, 2C.8.)

## Issue 2 — Admin Data Tracking Pages Not Yet Audited

**Where:** All three admin tracking pages: Cohort, Attempts, User Progress.
**Status:** Not a problem, just deferred. We didn't look at it in this audit at all — has been pushed off to the side. Eventually we'll want to audit this too. Token-gated.

## Issue 3 — Console Noise on Picker / Selector Page (AI Convo)

**Where:** AI Convo picker / selector page.
**Console output:**
```
boot-tts.js:124 [Lux] TTS Peekaboo panel initialized (lazy).
boot-tts.js:124 [Lux] TTS Peekaboo panel initialized (lazy).
convo.html#intro:1 [Intervention] Images loaded lazily and replaced with placeholders.
  Load events are deferred.
[Violation] Forced reflow while executing JavaScript took 33ms
```

The double init of the TTS Peekaboo panel is suspicious — possibly an init guard issue. The forced reflow violation is a perf flag.

## Issue 4 — Tool Portability / Availability Matrix

**Where:** Across Practice Skills, Guided AI Convo, Streaming, and related report spaces.  
**Problem:** We've built several genuinely useful tools, but availability is inconsistent across spaces. Some pages have strong tools that others don't, even when they would be useful there too.

**Principle:** I'd rather users have **too much access than not enough**, provided that access is:
- context-appropriate,
- hidden behind expandable affordances when needed,
- never shoved in the user's face.

**Action:** Do a deliberate pass on which tools belong:
- everywhere,
- only in certain experiences,
- or only after expansion.

Core north star remains: **never overwhelming, always expandable.**

## Issue 5 — Buttons (Project-Wide UX Pass)

**Where:** All buttons across all pages.
**Problem:** Need to go through the entire app and rethink buttons so they're unified instead of each one different. There's also a pretty bad ripple effect that I tried to add to one button, and that got transferred over to lots of other buttons that were built after that.

**Goals:**
- Decide the look and placement so it's always consistent.
- Easy for the user to understand, follow, and look for each time.
- Should be a good, cool, originally-crafted button design (have lots of resources showing different button types — will probably copy something I like).
- Hover, click, and label states should be considered.
- Most important thing: **consistency and natural flow for the user.**
- Currently, buttons are all over the place and different in many cases.

## Issue 6 — Tips Drawer Auto-Open Behavior

**Where:** Practice Skills page, the slide-down "Tips" drawer at the top (contains the three tips and the data tracking option).
**Problem:** Once the user has pushed the tips drawer back up (closed it), it should stay closed — it shouldn't automatically open again on the next visit. I'm not sure if this is already the case or not.

**Rule:** Whatever the user's preference is — keep it down/visible or retracted — once they choose a state, it should **stay that way** unless they explicitly change it. **Any auto-open behavior should be disabled the moment the user has manually manipulated it.**

## Issue 7 — Long / Complicated Texts (Project-Wide Cleanup)

**Where:** All pages.
**Problem:** We need to expand the entire project for anywhere there's longer or complicated wording. Pass through and simplify.

## Issue 8 — Translations / L1 Localization (Project-Wide Feature)

**Where:** All pages.
**Concept:** Everywhere in the project, we need to make sure any text can be translated easily into the user's selected L1.

**Two options (or both):**
- **Auto-translate on L1 selection:** From the moment they select their L1, the entire site transforms into that language.
- **On-demand translation buttons:** Buttons or hover features everywhere that let them click to see content in their first language.

Whichever is better, or makes more sense — **possibly both**.

## Issue 8A — AI Coach should be L1-aware, not just neutral

**Where:** Anywhere AI Coach appears.  
**Problem / Opportunity:** If the user has selected a first language, the coach should be able to tailor explanations and likely transfer notes accordingly. Right now the coach risks being too generic or too neutral to be maximally useful.

This should stay simple and supportive, not become an academic linguistics lecture.

## Issue 8B — Selection-based audio tools should be powerful but bounded

**Where:** TTS / Voice Mirror / any future read-selection feature.  
**Problem / Opportunity:** The existing **Selection** mode in TTS is excellent and should be surfaced more clearly. If we extend that behavior to cloned voice / "Hear it in my voice," we should make sure it remains scoped to Lux app content, not arbitrary outside text on another monitor or another site.

## Issue 9 — Phoneme & Word Highlighting Accuracy

**Where:** Anywhere in feedback / highlighting.
**Problem:** Let's make sure the actual phonemes are always lining up correctly with the right representations in the words — basically letters to sounds. **A few times, I've seen mislabeled phonemes.** The words themselves are not really a problem (the word is always going to be the same), but there's a disconnect on phoneme-to-letter mapping.

We need to make sure with an American accent profile that we're able to **accurately always mark the phonemes that are present in the word**. This means a closer investigation on the phoneme spelling map / phoneme-to-letter alignment.

## Issue 10 — Practice Skills Dashboard: Combine Passage + Harvard Selectors

**Where:** Practice Skills page, Passage / Harvard selector area.
**Problem:** Want to stay true to the core aesthetic, and we've let things creep up in amount. The very first page you land on (Practice Skills) has very useful stuff to select from, but in particular the Select Passage and Harvard List **could be combined somehow** into a single, easy-to-open interface.

**Goals:**
- Don't make the user click too much or move too much.
- Stay true to the core aesthetic: **never overwhelming, always expandable.**
- Currently it looks a little too busy and confusing about where to start.
- **Idea:** Two bubbles that, when clicked, open one or the other.

## Issue 11 — Pronunciation Improvement Education (All Pages)

**Where:** All — possibly built into onboarding / tooltips / a learning page.
**Concept:** Explaining basic things about pronunciation and accents:
- How long it takes
- How it's a very slow, gradual improvement
- How to go about doing it: identifying, listening to yourself, spotting where you might pronounce something wrong, breaking that into phonemes, learning how to make individual sounds, locking it in by practicing again and again in different formats

**Specific points to cover:**
- **Time it takes.**
- **How to make good self-observations.**
- **Good practices with self-notes** — identifying problem words, then identifying their phonemes in particular.
- **How to improve** — the steps, the tricks, the analysis, the physical difficulty of pronunciation, and the need to lock it in after many many attempts so it becomes muscle memory.
- **It's like a workout!**
- **"Knowing" things is just the tip of the iceberg.** The real place it becomes golden is in practicing and drilling again and again in differing ways and situations.

This may already be partially captured in existing project docs, but it's worth pulling together as a coherent learning/onboarding module. **Strong candidate for an early ID portfolio piece.**

## Issue 12 — Load Times on All Pages (Throttled Testing)

**Where:** All pages.
**Concept:** When we start to enter the final phase, we'll have to go to all the pages, open DevTools / Console, throttle the connection down to 2G or 3G, and test them to find what items are really heavy and causing load times to slow down.

(Connects to 2A.1 — same concern, surfaced specifically for the convo picker page.)

## Issue 13 — Passage Summary / Results Summary Stability

**Where:** Results summary flow on the Practice Skills side.  
**Problem:** The current summary path is unstable due to `mountVoiceMirrorButton is not defined`, which blocks clean rendering of the summary page. Even though the whole summary experience may get redesigned, this should be explicitly tracked as a current break.

## Issue 14 — Streaming mode initialization + shared drawer pattern

**Where:** Streaming.  
**Problem:** Auto mode does not reliably initialize the conversation on first entry, and the mode-toggle state appears to be part of the bug. At the same time, Streaming is a strong candidate for inheriting the same inner-drawer, self-playback, TTS, and Voice Mirror patterns used elsewhere.

This is partly a bug issue and partly an architecture / portability issue.

---

# Sign-off & Strategic Priorities

## Sign-off Checklist
- ⚠️ All critical features pass — ready to launch Simoishi
  - **All are good with the exception of:** Life, AI Convo (the report 404 specifically), and the data analysis tracking for admin.
- ✅ Issues found but non-blocking — noted above, will fix separately
- ✅ Blocking issues found — must fix before Simoishi gets active

## Final Note: The Strategic Plan

The objective is, as quickly as possible — and we're talking about **days, not weeks** — to get the project to a point where I can safely close the book on it for a while. I'm shifting all focus and attention to a career transition into **Instructional Design**.

This is the perfect combination because it fits both needs simultaneously: I need to be able to explain cleanly, clearly, and simply how to onboard new people onto this platform. We've got a ton of features, but **what's really lacking is the user journey.** Right now everything is kind of thrown up front and it's a bit overwhelming. Beyond the overwhelming, we need *more depth* so the user stays longer. They need to enter more interesting, useful areas progressively.

### What Gets Worked On

**LEAVE ALONE for now:**
- **AI Conversations → Life Path** (the third sub-feature, least developed)
- **Word Cloud**
- **Data Tracking / Admin pages**

These are not central to the core. They're not getting touched in the closing-up sprint.

**MAYBE PUSH (if time allows, and I'd prefer to):**
- **Streaming.** Most of the WebRTC piping is already there. A focused push could get it presentable. Worth a small investment if it can be done well in limited time.

**MAIN FOCUS AREAS:**
- **Make sure the core stuff is in a really good position.**
- **Finish aligning the scenarios.** That's one big task.
- **A few others that don't come to mind right now**, but the mode is **rapid wrapping up** — don't want stuff left half-dangling here or there. Don't want to enter new territory that's going to take a long time to build out.

That's the mission moving forward.
However: This audit is useful for general project health beyond the closing-up sprint. It's a goldmine — first time ever I've done a full audit, and it's a reference document we should treasure and keep coming back to.