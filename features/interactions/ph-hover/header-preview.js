// features/interactions/ph-hover/header-preview.js
// Header phoneme preview behavior (pill hover -> preview box)
// Keeps headerAudioOn state stable across open/close.

import { safePlay } from "../utils.js";

export function installHeaderPreview(state) {
  const preview = document.getElementById("phPreview");
  const demoVid = document.getElementById("phDemo");
  const phHeader = document.getElementById("phonemeHeader");
  const pill = phHeader?.querySelector(".phoneme-chip");
  const tip = document.getElementById("phUnmuteTip");

  if (!preview || !demoVid || !phHeader || !pill) return;

  if (pill._hoverBound) return;
  pill._hoverBound = true;

  function positionPreview() {
    const rect = phHeader.getBoundingClientRect();

    let left = rect.left - 560 - 10;
    if (left < 10) left = 10;

    let top = rect.top;
    if (top + 390 > window.innerHeight) top = window.innerHeight - 390 - 10;

    preview.style.left = left + "px";
    preview.style.top = top + "px";
  }

  function showPreview() {
    if (preview.style.display === "block") return;

    preview.style.display = "block";
    positionPreview();

    // IMPORTANT: do NOT force-mute on hover.
    // Respect current headerAudioOn state.
    demoVid.muted = !state.headerAudioOn;
    demoVid.volume = 1.0;

    // Start/restart muted or unmuted based on state.
    safePlay(demoVid, demoVid.getAttribute("src"), {
      muted: demoVid.muted,
      restart: true,
    });

    pill.classList.toggle("is-playing", state.headerAudioOn);

    if (tip) tip.style.display = "none";
  }

  function hidePreview() {
    preview.style.display = "none";
    demoVid.pause();
    demoVid.currentTime = 0;

    // IMPORTANT: do NOT force demoVid.muted=true here;
    // leaving state intact makes click-toggle feel consistent.
    pill.classList.remove("is-playing");

    if (tip) tip.style.display = "none";
  }

  // Hover behavior: pill <-> preview bridge
  pill.addEventListener("mouseover", showPreview);

  pill.addEventListener("mouseout", (e) => {
    const to = e.relatedTarget;
    if (to && (to === preview || preview.contains(to))) return;
    hidePreview();
  });

  preview.addEventListener("mouseout", (e) => {
    const to = e.relatedTarget;
    if (to && (to === pill || pill.contains(to))) return;
    hidePreview();
  });
}
