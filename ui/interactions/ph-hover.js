// ui/interactions/ph-hover.js
// Phoneme hover interactions
// - Keeps header hover preview (small popover at top).
// - Uses inline chip tooltips (CSS-driven).
// - Restores classic click semantics:
//    * hover bulges out (CSS)
//    * click plays video+audio AND retracts chip to normal size while playing
//    * click again stops/reset AND re-enables hover bulge
//    * auto-stops when chip leaves view OR tooltip hides (watchdog)
// - No portal/overlay.

import { safePlay } from "./utils.js";

/* ====================== Public entry ====================== */

export function setupPhonemeHover() {
  installHeaderPreview();
  installChipClickPlay();

  console.log(
    "[LUX] phoneme hover: header preview enabled, inline chip tooltips only"
  );
}

/* ====================== 1) Header preview (unchanged) ====================== */

function installHeaderPreview() {
  const preview = document.getElementById("phPreview");
  const demoVid = document.getElementById("phDemo");
  const phHeader = document.getElementById("phonemeHeader");
  const pill = phHeader?.querySelector(".phoneme-chip");

  if (!preview || !demoVid || !phHeader || !pill) return;

  function showPreview() {
    preview.style.display = "block";

    const rect = phHeader.getBoundingClientRect();
    const popW = preview.offsetWidth || 560;
    const popH = preview.offsetHeight || 390;

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

    const title = document.getElementById("phonemeTitle");
    if (title) title.classList.remove("is-playing");

    const tip = document.getElementById("phUnmuteTip");
    if (tip) tip.style.display = "none";
  }

  pill.addEventListener("mouseenter", showPreview);
  pill.addEventListener("mouseleave", (e) => {
    const to = e.relatedTarget;
    if (to && (to === preview || preview.contains(to))) return;
    hidePreview();
  });

  preview.addEventListener("mouseleave", hidePreview);
}

/* ====================== 2) Chip click-to-play (toggle + retract lock + watchdog) ====================== */

let chipClickPlayBooted = false;

// Track the currently playing chip/video so we can toggle + auto-stop.
let currentPlaying = null; // { chip, video }

// Watchdog timer id
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

      // Don't hijack real links
      if (e.target.closest("a")) return;

      const tip = chip.querySelector(".tooltiptext");
      const video = tip?.querySelector("video");
      if (!video) return;

      e.preventDefault();

      // Toggle stop if clicking same chip while playing
      if (
        currentPlaying &&
        currentPlaying.chip === chip &&
        currentPlaying.video === video &&
        !video.paused
      ) {
        stopPlayback(currentPlaying);
        return;
      }

      // Stop any other active playback first
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

      // LOCK: retract chip to normal size while playing
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

        // Re-assert audio in case safePlay is conservative
        video.muted = false;
        video.volume = 1;
      } catch (err) {
        console.warn("[LUX] chip click play failed, fallback play()", err);
        try {
          video.muted = false;
          video.volume = 1;
          try {
            video.currentTime = 0;
          } catch {}
          video.play();
        } catch (err2) {
          console.warn("[LUX] chip click play fallback failed", err2);
        }
      }

      // Clear state when video ends naturally
      video.onended = () => {
        if (currentPlaying?.video === video) stopPlayback(currentPlaying);
      };
    },
    { capture: true }
  );

  console.log(
    "[LUX] phoneme chips: click-to-play enabled (toggle + watchdog + retract lock)"
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

  // UNLOCK: allow hover bulge again and give a tiny "pop" cue
  releaseRetractLock(chip);
  popOnStop(chip);

  stopWatchdog();

  if (currentPlaying === entry) currentPlaying = null;
}

/* ====================== 3) Retract lock + stop pop ====================== */

// Force chip to normal size even while hovered.
function applyRetractLock(chip) {
  if (!chip) return;
  chip.classList.add("lux-playing-lock");
  chip.style.transition = "transform 120ms ease-out";
  chip.style.transform = "scale(1)";
}

// Remove inline override so :hover bulge works again.
function releaseRetractLock(chip) {
  if (!chip) return;
  chip.classList.remove("lux-playing-lock");
  chip.style.transform = "";
  chip.style.transition = "";
}

// Small visual cue on stop, then hover CSS takes over naturally.
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

/* ====================== 4) Watchdog: stop when tooltip hides or chip leaves view ====================== */

function startWatchdog() {
  stopWatchdog();

  watchdogId = setInterval(() => {
    if (!currentPlaying?.chip || !currentPlaying?.video) {
      stopWatchdog();
      return;
    }

    const { chip } = currentPlaying;

    // 1) Chip removed from DOM
    if (!document.body.contains(chip)) {
      stopPlayback(currentPlaying);
      return;
    }

    // 2) Chip out of viewport (works no matter which container scrolls)
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

    // 3) Tooltip no longer visible (scroll often cancels hover)
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
