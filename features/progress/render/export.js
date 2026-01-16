// features/progress/render/export.js
// CSV / downloadBlob / exporting lives here.
// features/progress/render/export.js

import { titleFromPassageKey } from "./format.js";

export function downloadBlob(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function attemptsToCSV(attempts = []) {
  const header = ["date", "source", "activity", "score", "text", "sessionId", "id"];
  const rows = attempts.map((a) => {
    const ts = a.ts || a.created_at || a.createdAt || "";
    const pk = a.passage_key || a.passageKey || "";
    const src = String(pk).startsWith("convo:") ? "AI Conversations" : "Pronunciation";
    const activity = titleFromPassageKey(pk);
    const score = Math.round(
      a.summary?.pron != null ? a.summary.pron : a.azureResult?.NBest?.[0]?.PronScore || 0
    );
    const text = String(a.text || "").replace(/\s+/g, " ").trim();
    const sid = a.session_id || a.sessionId || "";
    const id = a.id || "";
    const safe = (x) => `"${String(x ?? "").replaceAll('"', '""')}"`;
    return [safe(ts), safe(src), safe(activity), safe(score), safe(text), safe(sid), safe(id)].join(
      ","
    );
  });
  return [header.join(","), ...rows].join("\n");
}
