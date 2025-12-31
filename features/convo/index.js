// features/convo/index.js
import { SCENARIOS } from "./scenarios.js";
import { convoTurn } from "../../api/convo.js";
import { assessPronunciation } from "../../api/assess.js";
import { convoReport } from "../../api/convo-report.js";
import { saveAttempt, ensureUID } from "../../api/index.js";

function uid() {
  return ensureUID();
}

function newSessionId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showConvoReportOverlay(report) {
  let host = document.getElementById("luxConvoReportOverlay");
  const pretty = escapeHtml(JSON.stringify(report, null, 2));

  if (!host) {
    host = document.createElement("div");
    host.id = "luxConvoReportOverlay";
    host.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.45);
      display:flex; align-items:center; justify-content:center;
      padding: 18px;
    `;

    host.innerHTML = `
      <div style="
        width: min(980px, 96vw);
        max-height: min(80vh, 720px);
        overflow: auto;
        border-radius: 18px;
        background: rgba(20,20,30,0.92);
        border: 1px solid rgba(255,255,255,0.10);
        padding: 14px;
        backdrop-filter: blur(12px);
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 10px;">
          <div style="font-weight: 650;">
            Convo Report (pron: ${escapeHtml(String(report?.scores?.pron ?? "?"))})
          </div>
          <button id="luxConvoReportClose" style="
            background:#111827; color:#e5e7eb; border:1px solid rgba(255,255,255,0.10);
            border-radius:10px; padding:8px 10px; cursor:pointer;
          ">Close</button>
        </div>
        <pre id="luxConvoReportPre" style="
          white-space: pre-wrap;
          margin: 0;
          font-size: 12px;
          line-height: 1.35;
          color: rgba(255,255,255,0.88);
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px;
        ">${pretty}</pre>
      </div>
    `;

    host.querySelector("#luxConvoReportClose")?.addEventListener("click", () => host.remove());
  } else {
    host.querySelector("#luxConvoReportPre").textContent = JSON.stringify(report, null, 2);
  }

  document.body.appendChild(host);
}

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
  const backBtn = el("button", "lux-navArrow", "←");
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

  ui.append(intro, picker, chatWrap, drawer, scrim);
  root.append(atmo, ui);

  // --- Scene visuals / parallax ---
  function applySceneVisuals() {
    const hue = (185 + state.scenarioIdx * 34) % 360;
    root.style.setProperty("--lux-hue", String(hue));
    root.dataset.side = state.scenarioIdx % 2 === 0 ? "left" : "right";
  }

  // --- Parallax driver (Edge-like: stage-relative + eased + recenters on leave) ---
  const par = { tx: 0, ty: 0, x: 0, y: 0, raf: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function parTick() {
    // Ease gives that “float / inertia” feel
    par.x += (par.tx - par.x) * 0.12;
    par.y += (par.ty - par.y) * 0.12;

    root.style.setProperty("--lux-mx", par.x.toFixed(4));
    root.style.setProperty("--lux-my", par.y.toFixed(4));

    const done = Math.abs(par.tx - par.x) < 0.001 && Math.abs(par.ty - par.y) < 0.001;
    if (done) {
      par.raf = 0;
      return;
    }
    par.raf = requestAnimationFrame(parTick);
  }
  function parKick() {
    if (!par.raf) par.raf = requestAnimationFrame(parTick);
  }

  function parSetFromEvent(e) {
    const r = root.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const nx = clamp((e.clientX - cx) / (r.width / 2), -1, 1);
    const ny = clamp((e.clientY - cy) / (r.height / 2), -1, 1);

    par.tx = nx;
    par.ty = ny;
    parKick();
  }

  root.addEventListener("pointermove", parSetFromEvent, { passive: true });
  root.addEventListener("pointerdown", parSetFromEvent, { passive: true });
  root.addEventListener(
    "pointerleave",
    () => {
      par.tx = 0;
      par.ty = 0;
      parKick();
    },
    { passive: true }
  );

  // ensure neutral at boot
  root.style.setProperty("--lux-mx", "0");
  root.style.setProperty("--lux-my", "0");

  function setMode(mode) {
    state.mode = mode;
    root.dataset.mode = mode;
  }

  function setKnobs(open) {
    state.knobsOpen = !!open;
    root.classList.toggle("knobs-open", state.knobsOpen);
  }

  // Intro click => picker
  intro.addEventListener("click", () => setMode("picker"));
  heroNext.addEventListener("click", (e) => {
    e.stopPropagation();
    setMode("picker");
  });

  // Chat header buttons
  scenBtn.addEventListener("click", () => setMode("picker"));
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

  // --- Picker deck ---
  function renderThumbs() {
    thumbs.innerHTML = "";
    SCENARIOS.forEach((s, i) => {
      const b = el("button", "lux-thumb" + (i === state.scenarioIdx ? " is-active" : ""));
      b.title = s.title;
      b.textContent = (s.title || "?").trim().slice(0, 1).toUpperCase();
      b.addEventListener("click", () => {
        state.scenarioIdx = i;
        renderDeck();
      });
      thumbs.append(b);
    });
  }

  function fillDeckCard(host, scenario, isActive) {
    host.innerHTML = "";

    host.append(
      el("div", "lux-pill", "DIALOGUE"),
      el("div", "lux-deckTitle", scenario.title),
      el("div", "lux-deckDesc", scenario.desc)
    );

    if (isActive) {
      const cta = el("button", "lux-deckCta", "Practice this dialogue");
      cta.addEventListener("click", async (e) => {
        e.stopPropagation();
        await beginScenario();
      });
      host.append(cta);

      host.onclick = () => beginScenario().catch(console.error);
    } else {
      host.onclick = null;
    }
  }

  async function beginScenario() {
    setMode("chat");
    await startScenario(); // fetch opening line + suggested replies
  }

  function renderDeck() {
    applySceneVisuals();
    const idx = state.scenarioIdx;
    const next = (idx + 1) % SCENARIOS.length;

    fillDeckCard(deckActive, SCENARIOS[idx], true);
    fillDeckCard(deckPreview, SCENARIOS[next], false);

    renderThumbs();
  }

  backBtn.addEventListener("click", () => {
    state.scenarioIdx = (state.scenarioIdx - 1 + SCENARIOS.length) % SCENARIOS.length;
    renderDeck();
  });

  nextBtn.addEventListener("click", () => {
    state.scenarioIdx = (state.scenarioIdx + 1) % SCENARIOS.length;
    renderDeck();
  });

  // Preview click behaves like Next (Edge feel)
  deckPreview.addEventListener("click", () => {
    state.scenarioIdx = (state.scenarioIdx + 1) % SCENARIOS.length;
    renderDeck();
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
  setMode("intro");
}
