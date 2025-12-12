// features/interactions/ph-hover.js
// Phoneme hover interactions
// UPDATED: Matches yg-hover.js events (mouseover/mouseout) exactly.

import { safePlay } from "./utils.js";

/* ====================== Public entry ====================== */

export function setupPhonemeHover() {
  installHeaderPreview();
  installChipClickPlay();

  console.log(
    "[LUX] phoneme hover: header preview enabled, inline chip tooltips only"
  );
}

/* ====================== 1) Header preview (MATCHES WORD HEADER LOGIC) ====================== */

function installHeaderPreview() {
  const preview = document.getElementById("phPreview");
  const demoVid = document.getElementById("phDemo");
  const phHeader = document.getElementById("phonemeHeader");
  // Target the specific pill
  const pill = phHeader?.querySelector(".phoneme-chip");

  if (!preview || !demoVid || !phHeader || !pill) return;

  function showPreview() {
    preview.style.display = "block";

    const rect = phHeader.getBoundingClientRect();
    const popW = preview.offsetWidth || 560;
    const popH = preview.offsetHeight || 390;

    // Align similarly to Word preview
    let left = rect.left - popW - 10;
    if (left < 10) left = 10;

    let top = rect.top;
    if (top + popH > window.innerHeight - 10) {
      top = window.innerHeight - popH - 10;
    }
    if (top < 10) top = 10;

    preview.style.left = left + "px";
    preview.style.top = top + "px";

    demoVid.muted = true;
    safePlay(demoVid, demoVid.getAttribute("src"), {
      muted: true,
      restart: true,
    });
  }

  function hidePreview() {
    preview.style.display = "none";
    demoVid.pause();
    demoVid.currentTime = 0;
    demoVid.muted = true;

    // Reset pill state if we were just hovering
    const title = document.getElementById("phonemeTitle");
    if (title) title.classList.remove("is-playing");

    const tip = document.getElementById("phUnmuteTip");
    if (tip) tip.style.display = "none";
  }

  // UPDATED: Use mouseover/mouseout to match yg-hover.js sensitivity
  function maybeHideFromPill(e) {
    const to = e.relatedTarget;
    if (to && (to === preview || preview.contains(to))) return;
    hidePreview();
  }

  function maybeHideFromPreview(e) {
    const to = e.relatedTarget;
    if (to && (to === pill || pill.contains(to))) return;
    hidePreview();
  }

  pill.addEventListener("mouseover", showPreview);
  pill.addEventListener("mouseout", maybeHideFromPill);
  preview.addEventListener("mouseout", maybeHideFromPreview);
}

/* ====================== 2) Chip click-to-play (Unchanged) ====================== */

let chipClickPlayBooted = false;
let currentPlaying = null; 
let watchdogId = null;

function installChipClickPlay() {
  if (chipClickPlayBooted) return;
  chipClickPlayBooted = true;

  const root = document.querySelector("#prettyResult");
  if (!root) return;

  root.addEventListener(
    "click",
    (e) => {
      const chip = e.target.closest(".phoneme-chip.tooltip");
      if (!chip || !root.contains(chip)) return;
      if (e.target.closest("a")) return;

      const tip = chip.querySelector(".tooltiptext");
      const video = tip?.querySelector("video");
      if (!video) return;

      e.preventDefault();

      if (
        currentPlaying &&
        currentPlaying.chip === chip &&
        currentPlaying.video === video &&
        !video.paused
      ) {
        stopPlayback(currentPlaying);
        return;
      }

      if (
        currentPlaying &&
        currentPlaying.video &&
        !currentPlaying.video.paused
      ) {
        stopPlayback(currentPlaying);
      }

      const src =
        video.currentSrc ||
        video.getAttribute("src") ||
        video.querySelector("source")?.getAttribute("src");

      applyRetractLock(chip);

      currentPlaying = { chip, video };
      startWatchdog();

      try {
        video.muted = false;
        video.volume = 1;
        try {
          video.currentTime = 0;
        } catch {}

        safePlay(video, src, { muted: false, restart: true });
        video.muted = false;
        video.volume = 1;
      } catch (err) {
        console.warn("[LUX] chip click play fallback", err);
        try { video.play(); } catch(e){}
      }

      video.onended = () => {
        if (currentPlaying?.video === video) stopPlayback(currentPlaying);
      };
    },
    { capture: true }
  );

  console.log(
    "[LUX] phoneme chips: click-to-play enabled"
  );
}

function stopPlayback(entry, opts = {}) {
  if (!entry?.video) return;
  const { chip, video } = entry;

  try {
    video.pause();
    if (!opts.keepTime) {
      try {
        video.currentTime = 0;
      } catch {}
    }
    video.muted = true;
  } catch {}

  releaseRetractLock(chip);
  popOnStop(chip);
  stopWatchdog();

  if (currentPlaying === entry) currentPlaying = null;
}

function applyRetractLock(chip) {
  if (!chip) return;
  chip.classList.add("lux-playing-lock");
  chip.style.transition = "transform 120ms ease-out";
  chip.style.transform = "scale(1)";
}

function releaseRetractLock(chip) {
  if (!chip) return;
  chip.classList.remove("lux-playing-lock");
  chip.style.transform = "";
  chip.style.transition = "";
}

function popOnStop(chip) {
  if (!chip) return;
  try {
    chip.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.12)" },
        { transform: "scale(1)" },
      ],
      { duration: 180, easing: "ease-out" }
    );
  } catch {}
}

function startWatchdog() {
  stopWatchdog();
  watchdogId = setInterval(() => {
    if (!currentPlaying?.chip || !currentPlaying?.video) {
      stopWatchdog();
      return;
    }
    const { chip } = currentPlaying;
    if (!document.body.contains(chip)) {
      stopPlayback(currentPlaying);
      return;
    }
    const rect = chip.getBoundingClientRect();
    const out =
      rect.bottom < 0 ||
      rect.top > window.innerHeight ||
      rect.right < 0 ||
      rect.left > window.innerWidth;

    if (out) {
      stopPlayback(currentPlaying);
      return;
    }
    const tip = chip.querySelector(".tooltiptext");
    if (tip) {
      const cs = getComputedStyle(tip);
      const hidden =
        cs.visibility === "hidden" ||
        cs.display === "none" ||
        parseFloat(cs.opacity || "0") < 0.05;

      if (hidden) {
        stopPlayback(currentPlaying);
        return;
      }
    }
  }, 120);
}

function stopWatchdog() {
  if (watchdogId) {
    clearInterval(watchdogId);
    watchdogId = null;
  }
}