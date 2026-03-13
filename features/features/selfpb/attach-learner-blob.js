// features/features/selfpb/attach-learner-blob.js
// One-line: Pure helper for attaching the latest learner recording blob into SelfPB audio and waveform state.

export function attachLearnerBlobToAudio({
  audioEl,
  blob,
  loadLearnerBlob,
  createObjectURL = (x) => URL.createObjectURL(x),
  revokeObjectURL = (x) => URL.revokeObjectURL(x),
  warn = globalThis.warnSwallow,
} = {}) {
  if (!blob || !audioEl) return null;

  try {
    const prev = audioEl?.dataset?.luxBlobUrl;
    if (prev && String(prev).startsWith("blob:")) revokeObjectURL(prev);
  } catch (err) {
    warn?.("features/features/selfpb/attach-learner-blob.js", err, "important");
  }

  let url = null;
  try {
    if (!audioEl.dataset) audioEl.dataset = {};
    url = createObjectURL(blob);
    audioEl.dataset.luxBlobUrl = url;
    audioEl.src = url;
    try {
      audioEl.load?.();
    } catch (err) {
      warn?.("features/features/selfpb/attach-learner-blob.js", err, "important");
    }
  } catch (err) {
    warn?.("features/features/selfpb/attach-learner-blob.js", err, "important");
  }

  try {
    loadLearnerBlob?.(blob);
  } catch (err) {
    warn?.("features/features/selfpb/attach-learner-blob.js", err, "important");
  }

  return url;
}