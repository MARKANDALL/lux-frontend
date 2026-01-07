// features/convo/index.js
import { SCENARIOS } from "./scenarios.js";
import { convoTurn } from "../../api/convo.js";
import { assessPronunciation } from "../../api/assess.js";
import { convoReport } from "../../api/convo-report.js";
import { saveAttempt } from "/src/api/index.js";
import { warpSwap } from "../../ui/warp-core.js";

import { consumeNextActivityPlan } from "../next-activity/next-activity.js";

import { initSceneAtmo } from "./scene-atmo.js";
import { wirePickerDeck } from "./picker-deck.js";
import { wireConvoFlow } from "./convo-flow.js";

import {
  applyMediaSizingVars,
  uid,
  newSessionId,
  el,
  showConvoReportOverlay,
} from "./convo-shared.js";

export function bootConvo() {
  const root = document.getElementById("convoApp");
  if (!root) return;

  // Prevent duplicate listeners on hot reload
  if (root.dataset.luxBooted === "1") return;
  root.dataset.luxBooted = "1";

  const state = {
    sessionId: newSessionId(),
    scenarioIdx: 0,
    mode: "intro", // intro | picker | chat
    knobsOpen: false,
    knobs: { tone: "friendly", stress: "low", pace: "normal" },

    messages: [], // {role:"user"|"assistant", content:string}
    turns: [], // {turn, userText, azureResult, attemptId?}

    isRecording: false,
    stream: null,
    recorder: null,
    chunks: [],

    busy: false,

    // Next practice (optional)
    nextActivity: null,
    coach: { startTipShown: false, replyTipShown: false, typeTipShown: false },
  };

  const next = consumeNextActivityPlan();
  if (next && next.kind === "ai_conversation") {
    state.nextActivity = next;

    // Choose a base scenario for variety (keeps passageKey pretty: convo:doctor, etc.)
    state.scenarioIdx = Math.floor(Math.random() * SCENARIOS.length);
  }

  // --- Layout (single stage) ---
  root.innerHTML = "";
  root.dataset.mode = state.mode;
  root.dataset.side = "left";

  const atmo = el("div", "lux-atmo");
  atmo.innerHTML = `
    <div class="lux-atmo-layer a"></div>
    <div class="lux-atmo-layer b"></div>

    <div class="lux-scene-cards" aria-hidden="true">
      <div class="lux-scene-card c1"></div>
      <div class="lux-scene-card c2"></div>
      <div class="lux-scene-card c3"></div>
      <div class="lux-scene-card c4"></div>
      <div class="lux-scene-card c5"></div>
      <div class="lux-scene-card c6"></div>
      <div class="lux-scene-card c7"></div>
      <div class="lux-scene-card c8"></div>
    </div>

    <div class="lux-atmo-fog"></div>
  `;

  const ui = el("div", "lux-ui");

  // Intro overlay
  const intro = el("div", "lux-intro");
  const hero = el("div", "lux-heroCard");
  hero.append(
    el("div", "lux-heroBrand", "Lux"),
    el("div", "lux-heroTitle", "AI Conversations"),
    el(
      "div",
      "lux-heroSub",
      "Pick a dialogue. Record your reply. We assess each turn silently and give you a session report at the end."
    )
  );
  const heroNext = el("button", "lux-heroNext", "Next");
  hero.append(heroNext);
  intro.append(hero);

  // Picker overlay (Edge deck)
  const picker = el("div", "lux-picker");
  const deck = el("div", "lux-deck");
  const deckActive = el("div", "lux-deck-card is-active");
  const deckPreview = el("div", "lux-deck-card is-preview");
  deck.append(deckActive, deckPreview);

  const thumbs = el("div", "lux-thumbs");
  const nav = el("div", "lux-deckNav");
  const backBtn = el("button", "lux-navArrow", "← Back");
  const nextBtn = el("button", "lux-navNext", "Next →");
  nav.append(backBtn, nextBtn);
  picker.append(deck, thumbs, nav);

  // Chat panel (single centered)
  const chatWrap = el("div", "lux-chatwrap");
  const mid = el("div", "lux-panel lux-chat");

  const midHd = el("div", "lux-hd");
  const titleWrap = el("div");
  const title = el("div", "lux-title", "AI Conversation");
  const sub = el("div", "lux-sub", `Session: ${state.sessionId}`);
  titleWrap.append(title, sub);

  const actions = el("div", "lux-actions");
  const scenBtn = el("button", "btn ghost", "Scenarios");
  const knobsBtn = el("button", "btn ghost", "Knobs");
  const endBtn = el("button", "btn danger", "End Session");
  actions.append(scenBtn, knobsBtn, endBtn);

  midHd.append(titleWrap, actions);

  const msgs = el("div", "lux-msgs");
  const sugs = el("div", "lux-sugs");
  const sugsNote = el("div", "lux-sugsNote");
  const coachBar = el("div", "lux-coachbar");

  const compose = el("div", "lux-compose");
  const input = document.createElement("textarea");
  input.className = "lux-in";
  input.placeholder = "Type or click a suggestion, then record your reply…";

  const talkBtn = el("button", "btn primary", "🎙 Record");
  compose.append(input, talkBtn);

  mid.append(midHd, coachBar, msgs, sugsNote, sugs, compose);
  chatWrap.append(mid);

  // Knobs drawer
  const drawer = el("div", "lux-drawer");
  const drawerHd = el("div", "lux-drawerHd");
  drawerHd.append(el("div", "lux-title", "Scene knobs"));
  const closeDrawer = el("button", "btn ghost", "Close");
  drawerHd.append(closeDrawer);

  const drawerBody = el("div", "lux-body k");
  const toneSel = mkSelect("Tone", ["friendly", "neutral", "playful", "formal", "flirty"]);
  const stressSel = mkSelect("Stress", ["low", "medium", "high"]);
  const paceSel = mkSelect("Pace", ["slow", "normal", "fast"]);
  drawerBody.append(toneSel.wrap, stressSel.wrap, paceSel.wrap);
  drawerBody.append(
    el(
      "div",
      "lux-sub",
      "Feedback stays hidden during the conversation. We log each spoken turn silently, then summarize at the end."
    )
  );

  drawer.append(drawerHd, drawerBody);

  const scrim = el("div", "lux-scrim");

  // Progress panel host (ONLY visible in chat mode via CSS)
  const convoProgress = el("div", "lux-convo-progress");
  convoProgress.id = "convoProgress";

  // IMPORTANT: append it *after* chatWrap, so it renders UNDER the chat box
  ui.append(intro, picker, chatWrap, convoProgress, drawer, scrim);
  root.append(atmo, ui);

  const { applySceneVisuals, setParallaxEnabled } = initSceneAtmo({ root, atmo, state });

  const VALID_MODES = new Set(["intro", "picker", "chat"]);

  function normalizeMode(m) {
    const s = (m ?? "").toString().replace(/^#/, "");
    return VALID_MODES.has(s) ? s : null;
  }

  function syncHistory(mode, push) {
    try {
      const url = `${location.pathname}${location.search}#${mode}`;
      const st = { luxConvo: 1, mode };
      if (push) history.pushState(st, "", url);
      else history.replaceState(st, "", url);
    } catch (_) {}
  }

  function render() {}

  function setMode(mode, opts = {}) {
    const changed = state.mode !== mode;

    state.mode = mode;
    root.dataset.mode = mode;

    // Used by lux-convo.css to gate drawers (TTS + SelfPB) until chat mode.
    document.documentElement.dataset.luxConvoMode = mode;

    // Parallax ONLY on intro screen.
    setParallaxEnabled(mode === "intro");

    // Keep knobs overlay from bleeding into intro/picker.
    if (mode !== "chat") setKnobs(false);

    // Browser back/forward steps: intro -> picker -> chat
    if (opts.replace) {
      syncHistory(mode, false);
    } else if (opts.push !== false && changed) {
      syncHistory(mode, true);
    }

    render();
  }

  function setKnobs(open) {
    state.knobsOpen = !!open;
    root.classList.toggle("knobs-open", state.knobsOpen);
  }

  function warpToPicker() {
    // intro -> picker gets the warp treatment
    if (state.mode !== "intro") return setMode("picker");
    warpSwap(() => setMode("picker"), { outMs: 200, inMs: 240 });
  }

  // Intro click => picker (Edge-like “push”)
  intro.addEventListener("click", warpToPicker);
  heroNext.addEventListener("click", (e) => {
    e.stopPropagation();
    warpToPicker();
  });

  // Chat header buttons
  scenBtn.addEventListener("click", () =>
    warpSwap(() => setMode("picker"), { outMs: 170, inMs: 220 })
  );
  knobsBtn.addEventListener("click", () => setKnobs(true));
  closeDrawer.addEventListener("click", () => setKnobs(false));
  scrim.addEventListener("click", () => setKnobs(false));

  // Knob wiring
  toneSel.sel.value = state.knobs.tone;
  stressSel.sel.value = state.knobs.stress;
  paceSel.sel.value = state.knobs.pace;

  toneSel.sel.addEventListener("change", () => (state.knobs.tone = toneSel.sel.value));
  stressSel.sel.addEventListener("change", () => (state.knobs.stress = stressSel.sel.value));
  paceSel.sel.addEventListener("change", () => (state.knobs.pace = paceSel.sel.value));

  function escHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function stripMarks(s) {
    return String(s || "")
      .replace(/\{~([^}]+)~\}/g, "$1")
      .replace(/\{\^([^}]+)\^\}/g, "$1");
  }

  function targetWords() {
    return (state.nextActivity?.targets?.words || [])
      .map((x) => x?.word || x)
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean);
  }

  function highlightHtml(text) {
    const raw = String(text || "");
    // 1) highlight explicit model marks:
    //    {~word~} => word-bank (yellow)
    //    {^word^} => phoneme-focus (blue)
    let html = escHtml(raw)
      .replace(/\{~([^}]+)~\}/g, (_m, w) => `<span class="lux-hl">${escHtml(w)}</span>`)
      .replace(/\{\^([^}]+)\^\}/g, (_m, w) => `<span class="lux-hl2">${escHtml(w)}</span>`);

    // 2) highlight known target words (whole-word, case-insensitive)
    const tw = targetWords()
      .slice()
      .sort((a, b) => b.length - a.length);

    for (const w of tw) {
      const re = new RegExp(`\\b(${escapeRegExp(w)})\\b`, "gi");
      html = html.replace(re, `<span class="lux-hl">$1</span>`);
    }

    return html;
  }

  // --- Chat rendering ---
  function renderMessages() {
    msgs.innerHTML = "";
    for (const m of state.messages) {
      const bubble = el("div", "msg " + (m.role === "user" ? "user" : "assistant"));
      bubble.innerHTML = highlightHtml(m.content);
      msgs.append(bubble);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function targetsInline(plan) {
    const ph = plan?.targets?.phoneme?.ipa ? `/${plan.targets.phoneme.ipa}/` : "";
    const words = (plan?.targets?.words || []).map((x) => x.word).filter(Boolean).slice(0, 6);
    const w = words.length ? words.join(", ") : "";
    if (ph && w) return `${ph} · ${w}`;
    return ph || w || "";
  }

  function showCoachCard({ title, body, meta, onDismiss }) {
    const card = el("div", "lux-coachcard");
    const left = el("div", "lux-coachtext");
    left.append(el("strong", "", title), el("div", "", body));
    if (meta) left.append(el("div", "lux-coachmeta", meta));
    const btn = el("button", "btn ghost lux-coachbtn", "Got it");
    btn.addEventListener("click", () => {
      card.remove();
      if (onDismiss) onDismiss();
    });
    card.append(left, btn);
    coachBar.append(card);
  }

  function maybeShowStartTip() {
    if (!state.nextActivity) return;
    if (state.coach.startTipShown) return;
    state.coach.startTipShown = true;
    const t = targetsInline(state.nextActivity);
    showCoachCard({
      title: "Targeted practice loaded",
      body:
        "Tip: read BOTH parts out loud. The assistant lines are packed with your focus sound/words. Then click a suggested reply and record it.",
      meta: t ? `Focus: ${t}` : "",
    });
  }

  function renderSuggestions(list) {
    sugs.innerHTML = "";
    (list || []).forEach((t) => {
      const raw = stripMarks(t);
      const b = el("button", "sug");
      b.dataset.raw = raw;
      b.innerHTML = highlightHtml(t);
      b.addEventListener("click", () => {
        input.value = raw;
        input.focus();
      });
      sugs.append(b);
    });

    // Tiny, always-light label (not overwhelming)
    if (state.nextActivity && (list || []).length) {
      const t = targetsInline(state.nextActivity);
      sugsNote.textContent = t
        ? `Suggested replies are tuned to: ${t}`
        : "Suggested replies are tuned to your targets.";
    } else {
      sugsNote.textContent = "";
    }

    // First-turn coaching tip (shown once, only when suggestions first appear)
    if (state.nextActivity && (list || []).length && !state.coach.replyTipShown) {
      state.coach.replyTipShown = true;
      const t = targetsInline(state.nextActivity);
      showCoachCard({
        title: "Recommended for best results",
        body:
          "This time, please use the suggested replies (at least for a few turns). They’re designed to include the sounds/words you need most.",
        meta: t ? `Targets inside the suggestions: ${t}` : "",
      });
    }
  }

  input.addEventListener("focus", () => {
    if (!state.nextActivity) return;
    if (state.coach.typeTipShown) return;
    state.coach.typeTipShown = true;
    showCoachCard({
      title: "Quick note before typing",
      body:
        "The suggested replies are packed with the exact sounds/words Lux thinks you need most right now. You can still type your own, but you might accidentally skip the targeted practice if you do.",
    });
  });

  // --- Convo flow (extracted) ---
  const { startScenario } = wireConvoFlow({
    SCENARIOS,
    state,
    root,
    input,
    talkBtn,
    endBtn,
    renderMessages,
    renderSuggestions,
    convoTurn,
    assessPronunciation,
    saveAttempt,
    uid,
    convoReport,
    showConvoReportOverlay,
  });

  if (state.nextActivity) {
    // Ensure we’re in chat mode and start immediately
    warpSwap(() => setMode("chat", { replace: true, push: false }), { outMs: 120, inMs: 160 })
      .then(() => startScenario())
      .catch((e) => console.error("[NextPractice] auto-start failed", e));
  }

  async function beginScenario() {
    await warpSwap(() => setMode("chat"), { outMs: 200, inMs: 240 });
    await startScenario(); // fetch opening line + suggested replies
  }

  // --- Picker deck (extracted) ---
  const { renderDeck } = wirePickerDeck({
    scenarios: SCENARIOS,
    state,
    thumbs,
    deckActive,
    deckPreview,
    backBtn,
    nextBtn,
    el,
    applyMediaSizingVars,
    applySceneVisuals,
    onBeginScenario: beginScenario,
  });

  function mkSelect(label, options) {
    const wrap = el("div");
    const lab = el("label", null, label);
    const sel = document.createElement("select");
    options.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      sel.append(opt);
    });
    wrap.append(lab, sel);
    return { wrap, sel };
  }

  // boot
  applySceneVisuals();
  renderDeck();

  // If a Next Practice plan was stored, consume it once and keep in memory for this session.
  try {
    const plan = consumeNextActivityPlan();
    if (plan) state.nextActivity = plan;
  } catch (_) {}

  // Initial mode: hash (if present) wins, otherwise intro.
  const initialMode =
    normalizeMode(history.state?.luxConvo ? history.state.mode : location.hash) || "intro";

  setMode(initialMode, { replace: true, push: false });

  // If we landed directly in chat (e.g., from "Generate my next practice"),
  // show the start tip immediately.
  if (state.mode === "chat" && state.nextActivity) {
    maybeShowStartTip();
  }

  window.addEventListener("popstate", (e) => {
    const m = normalizeMode(e.state?.luxConvo ? e.state.mode : location.hash);
    if (!m) return;
    warpSwap(() => setMode(m, { push: false }), { outMs: 140, inMs: 200 });
  });
}
