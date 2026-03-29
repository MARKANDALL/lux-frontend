// ui/components/trouble-chips.js
// Shared trouble chips component.
// Renders chips + inline explainer panel. Wires click behavior.

import { scoreTier } from './score-ring.js';
import { escapeHtml as esc } from '../../helpers/escape-html.js';

// ─── HTML builders (pure) ───────────────────────────────────────────────────

/**
 * Render a trouble section (sounds or words).
 *
 * @param {'sounds'|'words'} kind
 * @param {Array}  items        - trouble items from rollups (phonemesAll or wordsAll)
 * @param {object} [opts]
 * @param {number} [opts.max=6] - max chips to show
 * @returns {string} HTML
 */
export function renderTroubleSection(kind, items = [], opts = {}) {
  const max = opts.max || 6;
  const total = items.length;
  const visible = items.slice(0, max);
  const label = kind === 'sounds' ? 'Trouble Sounds' : 'Trouble Words';
  const dataKind = kind === 'sounds' ? 'phoneme' : 'word';
  const explainerId = kind === 'sounds' ? 'luxCardExplainSounds' : 'luxCardExplainWords';

  if (!visible.length) {
    return `
      <div class="lux-trouble">
        <div class="lux-trouble__head">
          <span class="lux-trouble__label">${label}</span>
        </div>
        <div class="lux-trouble__empty">Not enough data yet — keep practicing.</div>
      </div>
    `;
  }

  const chips = visible.map((item, i) => {
    const text = kind === 'sounds' ? (item.ipa || '') : (item.word || '');
    const avg = Math.round(Number(item.avg) || 0);
    const tier = scoreTier(avg);

    return `
      <span class="lux-tchip"
            data-kind="${dataKind}"
            data-idx="${i}"
            role="button"
            tabindex="0">
        <span class="lux-tchip__text">${esc(text)}</span>
        <span class="lux-tchip__score lux-tchip__score--${tier}">${avg}%</span>
      </span>
    `;
  }).join('');

  return `
    <div class="lux-trouble">
      <div class="lux-trouble__head">
        <span class="lux-trouble__label">${label}</span>
        ${total > 0 ? `<span class="lux-trouble__count">${total}</span>` : ''}
      </div>
      <div class="lux-trouble__chips">${chips}</div>
      <div class="lux-trouble__explain" id="${explainerId}" hidden></div>
    </div>
  `;
}

/**
 * Build the inline explainer HTML for a single item.
 *
 * @param {'phoneme'|'word'} kind
 * @param {object}           item - a trouble item from rollups
 * @returns {string} HTML
 */
function buildExplainerHtml(kind, item) {
  if (!item) return '';

  const avg = Math.round(Number(item.avg) || 0);
  const count = Number(item.count) || 0;
  const days = Number(item.days) || 1;
  const tier = scoreTier(avg);

  const label = kind === 'phoneme'
    ? `Sound ${esc(item.ipa || '')}`
    : `Word ${esc(item.word || '')}`;

  const examples = kind === 'phoneme' && Array.isArray(item.examples) && item.examples.length
    ? `<div class="lux-explain__examples">
         <span class="lux-explain__examples-label">Examples:</span>
         ${esc(item.examples.join(', '))}
       </div>`
    : '';

  return `
    <div class="lux-explain">
      <div class="lux-explain__row">
        <div class="lux-explain__left">
          <div class="lux-explain__title">${label}</div>
          <div class="lux-explain__meta">Seen ${count}× · ${days} day${days === 1 ? '' : 's'} · Avg ${avg}%</div>
        </div>
        <div class="lux-explain__avg lux-explain__avg--${tier}">${avg}%</div>
      </div>
      ${examples}
    </div>
  `;
}


// ─── Interaction wiring (DOM) ───────────────────────────────────────────────

/**
 * Wire click/keyboard behavior on trouble chips inside a container.
 * Call this after the HTML is mounted in the DOM.
 *
 * @param {HTMLElement} container - the card/modal element containing the chips
 * @param {object}      data
 * @param {Array}       data.phItems - phoneme trouble items (same array used to render)
 * @param {Array}       data.wdItems - word trouble items
 */
export function wireTroubleChips(container, { phItems = [], wdItems = [] } = {}) {
  if (!container) return;

  const explainSounds = container.querySelector('#luxCardExplainSounds');
  const explainWords  = container.querySelector('#luxCardExplainWords');

  let lastPick = '';

  function clearActive() {
    container.querySelectorAll('.lux-tchip.is-active').forEach((el) => el.classList.remove('is-active'));
  }

  function hidePanel(panel) {
    if (!panel) return;
    panel.innerHTML = '';
    panel.setAttribute('hidden', '');
  }

  function showExplain(kind, idx, chipEl) {
    const key = `${kind}:${idx}`;
    const same = key === lastPick;
    lastPick = same ? '' : key;

    const panel = kind === 'phoneme' ? explainSounds : explainWords;
    const other = kind === 'phoneme' ? explainWords : explainSounds;
    const items = kind === 'phoneme' ? phItems : wdItems;

    if (!panel) return;

    hidePanel(other);

    // Toggle: clicking same chip closes
    if (same) {
      hidePanel(panel);
      if (chipEl) chipEl.classList.remove('is-active');
      return;
    }

    const item = items[idx];
    if (!item) return;

    clearActive();
    if (chipEl) chipEl.classList.add('is-active');

    panel.innerHTML = buildExplainerHtml(kind, item);
    panel.removeAttribute('hidden');

    try {
      panel.scrollIntoView({ block: 'nearest' });
    } catch (_) { /* safe */ }
  }

  container.querySelectorAll('.lux-tchip[data-kind][data-idx]').forEach((chip) => {
    const kind = chip.getAttribute('data-kind');
    const idx = Number(chip.getAttribute('data-idx'));
    if (!kind || !Number.isFinite(idx)) return;

    chip.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showExplain(kind, idx, chip);
    });

    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showExplain(kind, idx, chip);
      }
    });
  });
}
