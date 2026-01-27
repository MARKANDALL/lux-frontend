// features/my-words/panel-data.js

import { applyMyWordsStats } from "./stats.js";
import { normalizeText } from "./normalize.js";

export function computeCountsAll(store) {
  const all = store.getState().entries || [];
  const activeTotal = all.filter((e) => !e.archived).length;
  const archivedTotal = all.filter((e) => !!e.archived).length;
  return { activeTotal, archivedTotal, total: all.length };
}

export function getCompactActiveList(store, getAttempts) {
  const attempts = (typeof getAttempts === "function" ? getAttempts() : []) || [];

  // ✅ Compact list:
  // visibleEntries() already excludes archived + respects store query
  const list = store.visibleEntries();
  return applyMyWordsStats(list, attempts);
}

export function getLibraryArchivedList(store, getAttempts) {
  const attempts = (typeof getAttempts === "function" ? getAttempts() : []) || [];

  const all = store.getState().entries || [];
  const q = normalizeText(store.getState().query || "");

  const archived = all
    .filter((e) => !!e.archived)
    .filter((e) => (q ? normalizeText(e.text).includes(q) : true));

  return applyMyWordsStats(archived, attempts);
}
