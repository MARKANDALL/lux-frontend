// features/harvard/modal-controller/interaction-handlers.js
// UI interaction wrappers extracted from modal-controller.js.
// Each function receives its deps via a ctx object instead of closing over them.

import {
  selectHarvardList,
  selectPassage,
  showHoverHarvard as showHoverHarvardCore,
  showHoverPassage as showHoverPassageCore,
  positionHoverCard as positionHoverCardCore,
  switchTabCore,
} from "../modal-actions.js";
import {
  renderHarvardPhonemeRows,
  renderPassagePhonemeRows,
} from "../modal-phoneme-rows.js";
import { renderLines } from "../modal-dom-helpers.js";

export function setSelected(n, ctx) {
  return selectHarvardList({
    n,
    listEl:       ctx.listEl,
    lists:        ctx.lists,
    selTitle:     ctx.selTitle,
    selLines:     ctx.selLines,
    renderLines,
    phonTitleEl:  ctx.phonTitleEl,
    phonRows:     ctx.phonRows,
    renderHarvardPhonemeRows,
    practiceBtn:  ctx.practiceBtn,
  });
}

export function setSelectedPassage(key, ctx) {
  return selectPassage({
    key,
    listEl:       ctx.listEl,
    passRecs:     ctx.passRecs,
    selTitle:     ctx.selTitle,
    selLines:     ctx.selLines,
    renderLines,
    phonTitleEl:  ctx.phonTitleEl,
    phonRows:     ctx.phonRows,
    renderPassagePhonemeRows,
    practiceBtn:  ctx.practiceBtn,
  });
}

export function positionHoverCard(btn, ctx) {
  return positionHoverCardCore({
    btn,
    hoverCard: ctx.hoverCard,
    card:      ctx.card,
    listEl:    ctx.listEl,
  });
}

export function showHoverHarvard(n, btn, ctx) {
  return showHoverHarvardCore({
    n,
    btn,
    lists:      ctx.lists,
    hoverTitle: ctx.hoverTitle,
    hoverLines: ctx.hoverLines,
    renderLines,
    hoverCard:  ctx.hoverCard,
    positionHoverCard: (b) => positionHoverCard(b, ctx),
  });
}

export function showHoverPassage(key, btn, ctx) {
  return showHoverPassageCore({
    key,
    btn,
    passRecs:   ctx.passRecs,
    hoverTitle: ctx.hoverTitle,
    hoverLines: ctx.hoverLines,
    renderLines,
    hoverCard:  ctx.hoverCard,
    positionHoverCard: (b) => positionHoverCard(b, ctx),
  });
}

export function switchTab(next, ctx) {
  return switchTabCore({
    next,
    activeTab:            ctx.activeTab,
    explainRight:         ctx.explainRight,
    EXPLAIN_HTML:         ctx.EXPLAIN_HTML,
    PASSAGES_EXPLAIN_HTML: ctx.PASSAGES_EXPLAIN_HTML,
    selectedN:            ctx.selectedN,
    selectedKey:          ctx.selectedKey,
    selTitle:             ctx.selTitle,
    practiceBtn:          ctx.practiceBtn,
    listEl:               ctx.listEl,
    phonTitleEl:          ctx.phonTitleEl,
    phonRows:             ctx.phonRows,
    renderHarvardPhonemeRows,
    renderPassagePhonemeRows,
    hideHover:            ctx.hideHover,
    renderList:           ctx.renderList,
  });
}