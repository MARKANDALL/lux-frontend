// api/assess.js
import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const ASSESS_URL = `${API_BASE}/api/assess`;

export async function assessPronunciation({ audioBlob, text, firstLang }) {
  const fd = new FormData();
  fd.append("audio", audioBlob, "recording.wav");
  fd.append("text", text ?? "");
  if (firstLang) fd.append("firstLang", firstLang);

  dbg("POST", ASSESS_URL, { textLen: (text || "").length, firstLang });
  const resp = await fetch(ASSESS_URL, { method: "POST", body: fd });
  return jsonOrThrow(resp);
}
