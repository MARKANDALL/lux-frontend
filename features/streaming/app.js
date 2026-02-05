// features/streaming/app.js
import { parseStreamRoute } from "./router.js";
import { createStore } from "./state/store.js";
import { createInitialState, reducer, ACTIONS } from "./state/schema.js";

import { buildStreamingDOM } from "./ui/dom.js";
import { renderStreaming } from "./ui/render.js";

import { createTransportController } from "./transport/transport-controller.js";
import { createAudioController } from "./audio/audio-controller.js";
import { ensureUID } from "../../api/identity.js";
import { saveAttempt } from "../../api/attempts.js";

export function mountStreamingApp({ rootId = "lux-stream-root" } = {}) {
  const root = document.getElementById(rootId);
  if (!root) return;

  if (root.dataset.luxBooted === "1") return;
  root.dataset.luxBooted = "1";

  const route = parseStreamRoute();

  const store = createStore({
    initialState: createInitialState({ route }),
    reducer,
  });

  const refs = buildStreamingDOM({ root });

  // Dev-only diagnostics (Health panel visible in dev, hidden in prod)
  try {
    if (import.meta?.env?.PROD && refs.healthDetails) {
      refs.healthDetails.style.display = "none";
    }
  } catch (_) {}

  // Debug toggle (query param ?debug=1 or persisted localStorage)
  function readDebugFlag() {
    try {
      if (/[?&]debug=1(?:&|$)/.test(window.location.search)) return true;
      return window.localStorage.getItem("LUX_STREAM_DEBUG") === "1";
    } catch {
      return false;
    }
  }

  const IS_DEV = !!import.meta.env.DEV;
  let debugEnabled = readDebugFlag();

  // ✅ Health visible in dev; hidden in prod unless debug is enabled
  const showHealth = IS_DEV || debugEnabled;
  if (refs.healthDetails) refs.healthDetails.hidden = !showHealth;
  if (refs.debugToggle) refs.debugToggle.checked = debugEnabled;

  // Controllers
  const transport = createTransportController({ store, route });

  // Apply debug to provider now that transport exists
  transport.setDebug?.(debugEnabled);

  function applyDebug(enabled) {
    debugEnabled = !!enabled;
    try {
      window.localStorage.setItem("LUX_STREAM_DEBUG", debugEnabled ? "1" : "0");
    } catch {}

    // keep store in sync (health.debug)
    const prev = store.getState()?.connection?.health || {};
    store.dispatch({
      type: ACTIONS.CONNECTION_SET,
      connection: { health: { ...prev, debug: debugEnabled } },
    });

    transport.setDebug?.(debugEnabled);

    // Prod gating: hide Health unless debug is on
    const show = IS_DEV || debugEnabled;
    if (refs.healthDetails) refs.healthDetails.hidden = !show;
    if (refs.debugToggle) refs.debugToggle.checked = debugEnabled;
  }

  if (refs.debugToggle) {
    refs.debugToggle.addEventListener("change", () => {
      applyDebug(!!refs.debugToggle.checked);
    });
  }

  // ✅ Secret admin hotkey (works in prod): Ctrl+Alt+D toggles debug + reveals Health
  window.addEventListener("keydown", (e) => {
    if (!e.ctrlKey || !e.altKey) return;
    const k = String(e.key || "").toLowerCase();
    if (k !== "d") return;
    applyDebug(!debugEnabled);
    if (refs.healthDetails && (IS_DEV || !refs.healthDetails.hidden)) {
      refs.healthDetails.open = true;
    }
  });

  // Only use blob-based PTT audio in websocket mode.
  const audio =
    (route?.transport || "") === "websocket"
      ? createAudioController({ store, route, transport })
      : { start() {}, stop() {}, dispose() {} };

  // Session runtime
  let timerId = null;
  let remaining = 0;

  function presetToCaps(durationSec) {
    const d = Number(durationSec || 300);
    if (d <= 150) return { durationSec: 150, turnCap: 6 };
    if (d >= 450) return { durationSec: 450, turnCap: 15 };
    return { durationSec: 300, turnCap: 10 };
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function startTimer(totalSec) {
    stopTimer();
    remaining = Math.max(1, Number(totalSec || 150));

    store.dispatch({
      type: ACTIONS.SESSION_SET,
      session: { durationSec: remaining, remainingSec: remaining, running: true },
    });

    timerId = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      store.dispatch({ type: ACTIONS.SESSION_TICK, remainingSec: remaining });

      if (remaining <= 0) {
        stopTimer();
        store.dispatch({ type: ACTIONS.SESSION_SET, session: { running: false } });
      }
    }, 1000);
  }

  // --- wire UI intents ---
  async function softResetConnect({ retryOnce = true } = {}) {
    try { await transport.disconnect(); } catch (_) {}
    await new Promise((r) => setTimeout(r, 150));
    try {
      await transport.connect();
    } catch (e1) {
      if (!retryOnce) throw e1;
      await new Promise((r) => setTimeout(r, 400));
      await transport.connect();
    }
  }

  refs.connectBtn.addEventListener("click", async () => {
    const st = store.getState().connection.status;
    if (st === "live") {
      transport.disconnect();
      return;
    }
    if (st === "connecting") return;
    try {
      await softResetConnect({ retryOnce: true });
    } catch (err) {
      console.error(err);
    }
  });

  refs.reconnectBtn?.addEventListener("click", async () => {
    const st = store.getState().connection.status;
    if (st === "connecting") return;
    try {
      await softResetConnect({ retryOnce: true });
    } catch (err) {
      console.error(err);
    }
  });

  refs.clearBtn.addEventListener("click", () => {
    store.dispatch({ type: ACTIONS.THREAD_CLEAR });
  });

  refs.sendBtn.addEventListener("click", () => {
    const val = (refs.textInput.value || "").trim();
    if (!val) return;

    refs.textInput.value = "";

    const st = store.getState().connection.status;
    if (st === "live") transport.sendUserText(val);
  });

  refs.textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") refs.sendBtn.click();
  });

  refs.getReplyBtn?.addEventListener("click", () => {
    const st = store.getState().connection.status;
    const r = store.getState().route || {};
    if (st === "live" && (r.input || "tap") === "tap") transport.requestReply?.();
  });

  function setMode(mode) {
    const m = mode === "auto" ? "auto" : "tap";
    store.dispatch({ type: ACTIONS.ROUTE_PATCH, patch: { input: m } });
    if (store.getState().connection.status === "live") {
      transport.setInputMode?.(m);
    }
  }

  refs.tapBtn?.addEventListener("click", () => setMode("tap"));
  refs.autoBtn?.addEventListener("click", () => setMode("auto"));

  refs.stopBtn?.addEventListener("click", () => {
    const st = store.getState().connection.status;
    if (st === "live") transport.stopSpeaking?.();
  });

  // Duration preset (applies next session; disabled while live)
  refs.durationSel?.addEventListener("change", () => {
    const sec = Number(refs.durationSel.value || 300);
    const caps = presetToCaps(sec);
    store.dispatch({
      type: ACTIONS.SESSION_SET,
      session: { ...caps, remainingSec: caps.durationSec, turnsUsed: 0 },
    });
    store.dispatch({
      type: ACTIONS.ROUTE_PATCH,
      patch: { durationSec: caps.durationSec, turnCap: caps.turnCap },
    });
  });

  // Modal buttons
  refs.discardBtn?.addEventListener("click", () => {
    store.dispatch({ type: ACTIONS.SESSION_MODAL_SET, open: false });
    store.dispatch({ type: ACTIONS.THREAD_CLEAR });
  });

  refs.saveBtn?.addEventListener("click", async () => {
    try {
      const uid = ensureUID();
      const st = store.getState();
      const turns = Array.isArray(st.thread?.turns) ? st.thread.turns : [];
      const transcript = turns
        .filter((t) => t && t.kind === "text" && t.text)
        .map((t) => `${t.role === "user" ? "User" : "Lux"}: ${t.text}`)
        .join("\n");

      const passageKey = `stream:${Date.now()}`;
      await saveAttempt({
        uid,
        passageKey,
        partIndex: 0,
        text: transcript,
        azureResult: null,
        l1: null,
        sessionId: passageKey,
        summary: {
          headline: "Streaming — Flow under time",
          durationSec: st.session?.durationSec,
          turnsUsed: st.session?.turnsUsed,
          endReason: st.session?.endReason,
          meta: { mode: "streaming" },
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      store.dispatch({ type: ACTIONS.SESSION_MODAL_SET, open: false });
    }
  });

  // Start audio listeners (push-to-talk)
  audio.start();

  // Render loop
  const render = () => renderStreaming({ state: store.getState(), refs });
  store.subscribe(render);
  render();

  // ---- SAFE connection watcher (prevents stack overflow) ----
  let lastConn = store.getState().connection.status;
  let connTaskQueued = false;

  store.subscribe((state, action) => {
    if (action?.type !== ACTIONS.CONNECTION_SET) return;

    // coalesce: never dispatch inside the same call stack as the triggering dispatch
    if (connTaskQueued) return;
    connTaskQueued = true;

    queueMicrotask(() => {
      connTaskQueued = false;

      const cur = store.getState().connection.status;
      const prev = lastConn;
      lastConn = cur;

      if (cur === "live" && prev !== "live") {
        const sess = store.getState().session || {};
        const caps = presetToCaps(
          Number(sess.durationSec || store.getState().route?.durationSec || 300)
        );
        store.dispatch({
          type: ACTIONS.SESSION_SET,
          session: { ...caps, remainingSec: caps.durationSec, turnsUsed: 0 },
        });
        startTimer(caps.durationSec);
        transport.setInputMode?.(store.getState().route?.input || "tap");
      }

      if (cur !== "live" && prev === "live") {
        stopTimer();
        store.dispatch({ type: ACTIONS.SESSION_RESET });
      }
    });
  });

  // If session ended while live, disconnect and show modal (already opened by reducer)
  store.subscribe(() => {
    const st = store.getState();
    const conn = st.connection.status;
    const sess = st.session || {};
    if (conn === "live" && sess.ended) {
      try {
        transport.disconnect();
      } catch (_) {}
    }
  });

  // Safety: cleanup on hard navigation away
  window.addEventListener("beforeunload", () => {
    try {
      audio.dispose();
    } catch (_) {}
    try {
      transport.disconnect();
    } catch (_) {}
    try {
      stopTimer();
    } catch (_) {}
  });
}
