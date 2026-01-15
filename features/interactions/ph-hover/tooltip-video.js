// features/interactions/ph-hover/tooltip-video.js
// Tooltip-side video controls (sound/loop/speed/play/stop/both + tile click behavior)

export function initTooltipVideoControls(globalTooltipEl, { openVideoFocusModal } = {}) {
  const sideVid = globalTooltipEl?.querySelector("#lux-global-video-side");
  const frontVid = globalTooltipEl?.querySelector("#lux-global-video-front");

  const tileSide = globalTooltipEl?.querySelector('.lux-ph-vidTile[data-vid="side"]');
  const tileFront = globalTooltipEl?.querySelector('.lux-ph-vidTile[data-vid="front"]');

  const btnSide = globalTooltipEl?.querySelector("#lux-ph-play-side");
  const btnFront = globalTooltipEl?.querySelector("#lux-ph-play-front");
  const btnBoth = globalTooltipEl?.querySelector("#lux-ph-play-both");
  const btnStop = globalTooltipEl?.querySelector("#lux-ph-stop");
  const btnExpand = globalTooltipEl?.querySelector("#lux-ph-expand");
  const btnSound = globalTooltipEl?.querySelector("#lux-ph-sound");
  const btnLoop = globalTooltipEl?.querySelector("#lux-ph-loop");
  const speedSel = globalTooltipEl?.querySelector("#lux-ph-speed");

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

    // Pressing play should auto-unmute (unless user turned sound off)
    v.muted = soundOn ? false : true;
    v.volume = 1.0;

    try {
      await v.play();
    } catch (_) {
      // Fallback: browsers may block sound
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

    // Restart both to sync “as close as possible”
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

  btnExpand?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const sideSrc = sideVid?.getAttribute("src");
    const frontSrc = frontVid?.getAttribute("src");

    openVideoFocusModal?.({ sideSrc, frontSrc });
  });

  // Apply initial states
  applySound();
  applyLoop();
  applySpeed();
}
