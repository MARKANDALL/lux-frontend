// features/interactions/ph-hover/tooltip-render.js
// Renders tooltip HTML + positions it.
// Delegates carousel/video logic to other modules via callbacks.

import { escapeHTML } from "./utils.js";

export function showTooltip(state, chip, { pinned = false } = {}, hooks = {}) {
  const { initTooltipTextCarousel, initTooltipVideoControls, hideTooltip, openVideoFocusModal } = hooks;

  if (!state.globalTooltip || !state.tooltipContent) return;

  // If same chip is already showing, do nothing
  if (state.currentChip === chip && state.globalTooltip.style.visibility === "visible") {
    state.tooltipPinned = !!pinned || state.tooltipPinned;
    return;
  }

  state.currentChip = chip;
  state.tooltipPinned = !!pinned;

  const ipa = chip.getAttribute("data-ipa") || "?";

  const tipPlain =
    chip.getAttribute("data-tip-plain") ||
    chip.getAttribute("data-tip-text") ||
    "";

  const tipTech = chip.getAttribute("data-tip-tech") || "";
  const tipMistake = chip.getAttribute("data-tip-mistake") || "";

  const vidSrc = chip.getAttribute("data-video-src") || chip.dataset.videoSrc;
  const vidFrontSrc =
    chip.getAttribute("data-video-front-src") || chip.dataset.videoFrontSrc;

  const displayLabel = chip.getAttribute("data-display-ipa") || "";

  // Examples (optional)
  let words = [];
  const wordsRaw = chip.getAttribute("data-tip-words") || "";
  if (wordsRaw) {
    try {
      const parsed = JSON.parse(wordsRaw);
      if (Array.isArray(parsed)) words = parsed.filter(Boolean).slice(0, 3);
    } catch (_) {}
  }

  const panels = [
    {
      title: "Plain",
      text: tipPlain,
      empty: `No details available for /${ipa}/ yet.`,
    },
    {
      title: "Technical",
      text: tipTech,
      empty: "Technical note coming soon.",
    },
    {
      title: "Common mix-ups",
      text: tipMistake,
      empty: "No common mistakes recorded yet.",
    },
  ];

  // Modal meta (so expanded view can show EVERYTHING tooltip has)
  // If we don't have an examples array, try to pull one word from the display label: "/eɪ/ (day)" or "as in 'day'"
  let modalWords = Array.isArray(words) ? words.slice(0, 3) : [];
  if (!modalWords.length && displayLabel) {
    const mAsIn = displayLabel.match(/as in ['"]([^'"]+)['"]/i);
    const mParen = displayLabel.match(/\(([^)]+)\)/);
    const w = (mAsIn?.[1] || mParen?.[1] || "").trim();
    if (w) modalWords = [w];
  }

  const modalMeta = {
    ipa,
    displayLabel,
    words: modalWords,
    panels,
  };

  // Topbar examples string
  const examplesStr = words.length
    ? `(${words.map(escapeHTML).join(", ")})`
    : displayLabel
    ? escapeHTML(displayLabel)
    : "";

  let html = `
    <div class="lux-ph-topbar">
      <div class="lux-ph-ipaBlock">
        <span class="lux-ph-ipa">/${escapeHTML(ipa)}/</span>
        ${
          examplesStr
            ? `<span class="lux-ph-examples">${examplesStr}</span>`
            : ``
        }
      </div>

      <div class="lux-ph-modeNav">
        <button id="lux-ph-panel-prev" class="lux-ph-nav-btn" type="button" aria-label="Previous panel">‹</button>
        <div id="lux-ph-modeTitle" class="lux-ph-modeTitle"></div>
        <button id="lux-ph-panel-next" class="lux-ph-nav-btn" type="button" aria-label="Next panel">›</button>
      </div>

      <button id="lux-ph-close" class="lux-ph-closeBtn" type="button" aria-label="Close">✕</button>
    </div>

    <!-- SINGLE panel text element (no duplicates anywhere else) -->
    <div id="lux-ph-panelText" class="lux-ph-panelText"></div>
  `;

  html += `
    ${
      vidSrc || vidFrontSrc
        ? `
  <div class="lux-ph-vidBox">
    <div class="lux-ph-vidControls">
      <div class="lux-ph-vidBtns">
        ${
          vidSrc
            ? `<button id="lux-ph-play-side" class="lux-ph-miniBtn" type="button">Side</button>`
            : ``
        }
        ${
          vidFrontSrc
            ? `<button id="lux-ph-play-front" class="lux-ph-miniBtn" type="button">Front</button>`
            : ``
        }
        ${
          vidSrc && vidFrontSrc
            ? `<button id="lux-ph-play-both" class="lux-ph-miniBtn" type="button">Both</button>`
            : ``
        }
        <button id="lux-ph-stop" class="lux-ph-miniBtn" type="button">Stop</button>

        <button id="lux-ph-expand" class="lux-ph-miniBtn is-primary" type="button">Expand</button>

        <button id="lux-ph-loop" class="lux-ph-miniBtn" type="button" data-loop="0">Repeat Off</button>

        <select id="lux-ph-speed" class="lux-ph-speed">
          <option value="0.4">0.4×</option>
          <option value="0.5">0.5×</option>
          <option value="0.6">0.6×</option>
          <option value="0.7">0.7×</option>
          <option value="0.8">0.8×</option>
          <option value="0.9">0.9×</option>
          <option value="1" selected>1×</option>
          <option value="1.1">1.1×</option>
          <option value="1.25">1.25×</option>
          <option value="1.4">1.4×</option>
          <option value="1.6">1.6×</option>
        </select>
      </div>

      <button id="lux-ph-sound" class="lux-ph-miniBtn" type="button" data-sound="1" aria-label="Toggle sound">
        🔊
      </button>
    </div>

    <div class="lux-ph-vidGrid" data-cols="${vidFrontSrc ? 2 : 1}">
      ${
        vidSrc
          ? `
      <div class="lux-ph-vidTile" data-vid="side">
        <video id="lux-global-video-side"
          data-vid="side"
          src="${vidSrc}"
          playsinline
          preload="metadata">
        </video>
        <div class="lux-ph-vidOverlay" aria-hidden="true"><span>▶</span></div>
        <div class="lux-ph-vidLabel">Side</div>
      </div>`
          : ``
      }

      ${
        vidFrontSrc
          ? `
      <div class="lux-ph-vidTile" data-vid="front">
        <video id="lux-global-video-front"
          data-vid="front"
          src="${vidFrontSrc}"
          playsinline
          preload="metadata">
        </video>
        <div class="lux-ph-vidOverlay" aria-hidden="true"><span>▶</span></div>
        <div class="lux-ph-vidLabel">Front</div>
      </div>`
          : ``
      }
    </div>
  </div>
