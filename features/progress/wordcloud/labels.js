// features/progress/wordcloud/labels.js

export function rangeLabel(r) {
  if (r === "today") return "Today";
  if (r === "7d") return "7 days";
  if (r === "30d") return "30 days";
  if (r === "timeline") return "Timeline";
  return "All time";
}

export function sortLabel(s) {
  if (s === "freq") return "Frequent";
  if (s === "diff") return "Difficult";
  if (s === "recent") return "Recent";
  if (s === "persist") return "Persistent";
  return "Priority";
}

export function mixLabel(m) {
  return m === "smart" ? "Smart Mix" : "View-based";
}
