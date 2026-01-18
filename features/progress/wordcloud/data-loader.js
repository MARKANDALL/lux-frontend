/**
 * features/progress/wordcloud/data-loader.js
 *
 * Commit 15: "The API Wrapper"
 * Isolates communication with backend and refresh scheduling.
 *
 * Owns:
 * - ensureData(force) -> fetches attempts via uid and mutates stable attemptsAll ref
 * - startAutoRefresh({ rootId, onRefresh, intervalMs }) -> periodically triggers redraw
 */

import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";

export const DEFAULT_AUTO_REFRESH_MS = 10 * 60 * 1000;

export function createWordcloudDataLoader({ attemptsAll }) {
  if (!attemptsAll) throw new Error("[wc/data] attemptsAll is required");

  /**
   * ✅ MINIMAL FIX (ONLY HERE)
   * Mutate the existing attemptsAll array so render.js always sees the same reference.
   */
  async function ensureData(force = false) {
    if (attemptsAll.length && !force) return;

    const uid = ensureUID();
    const next = await fetchHistory(uid);

    attemptsAll.length = 0;
    attemptsAll.push(...(next || []));

    console.log(
      "[wc] history attempts:",
      attemptsAll?.length,
      attemptsAll?.[0]
    );
  }

  /**
   * Periodically refresh the view (draw) if the page is still mounted.
   * Returns a stop() function.
   */
  function startAutoRefresh({
    rootId,
    onRefresh,
    intervalMs = DEFAULT_AUTO_REFRESH_MS,
  }) {
    if (!rootId) throw new Error("[wc/data] startAutoRefresh requires rootId");
    if (typeof onRefresh !== "function")
      throw new Error("[wc/data] startAutoRefresh requires onRefresh()");

    const timer = setInterval(() => {
      if (document.getElementById(rootId)) onRefresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }

  return {
    ensureData,
    startAutoRefresh,
  };
}
