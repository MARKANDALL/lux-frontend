// ui/components/lux-card.js
// Unified card compositor. Builds card HTML at Level 0 (row), Level 1 (expanded), or Level 2 (detail).
// Composes: score-ring, metric-tiles, trouble-chips.

import { renderScoreRing, scoreTier } from './score-ring.js';
import { renderMetricTiles } from './metric-tiles.js';
import { renderTroubleSection, wireTroubleChips } from './trouble-chips.js';
import { escapeHtml as esc } from '../../helpers/escape-html.js';
import { titleFromPassageKey } from '../../features/progress/render/format.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isConvo(passageKey) {
  return String(passageKey || '').startsWith('convo:');
}

function contextBadge(passageKey) {
  if (isConvo(passageKey)) {
    return '<span class="lux-cbadge lux-cbadge--convo">AI Conversation</span>';
  }
  return '<span class="lux-cbadge">Practice Skills</span>';
}

function fmtCardDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function fmtShortDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}


// ─── Level 0: History Row ───────────────────────────────────────────────────

/**
 * Render a Level 0 history row (collapsed chip).
 *
 * @param {object} session
 * @param {string} session.passageKey
 * @param {string} session.sessionId
 * @param {number} session.count
 * @param {number} session.avgScore
 * @param {number} session.tsMax
 * @param {boolean} [session.hasAI] - whether AI coaching was used
 * @returns {string} HTML
 */
export function renderCardRow(session) {
  const pk = session.passageKey || '';
  const title = titleFromPassageKey(pk);
  const score = Math.round(Number(session.avgScore) || 0);
  const tier = scoreTier(score);
  const count = session.count || 1;
  const date = fmtShortDate(session.tsMax);
  const hasAI = !!session.hasAI;

  return `
    <div class="lux-card lux-card--row"
         data-sid="${esc(session.sessionId || '')}"
         role="button"
         tabindex="0">
      <div class="lux-card__left">
        <div class="lux-card__title">${esc(title)}</div>
        <div class="lux-card__meta">${date} · ${count} attempt${count === 1 ? '' : 's'}${hasAI ? ' · <span class="lux-card__ai-badge" title="AI coaching used">🤖</span>' : ''}</div>
      </div>
      <div class="lux-card__right">
        <span class="lux-spill lux-spill--${tier}">${score}%</span>
        <span class="lux-card__chev">›</span>
      </div>
    </div>
  `;
}


// ─── Level 1: Expanded Card ─────────────────────────────────────────────────

/**
 * Render a Level 1 expanded card.
 *
 * @param {object} opts
 * @param {string}      opts.passageKey
 * @param {number}      opts.attemptCount
 * @param {number}      opts.tsMax       - most recent timestamp
 * @param {number}      opts.tsMin       - earliest timestamp (for date range)
 * @param {object}      opts.scores      - { accuracy, fluency, completeness, pronunciation, prosody }
 * @param {number|null} opts.overall     - overall score
 * @param {Array}       opts.phItems     - trouble phoneme items from rollups
 * @param {Array}       opts.wdItems     - trouble word items from rollups
 * @param {string[]}    [opts.nextActions] - action text strings (HTML safe)
 * @param {string}      [opts.rateStr]   - speaking rate label
 * @param {boolean}     [opts.showFooter=true]
 * @returns {string} HTML
 */
