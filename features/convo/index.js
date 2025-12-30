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

function nowIso() {
  return new Date().toISOString();
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
  if (!host) {
    host = document.createElement("div");
    host.id = "luxConvoReportOverlay";
    host.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      padding: 18px;
    `;
    document.body.appendChild(host);
  }

  const pretty = escapeHtml(JSON.stringify(report, null, 2));
  host.innerHTML = `
    <div style="
      width: min(920px, 96vw);
      max-height: min(84vh, 900px);
      overflow: auto;
      background: #0b1220;
      color: #e5e7eb;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 20px 70px rgba(0,0,0,0.55);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
      line-height: 1.35;
    ">
      <div style="display:flex; gap:12px; align-items:center; justify-content:space-between; margin-bottom:10px;">
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-size:14px; font-weight:600;">
          Convo Report (pron: ${report?.scores?.pron ?? "?"})
        </div>
        <button id="luxConvoReportClose" style="
          background:#111827; color:#e5e7eb; border:1px solid rgba(255,255,255,0.10);
          border-radius:10px; padding:8px 10px; cursor:pointer;
        ">Close</button>
      </div>
      <pre style="white-space: pre-wrap; margin: 0;">${pretty}</pre>
    </div>
  `;

  host.querySelector("#luxConvoReportClose")?.addEventListener("click", () => host.remove());
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
    knobs: { tone: "friendly", stress: "low", pace: "normal" },
    messages: [], // {role:"user"|"assistant", content:string}
    turns: [], // {turn, userText, azureResult, attemptId?}
    isRecording: false,
    recorder: null,
    stream: null,
    chunks: [],
    busy: false,
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

  const talkBtn = el("button", "btn primary", "🎙 Record");
  compose.append(input, talkBtn);
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
    talkBtn.textContent = "■ Stop & Send";
    root.classList.add("is-recording");

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
      talkBtn.textContent = "🎙 Record";
      root.classList.remove("is-recording");

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

    // Hand the finished learner audio to the Self Playback drawer (if present)
    if (audioBlob) {
      // This global function is created by 08-selfpb-peekaboo.js
      // It tells the right drawer: "Here is the new audio to play back"
      if (window.__attachLearnerBlob) {
        window.__attachLearnerBlob(audioBlob);
      }
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
  talkBtn.addEventListener("click", async () => {
    if (state.busy) return;

    // If we're currently recording, STOP and SEND
    if (state.isRecording) {
      state.busy = true;
      try {
        const blob = await stopRecordingAndGetBlob();
        if (blob) await sendTurn({ audioBlob: blob });
      } finally {
        state.busy = false;
      }
      return;
    }

    // Not recording yet: require text before recording (since assess needs reference text)
    const userText = (input.value || "").trim();
    if (!userText) {
      alert("Type (or click) your reply first, then press Record.");
      input.focus();
      return;
    }

    await startRecording();
  });

  endBtn.addEventListener("click", async () => {
    try {
      const s = SCENARIOS[state.scenarioIdx];

      const payload = {
        uid: uid(),
        sessionId: state.sessionId,
        passageKey: `convo:${s.id}`,
      };

      console.log("[Convo] convo-report payload", payload);

      const report = await convoReport(payload);

      console.log("[Convo] convo-report result", report);

      showConvoReportOverlay(report);

      // Quick on-screen dump so you *see* it tonight
      let pre = document.getElementById("luxConvoReportDump");
      if (!pre) {
        pre = document.createElement("pre");
        pre.id = "luxConvoReportDump";
        pre.style.whiteSpace = "pre-wrap";
        pre.style.maxHeight = "35vh";
        pre.style.overflow = "auto";
        pre.style.marginTop = "12px";
        pre.style.padding = "12px";
        pre.style.border = "1px solid rgba(255,255,255,0.12)";
        pre.style.borderRadius = "10px";

        // Append somewhere sensible (fallback to body)
        (document.getElementById("convoApp") || document.body).appendChild(pre);
      }

      pre.textContent = JSON.stringify(report, null, 2);
    } catch (e) {
      console.error("[Convo] convo-report failed", e);
      alert(`End Session report failed: ${e?.message || e}`);
    }
  });

  // boot
  renderScenarios();
  startScenario().catch(console.error);
}
