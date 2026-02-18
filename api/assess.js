// api/assess.js  (frontend helper)
import { API_BASE, dbg, jsonOrThrow, getAdminToken } from "./util.js";
import AudioInspector from "../features/recorder/audio-inspector.js";

const ASSESS_URL = `${API_BASE}/api/assess`;

export async function assessPronunciation({ audioBlob, text, firstLang }) {
  const t = (text ?? "").trim();
  const audioBytes = audioBlob?.size ?? 0;

  // --- Front-end guard: skip if no audio (type-only sends, etc.)
  if (!audioBlob || audioBytes === 0) {
    dbg("SKIP", ASSESS_URL, { reason: "no_audio", textLen: t.length });
    return null; // keep it simple: "no assessment"
  }

  // In dev the Vite proxy injects x-admin-token automatically.
  // In build/preview there is no proxy, so we must attach it ourselves.
  const token = getAdminToken({
    promptIfMissing: !import.meta.env.DEV,
    promptLabel: "Admin Token required for Recording Assessment",
  });

  const fd = new FormData();
  fd.append("audio", audioBlob, "recording.webm");
  fd.append("text", t);
  if (firstLang) fd.append("firstLang", firstLang);

  dbg("POST", ASSESS_URL, { audioBytes, textLen: t.length, firstLang });

  // ✅ Inspector: note upload details right before fetch
  AudioInspector.noteUpload({
    endpoint: ASSESS_URL,
    name: "recording.webm",
    blob: audioBlob,
    text: t,
  });

  const resp = await fetch(ASSESS_URL, {
    method: "POST",
    body: fd,
    headers: token ? { "x-admin-token": token } : undefined,
  });
  return jsonOrThrow(resp);
}