`
        : ``
    }
  `;

  state.tooltipContent.innerHTML = html;

  // Wire carousel + video controls now that DOM exists
  initTooltipTextCarousel?.(state.globalTooltip, panels);
  initTooltipVideoControls?.(state.globalTooltip, {
    openVideoFocusModal: openVideoFocusModal
      ? ({ sideSrc, frontSrc }) => openVideoFocusModal({ sideSrc, frontSrc, meta: modalMeta })
      : null,
  });

  // Close button
  const closeBtn = state.globalTooltip.querySelector("#lux-ph-close");
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideTooltip?.(state);
    };
  }

  // ---- Position (zero gap + clamp) ----
  const tip = state.globalTooltip;

  tip.style.visibility = "hidden";
  tip.style.opacity = "0";
  tip.style.top = `0px`;
  tip.style.left = `0px`;

  // Force layout pass so we can measure
  const rect = chip.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const tipW = tipRect.width || Math.min(560, window.innerWidth - 20);
  const tipH = tipRect.height || 320;

  const winH = window.innerHeight;

  let top = rect.bottom;
  let left = rect.left + rect.width / 2 - tipW / 2;

  if (top + tipH > winH - 10) top = rect.top - tipH;

  if (left < 10) left = 10;
  if (left + tipW > window.innerWidth - 10) left = window.innerWidth - tipW - 10;

  tip.style.top = `${Math.max(10, top)}px`;
  tip.style.left = `${left}px`;
  tip.style.visibility = "visible";
  tip.style.opacity = "1";
}
