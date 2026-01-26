// features/features/selfpb/download-latest.js

export function initLatestDownload(ui) {
  // ✅ Download Latest Recording button wiring
  const dlBtn = ui.dlBtn;
  let _lastBlob = null;
  let _lastMeta = null;

  function extFromBlob(blob) {
    const t = blob?.type || "";
    if (t.includes("wav")) return "wav";
    if (t.includes("webm")) return "webm";
    if (t.includes("ogg")) return "ogg";
    return "audio";
  }

  function downloadBlob(blob, meta) {
    if (!blob) return;

    const mode = (meta?.mode || "normal").toLowerCase();
    const ts = new Date(meta?.ts || Date.now())
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    const ext = extFromBlob(blob);
    const name = `lux-recording_${mode}_${ts}.${ext}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function setLatest(blob, meta) {
    _lastBlob = blob || null;
    _lastMeta = meta || null;

    if (dlBtn) {
      dlBtn.disabled = !_lastBlob;
      dlBtn.title = _lastBlob
        ? "Download your latest recording"
        : "Record something first";
    }
  }

  if (dlBtn) {
    dlBtn.addEventListener("click", () => {
      if (!_lastBlob) return;
      downloadBlob(_lastBlob, _lastMeta);
    });
  }

  // Pull from global if it exists already
  if (window.LuxLastRecordingBlob) {
    setLatest(window.LuxLastRecordingBlob, window.LuxLastRecordingMeta || null);
  }

  // Listen for new recordings
  window.addEventListener("lux:lastRecording", (e) => {
    setLatest(e?.detail?.blob, e?.detail?.meta || null);
  });
}
