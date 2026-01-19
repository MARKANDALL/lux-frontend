/**
 * features/progress/wordcloud/view-logic.js
 *
 * Commit 13: "The Data Engine"
 * Owns how we compute and sort items for the current cloud view.
 *
 * index.js should NOT care how sorting works (priority/persistence/recent/etc).
 * index.js simply asks: "Given attemptsInRange + current state, give me items."
 */

import { computeRollups } from "../rollups.js";
import {
  lower,
  idFromItem,
  computeLastSeenMap,
  persistentScore,
} from "./compute.js";

const POOL_MAX = 140; // was 60 (lets topN expand without starving the pool)

/**
 * Compute items for the current view:
 * - builds rollup model from attemptsInRange
 * - selects trouble words/phonemes pool
 * - attaches lastSeenTS
 * - sorts by state.sort
 * - applies query reorder (hits first)
 * - returns top N
 */
export function computeItemsForView({ attemptsInRange, state, ctx, topN = 20 }) {
  const model = computeRollups(attemptsInRange);
  ctx?.setLastModel?.(model);

  const raw =
    state.mode === "phonemes"
      ? model?.trouble?.phonemesAll || []
      : model?.trouble?.wordsAll || [];

  // pool for smartMix + better candidate recall
  let pool = raw.slice(0, POOL_MAX);

  const ids = pool.map((x) => idFromItem(state.mode, x));

  const lastSeen = computeLastSeenMap(
    state.mode === "phonemes" ? "phonemes" : "words",
    attemptsInRange,
    ids
  );

  pool = pool.map((x) => {
    const id = lower(idFromItem(state.mode, x));
    return { ...x, lastSeenTS: lastSeen.get(id) || 0 };
  });

  // view sort rules shape cloud
  let items = pool.slice();

  if (state.sort === "freq")
    items.sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
  else if (state.sort === "diff")
    items.sort((a, b) => Number(a.avg || 0) - Number(b.avg || 0));
  else if (state.sort === "recent")
    items.sort((a, b) => Number(b.lastSeenTS || 0) - Number(a.lastSeenTS || 0));
  else if (state.sort === "persist")
    items.sort((a, b) => persistentScore(b) - persistentScore(a));
  else items.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

  // search ordering (hits first, preserve the sort inside each group)
  const q = lower(state.query);
  if (q) {
    const match = (x) => lower(idFromItem(state.mode, x)).includes(q);
    const hits = items.filter(match);
    const rest = items.filter((x) => !match(x));
    items = [...hits, ...rest];
  }

  ctx?.setLastPool?.(pool);
  return items.slice(0, topN);
}
