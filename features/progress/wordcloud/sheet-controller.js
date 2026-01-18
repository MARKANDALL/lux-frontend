// features/progress/wordcloud/sheet-controller.js

/**
 * COMMIT 12C — Extract “action sheet controller” out of index.js
 * Owns:
 * - createCloudActionSheet({ ... })
 * - openSheetForId()
 * - onSelect(hit) -> opens sheet
 */

import { createCloudActionSheet } from "./action-sheet.js";

export function createWordcloudSheetController({
  ctx,
  attemptsAll,
  getState,              // () => S snapshot
  strips,                // strips controller (for onStoreChange refresh)
  requestDraw,           // () => draw(false)

  // behavior + dependencies
  buildCloudPlan,        // (state) => plan
  saveNextActivityPlan,  // (plan) => void
  goToConvo,             // () => void

  openDetailsModal,      // (attempt, score, dateStr, meta) => void
  attemptOverallScore,   // (attempt) => number
  attemptWhen,           // (attempt) => string

  findRecentAttemptsForWord,
  findRecentAttemptsForPhoneme,

  filterAttemptsByRange,
  idFromItem,
  lower,
}) {
  const sheet = createCloudActionSheet({
    onGenerate: (state) => {
      const plan = buildCloudPlan(state);
      if (!plan) return;
      saveNextActivityPlan(plan);
      goToConvo();
    },

    onOpenAttempt: (attempt) => {
      if (!attempt) return;
      const score = attemptOverallScore(attempt);
      const dateStr = attemptWhen(attempt) || "—";
      openDetailsModal(attempt, score, dateStr, {
        sid: "",
        list: [attempt],
        session: null,
      });
    },

    onStoreChange: () => {
      strips?.renderSavedStrip?.();
      requestDraw?.();
    },
  });

  function openSheetForId(id) {
    const S = getState();

    // ✅ CORRECT ORDER: (allAttempts, range, timelineWin, timelinePos)
    const attemptsInRange = filterAttemptsByRange(
      attemptsAll,
      S.range,
      S.timelineWin,
      S.timelinePos
    );

    const hitItem = (ctx.refs.lastPool || []).find(
      (x) => lower(idFromItem(S.mode, x)) === lower(id)
    );

    const kind = S.mode === "phonemes" ? "phoneme" : "word";
    const title = kind === "phoneme" ? `/${id}/` : id;

    const avg = hitItem ? Number(hitItem.avg || 0) : 0;
    const count = hitItem ? Number(hitItem.count || 0) : 0;

    const recents =
      kind === "word"
        ? findRecentAttemptsForWord(attemptsInRange, id, 6)
        : findRecentAttemptsForPhoneme(attemptsInRange, id, 6);

    sheet.open({
      kind,
      id,
      title,
      avg,
      count,
      days: hitItem?.days ?? null,
      priority: hitItem?.priority ?? null,
      examples: Array.isArray(hitItem?.examples) ? hitItem.examples : [],
      recents,
    });
  }

  function openFromHit(hit) {
    const S = getState();

    // ✅ CORRECT ORDER: (allAttempts, range, timelineWin, timelinePos)
    const attemptsRange = filterAttemptsByRange(
      attemptsAll,
      S.range,
      S.timelineWin,
      S.timelinePos
    );

    const metaObj = hit?.meta || {};
    const isPh = S.mode === "phonemes" || metaObj.ipa != null;

    const kind = isPh ? "phoneme" : "word";
    const id = isPh
      ? String(metaObj.ipa || hit.text || "").trim()
      : String(metaObj.word || hit.text || "").trim();

    const title = kind === "phoneme" ? `/${id}/` : id;

    const recents =
      kind === "word"
        ? findRecentAttemptsForWord(attemptsRange, id, 6)
        : findRecentAttemptsForPhoneme(attemptsRange, id, 6);

    sheet.open({
      kind,
      id,
      title,
      avg: Number(metaObj.avg ?? hit.avg ?? 0) || 0,
      count: Number(metaObj.count ?? hit.count ?? 0) || 0,
      days: metaObj.days ?? null,
      priority: metaObj.priority ?? null,
      examples: Array.isArray(metaObj.examples) ? metaObj.examples : [],
      recents,
    });
  }

  return {
    openSheetForId,
    openFromHit,
  };
}
