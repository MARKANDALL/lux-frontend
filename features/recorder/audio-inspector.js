// features/recorder/audio-inspector.js
// Tiny Audio Pipeline Inspector (Lux)
// Enable with:  ?audioDebug=1
// or in console: localStorage.setItem("luxAudioInspector","1"); location.reload();

const LS_KEY = "luxAudioInspector";

function isEnabled() {
  try {
    const qs = new URLSearchParams(location.search);
    if (qs.has("audioDebug")) return true;
    return localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

function fmtBytes(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num) || num <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = num;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

async function probeBlobDurationSeconds(blob) {
  // Uses <audio> metadata (works reliably with webm/opus)
  try {
    return await new Promise((resolve) => {
      const el = document.createElement("audio");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        const d = Number(el.duration);
        try { URL.revokeObjectURL(el.src); } catch {}
        resolve(Number.isFinite(d) ? d : null);
      };
      el.onerror = () => {
        try { URL.revokeObjectURL(el.src); } catch {}
        resolve(null);
      };
      el.src = URL.createObjectURL(blob);
    });
  } catch {
    return null;
  }
}

function safeJson(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

function clampStr(s, max = 140) {
  const x = String(s || "");
  return x.length <= max ? x : x.slice(0, max - 1) + "…";
}

function supportedMimeSnapshot() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
  ];

  const out = {};
  if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== "function") {
    out._mediaRecorder = "missing";
    return out;
  }

  for (const t of types) out[t] = MediaRecorder.isTypeSupported(t);
  return out;
}

function ensureCss() {
  if (document.getElementById("luxAudioInspectorCSS")) return;

  const style = document.createElement("style");
  style.id = "luxAudioInspectorCSS";
  style.textContent = `
  .lux-audio-inspector {
    position: fixed;
    right: 14px;
    bottom: 14px;
    width: min(440px, calc(100vw - 28px));
    max-height: min(62vh, 520px);
    overflow: hidden;
    z-index: 999999;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(15, 23, 42, 0.86);
    box-shadow: 0 16px 40px rgba(0,0,0,0.40);
    backdrop-filter: blur(14px);
    color: rgba(255,255,255,0.92);
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }
  .lux-audio-inspector * { box-sizing: border-box; }
  .lux-audio-inspector__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }
  .lux-audio-inspector__title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    opacity: 0.95;
  }
  .lux-audio-inspector__btns {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lux-audio-inspector__btn {
    font-size: 12px;
    padding: 6px 9px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.92);
    cursor: pointer;
  }
  .lux-audio-inspector__btn:hover {
    background: rgba(255,255,255,0.10);
  }
  .lux-audio-inspector__body {
    padding: 10px 12px;
    overflow: auto;
    max-height: calc(min(62vh, 520px) - 46px);
  }
  .lux-audio-inspector__pre {
    margin: 0;
    font-size: 11px;
    line-height: 1.25rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
  `;
  document.head.appendChild(style);
}

function ensurePanel() {
  let root = document.getElementById("luxAudioInspector");
  if (root) return root;

  ensureCss();

  root = document.createElement("div");
  root.id = "luxAudioInspector";
  root.className = "lux-audio-inspector";
  root.innerHTML = `
  <div class="lux-audio-inspector__top">
    <div class="lux-audio-inspector__title">🎙️ Audio Pipeline Inspector</div>
    <div class="lux-audio-inspector__btns">
      <button class="lux-audio-inspector__btn" data-act="mode">Mode: ?</button>
      <button class="lux-audio-inspector__btn" data-act="copy">Copy</button>
      <button class="lux-audio-inspector__btn" data-act="hide">Hide</button>
    </div>
  </div>
  <div class="lux-audio-inspector__body">
    <pre class="lux-audio-inspector__pre" id="luxAudioInspectorPre"></pre>
  </div>
`;

  root.querySelector('[data-act="hide"]')?.addEventListener("click", () => {
    root.remove();
  });

  root.querySelector('[data-act="copy"]')?.addEventListener("click", async () => {
    const pre = root.querySelector("#luxAudioInspectorPre");
    const text = pre?.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  });

  root.querySelector('[data-act="mode"]')?.addEventListener("click", () => {
    const cur = (localStorage.getItem("luxAudioMode") || "normal").toLowerCase();
    const next = cur === "pro" ? "normal" : "pro";
    localStorage.setItem("luxAudioMode", next);

    // ✅ Reload so next getUserMedia uses new constraints
    location.reload();
  });

  document.body.appendChild(root);
  return root;
}

const state = {
  enabled: false,
  // last stream/recorder info
  scope: null, // "practice" | "convo"
  device: null,
  trackSettings: null,
  trackConstraints: null,
  recorderMimeType: null,
  // last blob
  blobType: null,
  blobSize: null,
  blobDuration: null,
  // last upload
  uploadEndpoint: null,
  uploadName: null,
  uploadType: null,
  uploadSize: null,
  uploadTextLen: null,
  // constants (backend policy)
  backendConversion: {
    from: "audio/webm (MediaRecorder blob)",
    to: "audio/wav PCM s16 16kHz mono (ffmpeg: -ar 16000 -ac 1 -f wav -sample_fmt s16)",
    azureHeader: "Content-Type: audio/wav; codecs=audio/pcm; samplerate=16000",
    granularity: "Phoneme (Pronunciation-Assessment header)",
  },
};

