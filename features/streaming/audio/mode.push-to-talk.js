// features/streaming/audio/mode.push-to-talk.js
// Spacebar hold-to-talk (lowest complexity, highest control)

export function createPushToTalkMode({ onUtterance, onState, onError } = {}) {
  let stream = null;
  let rec = null;
  let chunks = [];
  let isDown = false;

  async function ensureStream() {
    if (stream) return stream;
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error("getUserMedia not supported in this browser");
    }
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    return stream;
  }

  async function startRecording() {
    await ensureStream();

    chunks = [];
    rec = new MediaRecorder(stream);

    rec.ondataavailable = (e) => {
      if (e?.data && e.data.size) chunks.push(e.data);
    };

    rec.onstop = () => {
      try {
        const mimeType = rec?.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        onUtterance?.(blob, { mimeType });
      } catch (err) {
        onError?.(err);
      }
    };

    rec.start();
    onState?.("recording");
  }

  function stopRecording() {
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch (_) {}
    }
    rec = null;
    onState?.("idle");
  }

  function onKeyDown(e) {
    if (e.code !== "Space") return;
    if (e.repeat) return;

    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    e.preventDefault();
    if (isDown) return;
    isDown = true;

    startRecording().catch((err) => {
      isDown = false;
      onError?.(err);
    });
  }

  function onKeyUp(e) {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (!isDown) return;
    isDown = false;
    stopRecording();
  }

  function start() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    onState?.("idle");
  }

  function stop() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    if (isDown) {
      isDown = false;
      stopRecording();
    }
  }

  function dispose() {
    stop();
    if (stream) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
      stream = null;
    }
  }

  return { id: "ptt", start, stop, dispose };
}
