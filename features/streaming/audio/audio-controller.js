// features/streaming/audio/audio-controller.js
import { ACTIONS } from "../state/schema.js";
import { createPushToTalkMode } from "./mode.push-to-talk.js";

function makeMode({ input, handlers }) {
  const id = String(input || "").toLowerCase();
  if (id === "ptt" || id === "push-to-talk") return createPushToTalkMode(handlers);
  // Future: vad, duplex
  return createPushToTalkMode(handlers);
}

export function createAudioController({ store, route, transport }) {
  // WebRTC transport uses live mic tracks (not recorded blobs).
  // Until Tap/Auto (event-driven) is implemented, disable blob-based PTT to avoid errors.
  if (String(route?.transport || "").toLowerCase() === "webrtc") {
    return {
      start() {
        store.dispatch({ type: ACTIONS.TURN_PHASE_SET, turn: { phase: "idle" } });
      },
      stop() {},
      dispose() {},
    };
  }

  const mode = makeMode({
    input: route?.input,
    handlers: {
      onState: (phase) =>
        store.dispatch({ type: ACTIONS.TURN_PHASE_SET, turn: { phase } }),
      onError: (err) => {
        console.error(err);
        store.dispatch({
          type: ACTIONS.CONNECTION_SET,
          connection: { status: "error", error: err?.message || String(err) },
        });
      },
      onUtterance: async (blob, meta) => {
        const id = `u_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        store.dispatch({
          type: ACTIONS.THREAD_ADD_TURN,
          turn: {
            id,
            role: "user",
            kind: "audio",
            text: "",
            ts: Date.now(),
            audio: {
              mimeType: meta?.mimeType || blob?.type || "audio/webm",
              size: blob?.size || 0,
            },
          },
        });

        const status = store.getState().connection.status;
        if (status === "live") {
          store.dispatch({
            type: ACTIONS.TURN_PHASE_SET,
            turn: { phase: "sending", activeTurnId: id },
          });
          await transport.sendUserAudio(blob);
          store.dispatch({
            type: ACTIONS.TURN_PHASE_SET,
            turn: { phase: "idle", activeTurnId: null },
          });
        }
      },
    },
  });

  function start() {
    mode.start();
  }
  function stop() {
    mode.stop();
  }
  function dispose() {
    mode.dispose?.();
  }

  return { start, stop, dispose };
}