function render() {
  if (!state.enabled) return;

  const root = ensurePanel();
  const pre = root.querySelector("#luxAudioInspectorPre");
  if (!pre) return;

  const mode = (localStorage.getItem("luxAudioMode") || "normal").toLowerCase() === "pro"
    ? "pro"
    : "normal";

  const modeBtn = root.querySelector('[data-act="mode"]');
  if (modeBtn) modeBtn.textContent = `Mode: ${mode.toUpperCase()}`;

  const lines = [];

  lines.push(`Scope: ${state.scope || "-"}`);
  lines.push(`Audio Mode: ${mode.toUpperCase()}`);
  lines.push("");
  lines.push(`Page: ${clampStr(location.pathname + location.search, 120)}`);
  lines.push(`UA: ${clampStr(navigator.userAgent, 180)}`);
  lines.push("");

  lines.push("== Browser Recording (source) ==");
  lines.push(`MediaRecorder: ${window.MediaRecorder ? "yes" : "no"}`);
  lines.push(`Recorder mimeType: ${state.recorderMimeType || "-"}`);
  lines.push("Supported mimeTypes:");
  lines.push(safeJson(supportedMimeSnapshot()));
  lines.push("");

  lines.push("== Microphone / Track ==");
  lines.push(`Device: ${state.device || "-"}`);
  lines.push("Track settings:");
  lines.push(state.trackSettings ? safeJson(state.trackSettings) : "-");
  lines.push("Track constraints:");
  lines.push(state.trackConstraints ? safeJson(state.trackConstraints) : "-");
  lines.push("");

  lines.push("== Last Captured Blob (what you recorded) ==");
  lines.push(`Blob type: ${state.blobType || "-"}`);
  lines.push(`Blob size: ${state.blobSize != null ? fmtBytes(state.blobSize) : "-"}`);
  lines.push(`Blob duration: ${state.blobDuration != null ? `${state.blobDuration.toFixed(2)}s` : "-"}`);
  lines.push("");

  lines.push("== Upload (what you send to backend) ==");
  lines.push(`Endpoint: ${state.uploadEndpoint || "-"}`);
  lines.push(`Name: ${state.uploadName || "-"}`);
  lines.push(`Type: ${state.uploadType || "-"}`);
  lines.push(`Size: ${state.uploadSize != null ? fmtBytes(state.uploadSize) : "-"}`);
  lines.push(`Text length: ${state.uploadTextLen != null ? state.uploadTextLen : "-"}`);
  lines.push("");

  lines.push("== Backend Conversion (what Azure receives) ==");
  lines.push(`Convert: ${state.backendConversion.from}`);
  lines.push(`      -> ${state.backendConversion.to}`);
  lines.push(`Azure:  ${state.backendConversion.azureHeader}`);
  lines.push(`Assess: ${state.backendConversion.granularity}`);
  lines.push("");

  pre.textContent = lines.join("\n");
}

async function inferDeviceLabel(stream) {
  try {
    const track = stream?.getAudioTracks?.()?.[0];
    if (!track) return null;

    // Track label is often the nicest
    if (track.label) return track.label;

    // fallback: enumerate devices and match deviceId
    const settings = track.getSettings?.() || {};
    const deviceId = settings.deviceId;
    if (!deviceId || !navigator.mediaDevices?.enumerateDevices) return null;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hit = devices.find(d => d.kind === "audioinput" && d.deviceId === deviceId);
    return hit?.label || null;
  } catch {
    return null;
  }
}

const AudioInspector = {
  enable() {
    state.enabled = true;
    try { localStorage.setItem(LS_KEY, "1"); } catch {}
    render();
  },

  disable() {
    state.enabled = false;
    try { localStorage.removeItem(LS_KEY); } catch {}
    const el = document.getElementById("luxAudioInspector");
    if (el) el.remove();
  },

  init() {
    state.enabled = isEnabled();
    if (state.enabled) render();
  },

  // Call this when you have the stream
  async noteStream(stream, scope = null) {
    if (!state.enabled) return;
    state.scope = scope || state.scope || "-";

    try {
      const track = stream?.getAudioTracks?.()?.[0];
      state.trackSettings = track?.getSettings?.() || null;
      state.trackConstraints = track?.getConstraints?.() || null;
      state.device = await inferDeviceLabel(stream);
    } catch {
      // ignore
    }

    render();
  },

  // Call this when you create MediaRecorder
  noteRecorder(recorder) {
    if (!state.enabled) return;
    try {
      state.recorderMimeType = recorder?.mimeType || null;
    } catch {
      // ignore
    }
    render();
  },

  // Call this when recording stops and you create the blob
  async noteBlob(blob) {
    if (!state.enabled) return;
    try {
      state.blobType = blob?.type || null;
      state.blobSize = blob?.size ?? null;
      state.blobDuration = await probeBlobDurationSeconds(blob);
    } catch {
      // ignore
    }
    render();
  },

  // Call this where you upload the blob
  noteUpload({ endpoint, name, blob, text }) {
    if (!state.enabled) return;
    try {
      state.uploadEndpoint = endpoint || null;
      state.uploadName = name || null;
      state.uploadType = blob?.type || null;
      state.uploadSize = blob?.size ?? null;
      state.uploadTextLen = typeof text === "string" ? text.length : null;
    } catch {
      // ignore
    }
    render();
  },
};

// Auto-init on import
try { AudioInspector.init(); } catch {}

export default AudioInspector;
