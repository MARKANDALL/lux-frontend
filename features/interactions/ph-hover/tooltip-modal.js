// features/interactions/ph-hover/tooltip-modal.js
// Video Focus Modal (expand/shrink) + its controls
// Mirrors the tooltip-video system, but scoped to the modal DOM.

import { initTooltipTextCarousel } from "./tooltip-carousel.js";
import { norm, getCodesForIPA } from "../../../src/data/phonemes/core.js";

export function initModalVideoControls(back) {
  const sideVid = back?.querySelector('video[data-vid="side"]');
  const frontVid = back?.querySelector('video[data-vid="front"]');

  const tileSide = back?.querySelector('.lux-ph-vidTile[data-vid="side"]');
  const tileFront = back?.querySelector('.lux-ph-vidTile[data-vid="front"]');

  const btnSide = back?.querySelector("#lux-ph-m-side");
  const btnFront = back?.querySelector("#lux-ph-m-front");
  const btnBoth = back?.querySelector("#lux-ph-m-both");
  const btnStop = back?.querySelector("#lux-ph-m-stop");
  const btnShrink = back?.querySelector("#lux-ph-m-shrink");
  const btnSound = back?.querySelector("#lux-ph-m-sound");
  const btnLoop = back?.querySelector("#lux-ph-m-loop");
  const speedSel = back?.querySelector("#lux-ph-m-speed");

  if (!sideVid && !frontVid) return;

  // Default sound ON
  let soundOn = true;

  // Default loop OFF
  let loopOn = false;

  function applySound() {
    const txt = soundOn ? "🔊" : "🔇";
    if (btnSound) {
      btnSound.textContent = txt;
      btnSound.setAttribute("data-sound", soundOn ? "1" : "0");
    }
    for (const v of [sideVid, frontVid]) {
      if (!v) continue;
      v.muted = !soundOn;
      v.volume = 1.0;
    }
  }

  function applyLoop() {
    for (const v of [sideVid, frontVid]) {
      if (!v) continue;
      v.loop = loopOn;
    }
    if (btnLoop) {
      btnLoop.textContent = loopOn ? "Repeat On" : "Repeat Off";
      btnLoop.setAttribute("data-loop", loopOn ? "1" : "0");
    }
  }

  function applySpeed() {
    const rate = parseFloat(speedSel?.value || "1");
    for (const v of [sideVid, frontVid]) {
      if (!v) continue;
      v.playbackRate = rate;
    }
  }

  async function gesturePlay(v, { restart = true } = {}) {
    if (!v) return;
    try {
      if (restart) v.currentTime = 0;
    } catch (_) {}

    v.muted = soundOn ? false : true;
    v.volume = 1.0;

    try {
      await v.play();
    } catch (_) {
      try {
        v.muted = true;
        await v.play();
      } catch (_) {}
    }
  }

  function stopAll() {
    for (const v of [sideVid, frontVid]) {
      if (!v) continue;
      try {
        v.pause();
      } catch (_) {}
      try {
        v.currentTime = 0;
      } catch (_) {}
    }
  }

  function bindTile(v, tile) {
    if (!v || !tile) return;

    const syncClass = () => {
      tile.classList.toggle("is-playing", !v.paused);
    };

    v.addEventListener("play", syncClass);
    v.addEventListener("pause", syncClass);
    v.addEventListener("ended", syncClass);
    syncClass();

    tile.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (v.paused) await gesturePlay(v, { restart: false });
      else v.pause();
    });
  }

  bindTile(sideVid, tileSide);
  bindTile(frontVid, tileFront);

  btnSound?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    soundOn = !soundOn;
    applySound();
  });

  btnLoop?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    loopOn = !loopOn;
    applyLoop();
  });

  speedSel?.addEventListener("change", applySpeed);

  btnSide?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await gesturePlay(sideVid, { restart: true });
  });

  btnFront?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await gesturePlay(frontVid, { restart: true });
  });

  btnBoth?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (sideVid) sideVid.currentTime = 0;
    } catch (_) {}
    try {
      if (frontVid) frontVid.currentTime = 0;
    } catch (_) {}

    applySound();
    applySpeed();

    await Promise.all([
      sideVid ? gesturePlay(sideVid, { restart: false }) : Promise.resolve(),
      frontVid ? gesturePlay(frontVid, { restart: false }) : Promise.resolve(),
    ]);
  });

  btnStop?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    stopAll();
  });

  btnShrink?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Modal close is handled by openVideoFocusModal() close()
    back?.remove();
  });

  // Apply initial states
  applySound();
  applyLoop();
  applySpeed();
}