export function renderCardExpanded(opts = {}) {
  const pk = opts.passageKey || '';
  const title = titleFromPassageKey(pk);
  const convo = isConvo(pk);
  const badge = contextBadge(pk);
  const count = opts.attemptCount || 1;

  // Smart date: if tsMin === tsMax (single attempt), show one date. If range, show range.
  const tsMin = opts.tsMin || opts.tsMax;
  const tsMax = opts.tsMax;
  let dateStr = fmtCardDate(tsMax);
  if (tsMin && tsMax && tsMin !== tsMax) {
    const diffMs = Math.abs(tsMax - tsMin);
    if (diffMs > 60_000) {
      const d1 = new Date(tsMin);
      const d2 = new Date(tsMax);
      if (d1.toDateString() === d2.toDateString()) {
        dateStr = `${fmtShortDate(tsMax)}, ${d1.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${d2.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
      } else {
        dateStr = `${fmtCardDate(tsMin)} – ${fmtCardDate(tsMax)}`;
      }
    }
  }

  const overall = opts.overall;
  const scores = opts.scores || {};
  const phItems = opts.phItems || [];
  const wdItems = opts.wdItems || [];
  const nextActions = opts.nextActions || [];
  const showFooter = opts.showFooter !== false;

  const ringHtml = renderScoreRing(overall, { size: 'md' });
  const tilesHtml = renderMetricTiles(scores, { rateStr: opts.rateStr || '' });
  const troubleSoundsHtml = renderTroubleSection('sounds', phItems, { max: 6 });
  const troubleWordsHtml = renderTroubleSection('words', wdItems, { max: 6 });

  const nextHtml = nextActions.length
    ? `<div class="lux-next">
         <div class="lux-next__heading">What to work on</div>
         ${nextActions.map((a) => `<div class="lux-next__item">${a}</div>`).join('')}
       </div>`
    : '';

  const footerHtml = showFooter
    ? `<div class="lux-card__footer">
         <button class="lux-card__btn lux-card__btn--primary" data-lux-action="practice">
           ${convo ? 'Try another conversation' : 'Practice again'}
         </button>
         <button class="lux-card__btn" data-lux-action="choose">
           ${convo ? 'Choose scenario' : 'Try a conversation'}
         </button>
       </div>`
    : '';

  return `
    <div class="lux-card__header">
      <div class="lux-card__title">${esc(title)}</div>
      <div class="lux-card__subtitle">
        ${badge} · ${count} attempt${count === 1 ? '' : 's'}
      </div>
      <div class="lux-card__date">${dateStr}</div>
    </div>

    ${ringHtml}
    ${tilesHtml}
    ${troubleSoundsHtml}
    ${troubleWordsHtml}
    ${nextHtml}
    ${footerHtml}
  `;
}


// ─── Level 2: Detail Sections (expandable) ──────────────────────────────────

/**
 * Render a collapsible detail section.
 *
 * @param {string} label    - section title
 * @param {string} bodyHtml - inner HTML
 * @param {object} [opts]
 * @param {boolean} [opts.open=false]
 * @returns {string} HTML
 */
export function renderDetailSection(label, bodyHtml, opts = {}) {
  const open = !!opts.open;
  const arrowCls = open ? 'lux-detail__arrow is-open' : 'lux-detail__arrow';
  const hiddenAttr = open ? '' : 'hidden';

  return `
    <div class="lux-detail">
      <button class="lux-detail__toggle" type="button">
        <span class="${arrowCls}">▸</span>
        ${esc(label)}
      </button>
      <div class="lux-detail__body" ${hiddenAttr}>
        ${bodyHtml}
      </div>
    </div>
  `;
}


// ─── DOM Wiring ─────────────────────────────────────────────────────────────

/**
 * Wire all interactive behaviors inside a mounted card element:
 * - Trouble chip click-to-expand
 * - Detail section toggle
 * - Metric tile click (delegates to external metric-modal system)
 *
 * @param {HTMLElement} el   - the card container element
 * @param {object}      data
 * @param {Array}       data.phItems - phoneme trouble items
 * @param {Array}       data.wdItems - word trouble items
 */
export function wireCard(el, { phItems = [], wdItems = [] } = {}) {
  if (!el) return;

  // 1. Trouble chips
  wireTroubleChips(el, { phItems, wdItems });

  // 2. Detail section toggles
  el.querySelectorAll('.lux-detail__toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const arrow = btn.querySelector('.lux-detail__arrow');
      const body = btn.nextElementSibling;
      if (!body) return;

      const isHidden = body.hasAttribute('hidden');
      if (isHidden) {
        body.removeAttribute('hidden');
        if (arrow) arrow.classList.add('is-open');
      } else {
        body.setAttribute('hidden', '');
        if (arrow) arrow.classList.remove('is-open');
      }
    });
  });

  // 3. Text sub-accordions inside attempt rows
  el.querySelectorAll('.lux-arow__text-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      if (!body) return;
      const isHidden = body.hasAttribute('hidden');
      if (isHidden) {
        body.removeAttribute('hidden');
      } else {
        body.setAttribute('hidden', '');
      }
    });
  });
}