// features/my-words/panel-utils.js

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function relTime(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const d = Date.now() - t;

  const sec = Math.floor(d / 1000);
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function openWordReference(text) {
  const q = String(text || "").trim();
  if (!q) return;
  const url = `https://www.wordreference.com/definition/${encodeURIComponent(q)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// ✅ 1) Youglish helper
export function openYouglish(text) {
  const q = String(text || "").trim();
  if (!q) return;
  const url = `https://youglish.com/pronounce/${encodeURIComponent(q)}/english`;
  window.open(url, "_blank", "noopener,noreferrer");
}
