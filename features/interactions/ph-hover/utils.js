// features/interactions/ph-hover/utils.js
// Tiny pure helpers for the phoneme hover tooltip system.

export function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, (tag) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }[tag])
  );
}
