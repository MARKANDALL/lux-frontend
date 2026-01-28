// features/streaming/app.js
import { parseStreamRoute } from "./router.js";
import { createStore } from "./state/store.js";
import { createInitialState, reducer, ACTIONS } from "./state/schema.js";

import { buildStreamingDOM } from "./ui/dom.js";
import { renderStreaming } from "./ui/render.js";

import { createTransportController } from "./transport/transport-controller.js";
import { createAudioController } from "./audio/audio-controller.js";

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

  // Controllers
  const transport = createTransportController({ store, route });
  const audio = createAudioController({ store, route, transport });

  // --- wire UI intents ---
  refs.connectBtn.addEventListener("click", () => {
    const st = store.getState().connection.status;
    if (st === "live") transport.disconnect();
    else transport.connect();
  });

  refs.clearBtn.addEventListener("click", () => {
    store.dispatch({ type: ACTIONS.THREAD_CLEAR });
  });

  refs.sendBtn.addEventListener("click", () => {
    const val = (refs.textInput.value || "").trim();
    if (!val) return;

    const id = `u_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    store.dispatch({
      type: ACTIONS.THREAD_ADD_TURN,
      turn: { id, role: "user", kind: "text", text: val, ts: Date.now() },
    });
    refs.textInput.value = "";

    const st = store.getState().connection.status;
    if (st === "live") transport.sendUserText(val);
  });

  refs.textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") refs.sendBtn.click();
  });

  // Start audio listeners (push-to-talk)
  audio.start();

  // Render loop
  const render = () => renderStreaming({ state: store.getState(), refs });
  store.subscribe(render);
  render();

  // Safety: cleanup on hard navigation away
  window.addEventListener("beforeunload", () => {
    try {
      audio.dispose();
    } catch (_) {}
    try {
      transport.disconnect();
    } catch (_) {}
  });
}
