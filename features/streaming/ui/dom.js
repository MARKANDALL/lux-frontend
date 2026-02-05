// features/streaming/ui/dom.js

export function buildStreamingDOM({ root }) {
  root.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "ls-wrap";

  const header = document.createElement("header");
  header.className = "ls-header";

  const title = document.createElement("div");
  title.className = "ls-title";
  title.textContent = "Streaming";

  const sub = document.createElement("div");
  sub.className = "ls-sub";

  const headerLeft = document.createElement("div");
  headerLeft.className = "ls-headerLeft";
  headerLeft.append(title, sub);

  const statusPill = document.createElement("div");
  statusPill.className = "ls-pill";
  statusPill.textContent = "Disconnected";

  // Mic activity meter (premium “alive” signal)
  const micMeter = document.createElement("div");
  micMeter.className = "ls-micMeter";
  micMeter.title = "Mic level";

  function mkBar() {
    const b = document.createElement("div");
    b.className = "ls-micBar";
    return b;
  }

  const micBars = [mkBar(), mkBar(), mkBar(), mkBar()];
  micMeter.append(...micBars);

  const getReplyBtn = document.createElement("button");
  getReplyBtn.className = "ls-btn";
  getReplyBtn.type = "button";
  getReplyBtn.textContent = "Get reply";
  getReplyBtn.disabled = true;

  const stopBtn = document.createElement("button");
  stopBtn.className = "ls-btn ghost";
  stopBtn.type = "button";
  stopBtn.textContent = "Stop speaking";
  stopBtn.disabled = true;

  const headerRight = document.createElement("div");
  headerRight.className = "ls-headerRight";

  const modeWrap = document.createElement("div");
  modeWrap.className = "ls-modeWrap";

  const tapBtn = document.createElement("button");
  tapBtn.className = "ls-btn ghost";
  tapBtn.type = "button";
  tapBtn.textContent = "Tap";

  const autoBtn = document.createElement("button");
  autoBtn.className = "ls-btn ghost";
  autoBtn.type = "button";
  autoBtn.textContent = "Auto";

  modeWrap.append(tapBtn, autoBtn);

  const timerPill = document.createElement("div");
  timerPill.className = "ls-pill ls-timerPill";
  timerPill.textContent = "02:30";

  // Health panel (collapsible)
  const healthDetails = document.createElement("details");
  healthDetails.className = "ls-health";
  healthDetails.open = false;

  const healthSummary = document.createElement("summary");
  healthSummary.className = "ls-healthSummary";
  healthSummary.textContent = "Health";

  const healthBody = document.createElement("div");
  healthBody.className = "ls-healthBody";

  const debugWrap = document.createElement("label");
  debugWrap.className = "ls-debugWrap";
  const debugToggle = document.createElement("input");
  debugToggle.type = "checkbox";
  debugToggle.className = "ls-debugToggle";
  const debugText = document.createElement("span");
  debugText.textContent = "Debug";
  debugWrap.append(debugToggle, debugText);

  const healthGrid = document.createElement("div");
  healthGrid.className = "ls-healthGrid";

  function mkRow(label) {
    const row = document.createElement("div");
    row.className = "ls-healthRow";
    const k = document.createElement("div");
    k.className = "ls-healthKey";
    k.textContent = label;
    const v = document.createElement("div");
    v.className = "ls-healthVal";
    v.textContent = "—";
    row.append(k, v);
    return { row, v };
  }

  const pcRow = mkRow("PC");
  const iceRow = mkRow("ICE");
  const dcRow = mkRow("DC");
  const modeRow = mkRow("Mode");
  const commitRow = mkRow("Last commit");
  const respRow = mkRow("Response");

  healthGrid.append(
    pcRow.row,
    iceRow.row,
    dcRow.row,
    modeRow.row,
    commitRow.row,
    respRow.row
  );

  healthBody.append(debugWrap, healthGrid);
  healthDetails.append(healthSummary, healthBody);

  headerRight.append(
    modeWrap,
    getReplyBtn,
    stopBtn,
    timerPill,
    micMeter,
    healthDetails,
    statusPill
  );

  header.append(headerLeft, headerRight);

  const thread = document.createElement("main");
  thread.className = "ls-thread";

  const controls = document.createElement("footer");
  controls.className = "ls-controls";

  const connectBtn = document.createElement("button");
  connectBtn.className = "ls-btn";
  connectBtn.type = "button";
  connectBtn.textContent = "Connect";

  const clearBtn = document.createElement("button");
  clearBtn.className = "ls-btn ghost";
  clearBtn.type = "button";
  clearBtn.textContent = "Clear";

  const reconnectBtn = document.createElement("button");
  reconnectBtn.className = "ls-btn ghost";
  reconnectBtn.type = "button";
  reconnectBtn.textContent = "Reconnect";
  reconnectBtn.style.display = "none";

  const hint = document.createElement("div");
  hint.className = "ls-hint";
  hint.textContent = "Hold Space to talk (Push-to-talk).";

  const textRow = document.createElement("div");
  textRow.className = "ls-textRow";

  const textInput = document.createElement("input");
  textInput.className = "ls-textInput";
  textInput.placeholder = "Type a message (optional)…";
  textInput.autocomplete = "off";
  textInput.spellcheck = false;

  const sendBtn = document.createElement("button");
  sendBtn.className = "ls-btn";
  sendBtn.type = "button";
  sendBtn.textContent = "Send";

  textRow.append(textInput, sendBtn);

  const left = document.createElement("div");
  left.className = "ls-controlsLeft";
  left.append(connectBtn, clearBtn, reconnectBtn);

  const right = document.createElement("div");
  right.className = "ls-controlsRight";
  right.append(hint);

  controls.append(left, right, textRow);

  wrap.append(header, thread, controls);
  root.append(wrap);

  return {
    sub,
    statusPill,
    thread,
    connectBtn,
    clearBtn,
    reconnectBtn,
    textInput,
    sendBtn,
    hint,
    stopBtn,
    getReplyBtn,
    tapBtn,
    autoBtn,
    timerPill,
    micMeter,
    micBars,
    healthDetails,
    debugToggle,
    healthVals: {
      pc: pcRow.v,
      ice: iceRow.v,
      dc: dcRow.v,
      mode: modeRow.v,
      commit: commitRow.v,
      response: respRow.v,
    },
  };
}
