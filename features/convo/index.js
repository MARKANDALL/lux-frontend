// features/convo/index.js
import { SCENARIOS } from "./scenarios.js";
import { convoTurn } from "../../api/convo.js";
import { assessPronunciation } from "../../api/assess.js";
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

function nowIso() {
  return new Date().toISOString();
}

export function bootConvo() {
  const root = document.getElementById("convoApp");
  if (!root) return;

  const state = {
    sessionId: newSessionId(),
    scenarioIdx: 0,
    knobs: { tone: "friendly", stress: "low", pace: "normal" },
    messages: [],      // {role:"user"|"assistant", content:string}
    turns: [],         // {turn, userText, azureResult, attemptId?}
    isRecording: false,
    recorder: null,
    stream: null,
    chunks: [],
  };

  // --- Layout ---
  root.innerHTML = "";

  // Left: scenarios
  const left = el("div", "lux-panel");
  const leftHd = el("div", "lux-hd");
  leftHd.append(el("div", null, "Scenarios"));
  leftHd.append(el("div", "lux-sub", "Pick one to start"));
  left.append(leftHd);

  const leftBody = el("div", "lux-body");
  const stack = el("div", "lux-cardstack");
  const dots = el("div", "lux-dots");
  leftBody.append(stack);
  leftBody.append(dots);
  left.append(leftBody);

  // Center: chat
  const mid = el("div", "lux-panel lux-chat");
  const midHd = el("div", "lux-hd");
  const titleWrap = el("div");
  const title = el("div", "lux-title", "AI Conversation");
  const sub = el("div", "lux-sub", `Session: ${state.sessionId}`);
  titleWrap.append(title, sub);
  midHd.append(titleWrap);

  const endBtn = el("button", "btn danger", "End Session");
  midHd.append(endBtn);
  mid.append(midHd);

  const msgs = el("div", "lux-msgs");
  const sugs = el("div", "lux-sugs");
  const compose = el("div", "lux-compose");

  const input = document.createElement("textarea");
  input.className = "lux-in";
  input.placeholder = "Type or click a suggestion, then record your reply…";

  const recBtn = el("button", "btn", "🎙 Record");
  const sendBtn = el("button", "btn primary", "Send →");

  compose.append(input, recBtn, sendBtn);
  mid.append(msgs, sugs, compose);

  // Right: knobs
  const right = el("div", "lux-panel");
  const rightHd = el("div", "lux-hd");
  rightHd.append(el("div", "lux-title", "Scene knobs"));
  right.append(rightHd);

  const rightBody = el("div", "lux-body k");

  const toneSel = mkSelect("Tone", ["friendly", "neutral", "playful", "formal", "flirty"]);
  const stressSel = mkSelect("Stress", ["low", "medium", "high"]);
  const paceSel = mkSelect("Pace", ["slow", "normal", "fast"]);

  rightBody.append(toneSel.wrap, stressSel.wrap, paceSel.wrap);
  rightBody.append(
    el(
      "div",
      "small",
      "Feedback stays hidden during the conversation. We log each spoken turn silently, then summarize at the end."
    )
  );
  right.append(rightBody);

  root.append(left, mid, right);

  // --- Render scenarios (simple “Edge-ish” stack) ---
  function renderScenarios() {
    stack.innerHTML = "";
    dots.innerHTML = "";

    SCENARIOS.forEach((s, i) => {
      const dot = el("button", "lux-dot" + (i === state.scenarioIdx ? " is-active" : ""));
      dot.title = s.title;
      dot.addEventListener("click", () => {
        state.scenarioIdx = i;
        renderScenarios();
      });
      dots.append(dot);
    });

    // show current + neighbors (lightweight stack)
    const idx = state.scenarioIdx;
    const show = [idx, idx + 1, idx + 2].filter((i) => i < SCENARIOS.length);

    show.forEach((i) => {
      const s = SCENARIOS[i];
      const b = el("button", "lux-cardbtn" + (i === idx ? " is-active" : ""));
      b.innerHTML = `<div class="t">${s.title}</div><div class="d">${s.desc}</div>`;
      b.addEventListener("click", async () => {
        state.scenarioIdx = i;
        renderScenarios();
        await startScenario();
      });
      stack.append(b);
    });
  }

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

  // --- Knob wiring ---
  toneSel.sel.value = state.knobs.tone;
  stressSel.sel.value = state.knobs.stress;
  paceSel.sel.value = state.knobs.pace;

  toneSel.sel.addEventListener("change", () => (state.knobs.tone = toneSel.sel.value));
  stressSel.sel.addEventListener("change", () => (state.knobs.stress = stressSel.sel.value));
  paceSel.sel.addEventListener("change", () => (state.knobs.pace = paceSel.sel.value));

  // --- Scenario start ---
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

  // --- Recording helpers (per-turn) ---
  async function startRecording() {
    if (state.isRecording) return;
    state.isRecording = true;
    recBtn.textContent = "■ Stop";

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
      if (!state.recorder || !state.isRecording) return resolve(null);
      state.isRecording = false;
      recBtn.textContent = "🎙 Record";

      state.recorder.onstop = () => {
        try {
          state.stream?.getTracks()?.forEach((t) => t.stop());
        } catch {}
        const blob = new Blob(state.chunks, { type: "audio/webm" });
        resolve(blob);
      };

      state.recorder.stop();
    });
  }

  // --- Send turn: (1) Azure assess silently, (2) save attempt, (3) get next AI reply ---
  async function sendTurn({ audioBlob }) {
    const s = SCENARIOS[state.scenarioIdx];
    const userText = (input.value || "").trim();
    if (!userText) return;

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

    // Save attempt (silent)
    try {
      const saved = await saveAttempt({
        uid: uid(),
        passageKey: `convo:${s.id}`,
        partIndex: state.turns.length,
        text: userText,
        azureResult,
        l1: "universal",
        sessionId: state.sessionId,
        localTime: nowIso(),
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
  recBtn.addEventListener("click", async () => {
    if (!state.isRecording) {
      await startRecording();
    } else {
      const blob = await stopRecordingAndGetBlob();
      if (blob) await sendTurn({ audioBlob: blob });
    }
  });

  sendBtn.addEventListener("click", async () => {
    // type-only send => no assessment
    await sendTurn({ audioBlob: null });
  });

  endBtn.addEventListener("click", () => {
    // MVP: end session without showing feedback (yet)
    alert("Session ended. Turns saved. Next step: generate the delayed summary report.");
  });

  // boot
  renderScenarios();
  startScenario().catch(console.error);
}
