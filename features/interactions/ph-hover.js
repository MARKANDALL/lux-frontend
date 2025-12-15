// features/interactions/ph-hover.js
// Phoneme hover interactions
// UPDATED: Fully robust version. Supports Global Tooltip playback + Watchdog/Animations.

import { safePlay } from "./utils.js";
import { getGlobalVideoElement } from "./ph-chips.js"; 

/* ====================== Public entry ====================== */

export function setupPhonemeHover() {
  installHeaderPreview();
  installChipClickPlay();

  console.log(
    "[LUX] phoneme hover: header preview enabled, global hover play enabled"
  );
}

/* ====================== 1) Header preview (MATCHES WORD HEADER LOGIC) ====================== */

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

/* ====================== 2) Chip click-to-play (Global Tooltip Aware) ====================== */

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

      e.preventDefault();
      e.stopPropagation();

      // 1. Try to find the video in the Global Tooltip (Standard flow)
      let video = getGlobalVideoElement();
      
      // 2. Fallback: If global tip isn't ready, trigger creation manually
      if (!video) {
          chip.dispatchEvent(new Event('mouseenter'));
          video = getGlobalVideoElement();
      }

      if (!video) return;

      // Logic: If clicking the SAME active chip, toggle pause
      if (
        currentPlaying &&
        currentPlaying.chip === chip &&
        currentPlaying.video === video &&
        !video.paused
      ) {
        stopPlayback(currentPlaying);
        return;
      }

      // Logic: If clicking a DIFFERENT chip, stop the old one
      if (
        currentPlaying &&
        currentPlaying.video &&
        !currentPlaying.video.paused
      ) {
        stopPlayback(currentPlaying);
      }

      // Visual feedback on chip
      applyRetractLock(chip);

      currentPlaying = { chip, video };
      startWatchdog();

      try {
        // Toggle Mute / Restart
        video.muted = false;
        video.volume = 1;
        
        try {
            video.currentTime = 0;
        } catch {}

        // Promise-based play to handle browser policies
        const p = video.play();
        if (p !== undefined) {
            p.catch(err => {
                console.warn("Autoplay blocked, try interacting first", err);
            });
        }

      } catch (err) {
        console.warn("[LUX] chip click play error", err);
      }

      // Cleanup visual lock when done
      video.onended = () => {
        if (currentPlaying?.video === video) stopPlayback(currentPlaying);
      };
      
      // Also release if mouse leaves (hides tooltip)
      chip.addEventListener("mouseleave", () => {
         // We don't stop playback immediately on leave anymore (sticky tooltip),
         // but we can release the visual lock if preferred.
         // keeping original logic:
         // stopPlayback(currentPlaying); 
      }, { once: true });
    },
    { capture: true }
  );

  console.log(
    "[LUX] phoneme chips: click-to-play enabled (Global Tooltip + Watchdog)"
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
    // Don't mute immediately if using global video, might jar user
    // video.muted = true; 
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
  chip.style.transform = "scale(1.1)";
  chip.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.3)";
}

function releaseRetractLock(chip) {
  if (!chip) return;
  chip.classList.remove("lux-playing-lock");
  chip.style.transform = "";
  chip.style.boxShadow = "";
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
    
    // Safety check: is chip still in DOM?
    if (!document.body.contains(chip)) {
      stopPlayback(currentPlaying);
      return;
    }
    
    // Safety check: is chip scrolled off screen?
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
    
    // Note: We don't check for tooltip visibility anymore because
    // the video is now in the global tooltip, not inside the chip.
  }, 120);
}

function stopWatchdog() {
  if (watchdogId) {
    clearInterval(watchdogId);
    watchdogId = null;
  }
}