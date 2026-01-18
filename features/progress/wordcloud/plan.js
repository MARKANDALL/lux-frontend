/**
 * features/progress/wordcloud/plan.js
 *
 * ✅ COMMIT 12D
 * Extract “Next Activity Plan build” logic out of index.js
 *
 * Owns:
 *  - buildCloudPlan(model, state)            (sheet selection -> plan)
 *  - buildCloudTop3Plan(model, mode, top3)   (Top 3 -> plan)
 *  - buildCloudCoachQuickPlan(model)        (coach quick -> plan)
 */

import { buildNextActivityPlanFromModel } from "../../next-activity/next-activity.js";
import { lower } from "./compute.js";

/**
 * Build a Next Activity Plan for a specific cloud selection.
 * Used by the sheet controller when user taps an item.
 *
 * @param {object} model  - rollups model (ctx.refs.lastModel)
 * @param {object} state  - { kind: "word"|"phoneme", id, avg, count, days, priority }
 * @returns {object|null} next activity plan JSON or null
 */
export function buildCloudPlan(model, state) {
  const base = buildNextActivityPlanFromModel(model, {
    source: "cloud",
    maxWords: 6,
  });
  if (!base) return null;

  if (state?.kind === "word") {
    const target = {
      word: String(state.id || "").trim(),
      avg: Number(state.avg) || null,
      count: Number(state.count) || null,
      days: Number(state.days) || null,
      priority: Number(state.priority) || null,
    };

    const rest = (base.targets?.words || []).filter(
      (w) => lower(w?.word) !== lower(target.word)
    );

    base.targets.words = [target, ...rest].slice(0, 6);
  }

  if (state?.kind === "phoneme") {
    base.targets.phoneme = {
      ipa: String(state.id || "").trim(),
      avg: Number(state.avg) || null,
      count: Number(state.count) || null,
      days: Number(state.days) || null,
      priority: Number(state.priority) || null,
    };
  }

  return base;
}

/**
 * Build a Next Activity Plan from the “Top 3” strip selection.
 *
 * For WORD mode: inject chosen top words into plan.targets.words (front-loaded).
 * For PHONEME mode: choose best[0] as plan.targets.phoneme.
 *
 * @param {object} model
 * @param {"words"|"phonemes"} mode
 * @param {Array<object>} top
 * @returns {object|null}
 */
export function buildCloudTop3Plan(model, mode, top) {
  const base = buildNextActivityPlanFromModel(model, {
    source: "cloud-top3",
    maxWords: 6,
  });
  if (!base) return null;

  const list = Array.isArray(top) ? top : [];
  if (!list.length) return base;

  if (mode === "words") {
    const chosen = list
      .map((x) => ({
        word: String(x?.word || "").trim(),
        avg: Number(x?.avg || 0) || null,
        count: Number(x?.count || 0) || null,
        days: Number(x?.days || 0) || null,
        priority: Number(x?.priority || 0) || null,
      }))
      .filter((x) => x.word);

    const rest = (base.targets?.words || []).filter(
      (w) => !chosen.some((c) => lower(c.word) === lower(w?.word))
    );

    base.targets.words = [...chosen, ...rest].slice(0, 6);
    return base;
  }

  // phonemes
  const best = list[0];
  base.targets.phoneme = {
    ipa: String(best?.ipa || "").trim(),
    avg: Number(best?.avg || 0) || null,
    count: Number(best?.count || 0) || null,
    days: Number(best?.days || 0) || null,
    priority: Number(best?.priority || 0) || null,
  };

  return base;
}

/**
 * Coach quick path:
 * Your prior behavior was “save the base plan as-is” (no injection).
 * Keep that behavior here.
 *
 * @param {object} model
 * @returns {object|null}
 */
export function buildCloudCoachQuickPlan(model) {
  return (
    buildNextActivityPlanFromModel(model, {
      source: "cloud-top3",
      maxWords: 6,
    }) || null
  );
}
