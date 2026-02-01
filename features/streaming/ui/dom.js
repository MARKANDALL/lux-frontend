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

  headerRight.append(modeWrap, getReplyBtn, stopBtn, statusPill);

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
  left.append(connectBtn, clearBtn);

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
    textInput,
    sendBtn,
    hint,
    stopBtn,
    getReplyBtn,
    tapBtn,
    autoBtn,
  };
}
