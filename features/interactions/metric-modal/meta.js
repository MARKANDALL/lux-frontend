// features/interactions/metric-modal/meta.js
// Shared metadata and HTML escaping utilities for metric modal rendering.

export const METRIC_META = {
  Overall: {
    title: "Overall",
    blurb:
      "Your overall score is an aggregate of the five core categories below. It gives a quick summary of this attempt.",
  },
  Pronunciation: {
    title: "Pronunciation",
    blurb: "A high-level pronunciation score based on how accurately you produced the expected sounds overall.",
  },
  Accuracy: {
    title: "Accuracy",
    blurb: "How close your pronunciation was to the expected target sounds (segment-by-segment accuracy).",
  },
  Fluency: {
    title: "Fluency",
    blurb: "How smooth and natural your speech flow was—often affected by pausing, stopping, and restarts.",
  },
  Completeness: {
    title: "Completeness",
    blurb: "Whether you said all the words from the reference (and whether anything was skipped or extra).",
  },
  Prosody: {
    title: "Prosody",
    blurb: "Stress, rhythm, intonation, and pacing — how your speech “sounds as a whole,” not just individual sounds.",
  },
};

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
