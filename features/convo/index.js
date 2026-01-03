// features/convo/index.js
import { SCENARIOS } from "./scenarios.js";
import { convoTurn } from "../../api/convo.js";
import { assessPronunciation } from "../../api/assess.js";
import { convoReport } from "../../api/convo-report.js";
import { saveAttempt } from "/src/api/index.js";
import { warpSwap } from "../../ui/warp-core.js";

import { initSceneAtmo } from "./scene-atmo.js";
import { wirePickerDeck } from "./picker-deck.js";

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
  };

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

  const compose = el("div", "lux-compose");
  const input = document.createElement("textarea");
  input.className = "lux-in";
  input.placeholder = "Type or click a suggestion, then record your reply…";

  const talkBtn = el("button", "btn primary", "🎙 Record");
  compose.append(input, talkBtn);

  mid.append(midHd, msgs, sugs, compose);
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

  // --- Chat rendering ---
  function renderMessages() {
    msgs.innerHTML = "";
    for (const m of state.messages) {
      const bubble = el("div", "msg " + (m.role === "user" ? "user" : "assistant"));
      bubble.textContent = m.content;
      msgs.append(bubble);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderSuggestions(list) {
    sugs.innerHTML = "";
    (list || []).forEach((t) => {
      const b = el("button", "sug", t);
      b.addEventListener("click", () => {
        input.value = t;
        input.focus();
      });
      sugs.append(b);
    });
  }

  async function startScenario() {
    // reset convo
    state.messages = [];
    state.turns = [];
    renderMessages();
    renderSuggestions([]);

    const s = SCENARIOS[state.scenarioIdx];

    // ask backend for opening line + suggestions
    const rsp = await convoTurn({
      scenario: { id: s.id, title: s.title, desc: s.desc },
      knobs: state.knobs,
      messages: [],
    });

    if (rsp?.assistant) state.messages.push({ role: "assistant", content: rsp.assistant });
    renderMessages();
    renderSuggestions(rsp?.suggested_replies || []);
  }

  // --- Recording helpers ---
  async function startRecording() {
    state.chunks = [];
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recorder = new MediaRecorder(state.stream);

    state.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) state.chunks.push(e.data);
    };

    state.recorder.start();
  }

  async function stopRecordingAndGetBlob() {
    return new Promise((resolve) => {
      if (!state.recorder) return resolve(null);

      const rec = state.recorder;
      rec.onstop = () => {
        try {
          state.stream?.getTracks()?.forEach((t) => t.stop());
        } catch (_) {}
        state.stream = null;

        const blob = new Blob(state.chunks, { type: rec.mimeType || "audio/webm" });
        state.chunks = [];
        state.recorder = null;
        resolve(blob);
      };

      rec.stop();
    });
  }

  // --- Turn send (assess -> attempt -> convoTurn) ---
  async function sendTurn({ audioBlob }) {
    const s = SCENARIOS[state.scenarioIdx];
    const userText = (input.value || "").trim();
    if (!userText) return;

    // Hand the finished learner audio to the Self Playback drawer (if present)
    if (audioBlob) {
      if (window.__attachLearnerBlob) window.__attachLearnerBlob(audioBlob);
    }

    // show user msg in chat immediately (natural flow)
    state.messages.push({ role: "user", content: userText });
    renderMessages();
    input.value = "";

    // Azure assessment (silent) - only if we actually have audio
    let azureResult = null;
    try {
      if (audioBlob && audioBlob.size > 0) {
        azureResult = await assessPronunciation({ audioBlob, text: userText });
      }
    } catch (e) {
      console.error("[Convo] assess failed", e);
    }

    // save attempt (always)
    try {
      const saved = await saveAttempt({
        uid: uid(),
        passageKey: `convo:${s.id}`,
        partIndex: state.turns.length,
        text: userText,
        azureResult,
        sessionId: state.sessionId,
        localTime: new Date().toISOString(),
      });
      state.turns.push({ turn: state.turns.length, userText, azureResult, attemptId: saved?.id });
    } catch (e) {
      console.error("[Convo] saveAttempt failed", e);
      state.turns.push({ turn: state.turns.length, userText, azureResult, attemptId: null });
    }

    // refresh Conversation Skills progress (if present)
    if (window.refreshConvoProgress) {
      try {
        await window.refreshConvoProgress();
      } catch (_) {}
    }

    // next AI response + suggestions
    const rsp = await convoTurn({
      scenario: { id: s.id, title: s.title, desc: s.desc },
      knobs: state.knobs,
      messages: state.messages.slice(-24),
    });

    if (rsp?.assistant) state.messages.push({ role: "assistant", content: rsp.assistant });
    renderMessages();
    renderSuggestions(rsp?.suggested_replies || []);
  }

  // --- Buttons ---
  talkBtn.addEventListener("click", async () => {
    if (state.busy) return;

    // If we're currently recording, STOP and SEND
    if (state.isRecording) {
      state.busy = true;
      talkBtn.disabled = true;
      try {
        const blob = await stopRecordingAndGetBlob();
        state.isRecording = false;
        root.classList.remove("is-recording");
        talkBtn.textContent = "🎙 Record";
        if (blob) await sendTurn({ audioBlob: blob });
      } finally {
        state.busy = false;
        talkBtn.disabled = false;
      }
      return;
    }

    // Not recording yet => start (only if input has text)
    const userText = (input.value || "").trim();
    if (!userText) return;

    state.busy = true;
    talkBtn.disabled = true;
    try {
      await startRecording();
      state.isRecording = true;
      root.classList.add("is-recording");
      talkBtn.textContent = "■ Stop & Send";
    } catch (e) {
      console.error("[Convo] start recording failed", e);
      alert(`Recording failed: ${e?.message || e}`);
    } finally {
      state.busy = false;
      talkBtn.disabled = false;
    }
  });

  endBtn.addEventListener("click", async () => {
    try {
      const s = SCENARIOS[state.scenarioIdx];
      const report = await convoReport({
        uid: uid(),
        sessionId: state.sessionId,
        passageKey: `convo:${s.id}`,
      });

      console.log("[Convo] convo-report result", report);
      showConvoReportOverlay(report);

      // Keep the old debug dump too (harmless + useful)
      let pre = document.getElementById("luxConvoReportDump");
      if (!pre) {
        pre = document.createElement("pre");
        pre.id = "luxConvoReportDump";
        pre.style.cssText = `
          position: fixed; left: 12px; bottom: 12px; z-index: 99998;
          max-width: min(520px, 92vw);
          max-height: min(320px, 38vh);
          overflow: auto;
          white-space: pre-wrap;
          background: rgba(0,0,0,0.55);
          color: #e5e7eb;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          padding: 10px;
          font-size: 11px;
        `;
        (document.getElementById("convoApp") || document.body).appendChild(pre);
      }
      pre.textContent = JSON.stringify(report, null, 2);
    } catch (e) {
      console.error("[Convo] convo-report failed", e);
      alert(`End Session report failed: ${e?.message || e}`);
    }
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

  // Initial mode: hash (if present) wins, otherwise intro.
  const initialMode =
    normalizeMode(history.state?.luxConvo ? history.state.mode : location.hash) || "intro";

  setMode(initialMode, { replace: true, push: false });

  window.addEventListener("popstate", (e) => {
    const m = normalizeMode(e.state?.luxConvo ? e.state.mode : location.hash);
    if (!m) return;
    warpSwap(() => setMode(m, { push: false }), { outMs: 140, inMs: 200 });
  });
}
