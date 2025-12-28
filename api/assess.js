// api/assess.js  (frontend helper)
import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const ASSESS_URL = `${API_BASE}/api/assess`;

export async function assessPronunciation({ audioBlob, text, firstLang }) {
  const t = (text ?? "").trim();
  const audioBytes = audioBlob?.size ?? 0;

  // --- Front-end guard: skip if no audio (type-only sends, etc.)
  if (!audioBlob || audioBytes === 0) {
    dbg("SKIP", ASSESS_URL, { reason: "no_audio", textLen: t.length });
    return null; // keep it simple: "no assessment"
  }

  const fd = new FormData();
  fd.append("audio", audioBlob, "recording.webm");
  fd.append("text", t);
  if (firstLang) fd.append("firstLang", firstLang);

  dbg("POST", ASSESS_URL, { audioBytes, textLen: t.length, firstLang });
  const resp = await fetch(ASSESS_URL, { method: "POST", body: fd });
  return jsonOrThrow(resp);
}
