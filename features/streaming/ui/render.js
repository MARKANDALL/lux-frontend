// features/streaming/ui/render.js

function fmtKB(bytes) {
  const b = Number(bytes || 0);
  return `${Math.max(0, Math.round(b / 1024))} KB`;
}

function fmtClock(sec) {
  const s = Math.max(0, Number(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function fmtAge(ts) {
  const t = Number(ts || 0);
  if (!t) return "—";
  const ms = Date.now() - t;
  if (ms < 0) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return `${m}m ago`;
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
    empty.textContent = "No turns yet. Click Connect, then talk naturally (or type a message).";
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

function fmtMMSS(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

export function renderStreaming({ state, refs }) {
  if (!state || !refs) return;

  const s = state.scenario;
  const r = state.route || {};

  refs.sub.textContent = s
    ? `${s.title} • input=${r.input} • transport=${r.transport}`
    : `input=${r.input} • transport=${r.transport}`;

  setPill(refs.statusPill, state.connection);

  // Health panel
  const h = state.connection?.health || {};
  if (refs.debugToggle) {
    const want = !!h.debug;
    if (refs.debugToggle.checked !== want) refs.debugToggle.checked = want;
  }
  if (refs.healthVals) {
    if (refs.healthVals.pc) refs.healthVals.pc.textContent = h.pc || "—";
    if (refs.healthVals.ice) refs.healthVals.ice.textContent = h.ice || "—";
    if (refs.healthVals.dc) refs.healthVals.dc.textContent = h.dc || "—";
    if (refs.healthVals.mode)
      refs.healthVals.mode.textContent = h.mode || (r.input || "tap");
    if (refs.healthVals.commit) refs.healthVals.commit.textContent = fmtAge(h.lastCommitAt);
    if (refs.healthVals.response) {
      refs.healthVals.response.textContent = h.activeResponse ? "active" : "—";
    }
  }

  refs.connectBtn.textContent = state.connection.status === "live" ? "Disconnect" : "Connect";

  if (r.transport === "webrtc") {
    refs.hint.textContent = `Input: ${r.input}`;
  } else {
    refs.hint.textContent =
      r.input === "ptt" ? "Hold Space to talk (Push-to-talk)." : `Input: ${r.input}`;
  }

  if (refs.stopBtn) {
    refs.stopBtn.disabled = state.connection.status !== "live";
  }

  if (refs.getReplyBtn) {
    const isLive = state.connection.status === "live";
    const isTap = (r.input || "") === "tap";
    refs.getReplyBtn.disabled = !(isLive && isTap);
    refs.getReplyBtn.style.display = isTap ? "" : "none";
  }

  // Mode toggle (Tap vs Auto)
  const mode = r.input || "tap";
  if (refs.tapBtn) {
    refs.tapBtn.dataset.active = mode === "tap" ? "1" : "0";
    refs.tapBtn.disabled = state.connection.status !== "live" ? false : mode === "tap";
  }
  if (refs.autoBtn) {
    refs.autoBtn.dataset.active = mode === "auto" ? "1" : "0";
    refs.autoBtn.disabled = state.connection.status !== "live" ? false : mode === "auto";
  }

  renderTurns(refs.thread, state.thread.turns);

  // Timer pill + preset selector
  if (refs.timerPill) {
    refs.timerPill.textContent = fmtClock(state.session?.remainingSec);
  }
  if (refs.durationSel) {
    const dur = String(state.session?.durationSec || 300);
    if (refs.durationSel.value !== dur) refs.durationSel.value = dur;
    refs.durationSel.disabled = state.connection.status === "live";
  }

  // End modal
  if (refs.modalBackdrop) {
    const open = !!state.session?.modalOpen;
    refs.modalBackdrop.style.display = open ? "flex" : "none";
    if (open && refs.modalBody) {
      const reason = state.session?.endReason || "manual";
      const turns = state.session?.turnsUsed || 0;
      refs.modalBody.textContent = `Ended by ${reason}. Turns: ${turns}.`;
    }
  }
}
