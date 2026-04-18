# Lux

**Lux is a browser-based pronunciation and conversation training platform for English learners.** It connects phoneme-level speech assessment, AI-guided speaking practice, longitudinal progress tracking, and targeted next-step guidance into a single learner experience.

Built solo over roughly 18 months by a full-time ESL instructor as a self-taught engineering project. The pedagogy drove the product from the beginning — it was not added afterward.

> **Status:** Local-only development. Not yet publicly deployed. Actively being built, refactored, and hardened.
> **Backend:** This is the frontend repo. The API lives in [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api).

---

## What Lux Does

Most speaking tools either give learners vague conversation practice with little precision, or precise pronunciation scores with little meaningful follow-through. Lux is built to connect the full loop:

- **Practice Skills** — Record a passage, get phoneme-level Azure pronunciation assessment, review results with AI coaching, and see which specific sounds and words are holding you back.
- **AI Conversations** — Voice conversations with a GPT-powered partner across 25 scenarios (ordering coffee, a job interview, a doctor visit, a parking dispute). Character-based, CEFR-adaptive, with post-session feedback.
- **Real-Time Streaming** — Lower-latency spoken interaction via WebRTC and OpenAI's Realtime API, for when fluency practice needs speed.
- **Progress & Rollups** — Attempt history, session grouping, dashboards, and longitudinal patterns that make improvement visible over time.
- **Wordcloud** — Visual surface for recurring problem words and patterns across practice history.
- **Next Practice** — Suggests what to work on next based on the learner's current trouble sounds and trouble words.
- **My Words** — Personal vocabulary tracker that hands off cleanly into practice surfaces.
- **Voice Mirror** — Optional voice-cloning feature that lets learners hear target text spoken in their own voice — a pedagogically strong technique for self-modeling.
- **Life Journey** — A more game-like, mission-driven practice surface for learners who want structured progression.
- **Harvard Sentences Library** — Standardized phonetically-balanced practice material, filterable by phoneme content.

The goal is not just to report a score. It is to help learners understand *what is going wrong, why it matters, and what to do next.*

---

## Why This Project Exists

Lux is built around a few core beliefs:

- **A pronunciation score by itself is not enough.** Learners need feedback that leads to action.
- **Practice should accumulate.** Trouble sounds and patterns should carry across features instead of disappearing after one screen.
- **Natural speaking matters.** AI conversations should still feel human, not like a forced target-word exercise.
- **Precision should not create overwhelm.** The UI should reveal depth in layers, not drown the learner all at once.
- **Pedagogy and engineering belong together.** This is both a language-learning system and a serious frontend engineering project.

---

## What Makes Lux Different

**Phoneme-first feedback.** Every attempt is analyzed by Azure Pronunciation Assessment at the phoneme level, then layered with GPT-based coaching that explains *why* a sound is off and *what to do about it*.

**CEFR alignment.** Scores map to CEFR bands (A1–C2). Conversation difficulty adapts to learner level via the Knobs system (level / tone / length). Coaching vocabulary is grounded in CEFR, not raw percentages.

**Scenario neutrality.** Each conversation scenario is designed around **identity and scene function only** — NPCs are given a character and a scene role, but no hidden conversational steering. Scenarios are audited against four axes of bias (length, emotion, CEFR, perspective) so the AI doesn't covertly push learners toward one style of response.

**Prosody awareness.** Pronunciation is not only a phoneme problem. Lux analyzes per-word timing against passage median, classifies tempo (slow / fast / ok), and flags gaps (missing pause / unexpected pause) — giving learners visibility into the musical dimension of speech most tools ignore.

**Connected trouble targeting.** Every session produces a ranked list of the learner's worst phonemes and worst words. These feed suggestions for what to practice next — specific Harvard passages filtered by phoneme content, targeted drills, or conversation scenarios designed to exercise the trouble sounds in context.

**Layered coaching tiers.** The UI shows Blue/Yellow/Red at 80/60, but coaching uses four tiers — `none` (85+), `polish` (80–84), `coach` (60–79), `urgent` (<60). Even a "green" score earns gentle refinement; a learner at 45% gets urgent, specific, encouraging guidance.

---

## Tech Stack

**Frontend**
- Vanilla JavaScript (ES modules), no framework
- Vite 6, multi-page app
- Plain CSS with `lux-` prefixed class convention
- Vitest, ESLint

**External services**
- Azure Cognitive Services Speech SDK — pronunciation assessment and TTS
- OpenAI GPT — AI coaching and conversation
- OpenAI Realtime API via WebRTC — real-time spoken interaction
- ElevenLabs IVC — voice cloning for Voice Mirror
- Supabase — magic-link OTP auth and user-linked persistence

