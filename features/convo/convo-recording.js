// features/convo/convo-recording.js
import { buildAudioConstraints } from "../recorder/audio-mode.js";
import AudioInspector from "../recorder/audio-inspector.js";

export function createConvoRecording({ state }) {
  // --- Recording helpers ---
  async function startRecording() {
    state.chunks = [];

    state.stream = await navigator.mediaDevices.getUserMedia(buildAudioConstraints());

    // ✅ Inspector: note stream immediately (convo context)
    await AudioInspector.noteStream(state.stream, "convo");

    const prefer = ["audio/webm;codecs=opus", "audio/webm"];
    let opts = {};
    try {
      for (const t of prefer) {
        if (window.MediaRecorder?.isTypeSupported?.(t)) {
          opts.mimeType = t;
          break;
        }
      }
    } catch {}

    state.recorder = new MediaRecorder(state.stream, opts);

    // ✅ Inspector: note recorder right after creation
    AudioInspector.noteRecorder(state.recorder);

    state.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) state.chunks.push(e.data);
    };

    state.recorder.start();
  }

  async function stopRecordingAndGetBlob() {
    return new Promise((resolve) => {
      if (!state.recorder) return resolve(null);

      const rec = state.recorder;
      rec.onstop = () => {
        try {
          state.stream?.getTracks()?.forEach((t) => t.stop());
        } catch (_) {}
        state.stream = null;

        const blob = new Blob(state.chunks, { type: rec.mimeType || "audio/webm" });

        // ✅ Inspector: note final blob right after creation
        AudioInspector.noteBlob(blob);

        state.chunks = [];
        state.recorder = null;
        resolve(blob);
      };

      rec.stop();
    });
  }

  return { startRecording, stopRecordingAndGetBlob };
}
