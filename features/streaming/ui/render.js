// features/streaming/ui/render.js

function fmtKB(bytes) {
  const b = Number(bytes || 0);
  return `${Math.max(0, Math.round(b / 1024))} KB`;
}

function setPill(el, { status, error }) {
  if (!el) return;
  el.dataset.status = status || "";

  if (status === "live") el.textContent = "Live";
  else if (status === "connecting") el.textContent = "Connecting…";
  else if (status === "error") el.textContent = error ? `Error: ${error}` : "Error";
  else el.textContent = "Disconnected";
}

function renderTurns(container, turns) {
  if (!container) return;
  container.innerHTML = "";

  if (!turns || !turns.length) {
    const empty = document.createElement("div");
    empty.className = "ls-empty";
    empty.textContent = "No turns yet. Click Connect, then hold Space to talk (or type a message).";
    container.append(empty);
    return;
  }

  for (const t of turns) {
    const row = document.createElement("div");
    row.className = `ls-bubbleRow ${t.role === "user" ? "is-user" : "is-assistant"}`;

    const bubble = document.createElement("div");
    bubble.className = "ls-bubble";

    if (t.kind === "audio") bubble.textContent = `🎙️ User turn (${fmtKB(t.audio?.size)})`;
    else bubble.textContent = t.text || "";

    row.append(bubble);
    container.append(row);
  }

  container.scrollTop = container.scrollHeight;
}

export function renderStreaming({ state, refs }) {
  if (!state || !refs) return;

  const s = state.scenario;
  const r = state.route || {};

  refs.sub.textContent = s
    ? `${s.title} • input=${r.input} • transport=${r.transport}`
    : `input=${r.input} • transport=${r.transport}`;

  setPill(refs.statusPill, state.connection);

  refs.connectBtn.textContent = state.connection.status === "live" ? "Disconnect" : "Connect";
  refs.hint.textContent = r.input === "ptt" ? "Hold Space to talk (Push-to-talk)." : `Input: ${r.input}`;

  renderTurns(refs.thread, state.thread.turns);
}