**Backend**
- [luxury-language-api](https://github.com/MARKANDALL/luxury-language-api) on Vercel — single-function router pattern to stay under Hobby plan limits

---

## Architecture

Lux is a **Vite multi-page app, not a SPA.** That is a deliberate choice — the major product surfaces are distinct enough that full-reload navigation keeps the architecture simpler than forcing everything through one client-side application shell.

Page entry points:

| Page | Entry | Purpose |
|---|---|---|
| `index.html` | `src/main.js` | Practice Skills |
| `convo.html` | `src/convo.js` | AI Conversations |
| `progress.html` | `src/progress.js` | Progress dashboard |
| `wordcloud.html` | `src/wordcloud.js` | Wordcloud visualization |
| `stream.html` | `src/stream.js` | Real-time streaming |
| `stream-setup.html` | `src/stream-setup.js` | Stream configuration |
| `life.html` | `src/life.js` | Life Journey |
| `admin/*.html` | inline | Admin dashboard |

### Core principles

**Bus-first state.** Cross-feature shared state is coordinated through `app-core/lux-bus.js` — the canonical pub/sub bus and sole source of truth for shared state. Legacy `window.*` globals survive only as frozen compatibility mirrors.

**Centralized storage.** `app-core/lux-storage.js` registers every localStorage key as a named constant. Every bare `localStorage.getItem` has been replaced with a named helper.

**Protection-ring testing.** Contract tests cover the shared primitives the rest of the app depends on: bus, storage, identity, runtime, and API client.

**Mechanical refactoring over clever rewrites.** The bias is toward careful modularization, explicit ownership, and safe migrations rather than flashy rewrites that risk behavior drift.

For deeper architecture detail, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Pedagogical Foundations

The pedagogy is not a layer on top of the tech. It drove the architecture.

**Harvard Sentences.** Lux uses the standardized Harvard Sentences corpus (72 phonetically-balanced lists) as the foundation of its pronunciation library. A build step (`scripts/build-harvard-phonemes.mjs`) runs the corpus through the CMU Pronouncing Dictionary to generate phoneme-level metadata for every sentence — enabling phoneme-driven drill targeting and smart passage recommendations.

**CEFR alignment.** Every pronunciation score maps to a CEFR band. Conversation difficulty adapts via the Knobs system. Feedback uses CEFR as the vocabulary of progress.

**Scenario design.** 25 scenarios spanning service encounters (coffee shop, restaurant, bank), professional settings (job interview, networking, tech support), personal life (dinner with a friend, telling a joke, a winter hike), high-stakes moments (beach emergency, doctor visit), and civic life (asking an officer for help, a parking dispute). Each written around identity and scene function, not behavioral scripting.

**Prosody.** Per-word timing, pause detection, tempo classification, and gap analysis — computed from raw Azure tick data. Fluency has rhythm, and the product surfaces it.

**Trouble continuity.** A learner's trouble phonemes and trouble words are not discarded after each session. They accumulate, they inform the next practice suggestion, and they anchor the longitudinal view.

**Naturalness over forcing.** The AI is steered to weave in trouble sounds and words *where natural* — not to hammer them into every sentence until the conversation feels like a drill.

---

## Development

### Prerequisites

- Node.js 18+
- A configured `luxury-language-api` backend (local or deployed Vercel instance)

### Run locally

```bash
npm install
npm run dev            # Vite dev server, /api proxied to backend
npm run build          # production build to dist/
npm run preview        # preview the production build
```

### Tests and hygiene

```bash
npm test               # Vitest contract tests
npm run test:watch
npm run lint
npm run hygiene        # hygiene report + no-silent-catches scanner
```

### Static data generation

```bash
npm run build:harvard:phonemes
npm run build:passages:phonemes
npm run thumbs
```

### Environment

The Vite dev server proxies `/api/*` to the backend origin. Relevant variables: `LUX_API_ORIGIN`, `VITE_LUX_API_ORIGIN`. Optional admin-token variables are supported for admin-route header injection in development. Production secrets live in Vercel.

---

## Project Documentation

Internal docs under `docs/`:

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — canonical architecture reference (start here)
- [`LUX_MASTER_IDEA_CATALOG.md`](docs/LUX_MASTER_IDEA_CATALOG.md) — prioritized feature backlog
- [`LUX_COMPETITVE_LANDSCAPE.md`](docs/LUX_COMPETITVE_LANDSCAPE.md) — analysis vs ELSA, BoldVoice, SpeechAce
- [`LUX_PROJECT_AUDIT_2026-04-17.md`](docs/LUX_PROJECT_AUDIT_2026-04-17.md) — recent full-codebase audit
- [`system-health-bill-of-rights.frontend.md`](docs/system-health-bill-of-rights.frontend.md) — engineering standards this codebase holds itself to

---

## About This Project

Lux was built by one person: Mark Huguley, a full-time ESL and GED-in-Spanish instructor with an MA in Bilingual and Multicultural Education from La Universidad de Alcalá de Henares (Madrid), TESOL certification, C1 Spanish, and roughly 13 years of classroom teaching experience. Named Savannah Technical College Teacher of the Year, and a top-four finalist for the state of Georgia.

He started the project with no prior coding background and used AI pair-programming tools as the learning vehicle. Eighteen months later, the codebase is a real multi-page Vite application with contract-tested runtime primitives, a custom pub/sub architecture, integrations with four external services, and pedagogy that came out of actual classroom experience rather than being retrofitted to a product idea.

This is not a generic AI wrapper. It is not a classroom worksheet dressed up as software. It is a long-running attempt to build a more intelligent and more humane speaking platform — one that treats pronunciation, conversation, learner history, and next-step guidance as parts of the same connected system.

---

## License

Released under the [MIT License](LICENSE) — use, learn from, or teach with it. The product, pedagogy, and scenarios remain Mark Huguley's work.