export function openVideoFocusModal({ sideSrc, frontSrc, meta } = {}) {
  // kill existing
  const existing = document.querySelector("#lux-ph-vidModalBack");
  if (existing) existing.remove();

  const back = document.createElement("div");
  back.id = "lux-ph-vidModalBack";
  back.className = "lux-ph-modalBack";

  // Only render buttons that actually apply
  const hasSide = !!sideSrc;
  const hasFront = !!frontSrc;
  const hasBoth = hasSide && hasFront;

  back.innerHTML = `
    <div class="lux-ph-modalCard" role="dialog" aria-modal="true">
      ${
        meta
          ? `
      <div class="lux-ph-modalInfo">
        <div class="lux-ph-topbar">
          <div class="lux-ph-ipaBlock">
            <span id="lux-ph-m-ipa" class="lux-ph-ipa">/?/</span>
            <span id="lux-ph-m-code" class="lux-ph-code"></span>
            <span id="lux-ph-m-examples" class="lux-ph-examples"></span>
          </div>

          <div class="lux-ph-modeNav">
            <button id="lux-ph-m-panel-prev" class="lux-ph-nav-btn" type="button" aria-label="Previous panel">‹</button>
            <div id="lux-ph-m-modeTitle" class="lux-ph-modeTitle"></div>
            <button id="lux-ph-m-panel-next" class="lux-ph-nav-btn" type="button" aria-label="Next panel">›</button>
          </div>
        </div>
        <div id="lux-ph-m-panelText" class="lux-ph-panelText"></div>
      </div>
          `
          : ``
      }

      <div class="lux-ph-modalTop">
        <div class="lux-ph-modalTitle">Video Focus</div>

        <div class="lux-ph-vidBtns">
          ${hasSide ? `<button id="lux-ph-m-side" class="lux-ph-miniBtn" type="button">Side</button>` : ``}
          ${hasFront ? `<button id="lux-ph-m-front" class="lux-ph-miniBtn" type="button">Front</button>` : ``}
          ${hasBoth ? `<button id="lux-ph-m-both" class="lux-ph-miniBtn is-primary" type="button">Both</button>` : ``}
          <button id="lux-ph-m-stop" class="lux-ph-miniBtn" type="button">Stop</button>
          <button id="lux-ph-m-shrink" class="lux-ph-miniBtn" type="button">Close</button>
          <button id="lux-ph-m-loop" class="lux-ph-miniBtn" type="button" data-loop="0">Repeat Off</button>

          <select id="lux-ph-m-speed" class="lux-ph-speed">
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

          <button id="lux-ph-m-sound" class="lux-ph-miniBtn" type="button" data-sound="1">🔊</button>
        </div>
      </div>

      <div class="lux-ph-modalGrid">
        ${
          sideSrc
            ? `
          <div class="lux-ph-vidTile" data-vid="side">
            <video data-vid="side" src="${sideSrc}" playsinline preload="metadata"></video>
            <div class="lux-ph-vidOverlay" aria-hidden="true"><span>▶</span></div>
            <div class="lux-ph-vidLabel">Side</div>
          </div>`
            : ``
        }

        ${
          frontSrc
            ? `
          <div class="lux-ph-vidTile" data-vid="front">
            <video data-vid="front" src="${frontSrc}" playsinline preload="metadata"></video>
            <div class="lux-ph-vidOverlay" aria-hidden="true"><span>▶</span></div>
            <div class="lux-ph-vidLabel">Front</div>
          </div>`
            : ``
        }
      </div>
    </div>
  `;

  document.body.appendChild(back);

  const card = back.querySelector(".lux-ph-modalCard");
  if (!card) return;

  // If meta is present, populate the info panel + wire carousel
  if (meta) {
    const ipa = norm(meta.ipa || "") || "?";
    const elIPA = card.querySelector("#lux-ph-m-ipa");
    const elCode = card.querySelector("#lux-ph-m-code");
    const elExamples = card.querySelector("#lux-ph-m-examples");

    if (elIPA) elIPA.textContent = `/${ipa}/`;

    const codes = getCodesForIPA(ipa).slice(0, 3); // keep it compact
    if (elCode) {
      // Show BOTH: "EY · ey | SCHWA · schwa"
      const parts = codes.map((c) => `${c.toUpperCase()} · ${c.toLowerCase()}`);
      elCode.textContent = parts.length ? parts.join(" | ") : "";
    }

    const words = Array.isArray(meta.words) ? meta.words.filter(Boolean).slice(0, 3) : [];
    if (elExamples) {
      elExamples.textContent = words.length ? `(${words.join(", ")})` : "";
    }

    const panels = Array.isArray(meta.panels) ? meta.panels : [];
    if (panels.length) {
      initTooltipTextCarousel(card, panels, { prefix: "lux-ph-m-" });
    } else {
      // If no panels, hide the nav affordance by clearing title/text
      const t = card.querySelector("#lux-ph-m-modeTitle");
      const p = card.querySelector("#lux-ph-m-panelText");
      if (t) t.textContent = "";
      if (p) p.textContent = "";
    }
  }

  function close() {
    // pause everything inside modal
    back.querySelectorAll("video").forEach((v) => {
      try {
        v.pause();
      } catch (_) {}
    });
    back.remove();
  }

  // Close closes instantly
  back.querySelector("#lux-ph-m-shrink")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    close();
  });

  // Click backdrop closes instantly
  back.addEventListener("click", (e) => {
    if (e.target === back) close();
  });

  // Prevent inside clicks from closing backdrop
  card.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Wire modal controls (mirrors tooltip logic)
  initModalVideoControls(back);

  // Click tile toggles play/pause (kept — mirrors tooltip feel)
  back.querySelectorAll(".lux-ph-vidTile").forEach((tile) => {
    const v = tile.querySelector("video");
    tile.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (!v) return;
        if (v.paused) {
          v.muted = false;
          v.volume = 1.0;
          await v.play();
          tile.classList.add("is-playing");
        } else {
          v.pause();
          tile.classList.remove("is-playing");
        }
      } catch (_) {}
    });
  });
}
