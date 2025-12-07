/* ============================================================================
   LEGACY / INACTIVE MODULE (do not revive)
   ---------------------------------------------------------------------------
   - Canonical results renderer: ui/views/index.js (lux-results-root)
   - This file is kept only for reference until its useful pieces are ported.
   - Do not attach window.* globals here.
   - Safe to move to /legacy after grep confirms zero callers.
============================================================================ */
/*
// helpers/media.js
export function setupYGHover({
  previewId = "ygPreview",
  videoId = "ygDemo",
  unmuteId = "unmuteTip",
  headerId = "wordHeader",
  pillSelector = ".word-chip",
} = {}) {
  const preview = document.getElementById(previewId);
  const demoVid = document.getElementById(videoId);
  const unmuteUI = document.getElementById(unmuteId);
  const wordHdr = document.getElementById(headerId);
  const wordPill = wordHdr?.querySelector(pillSelector);
  if (!preview || !demoVid || !wordHdr || !wordPill) return;

  wordPill.addEventListener("click", (e) => {
    e.stopPropagation();
    demoVid.muted = !demoVid.muted;
    if (unmuteUI) unmuteUI.style.display = demoVid.muted ? "none" : "block";
    if (!demoVid.muted && unmuteUI)
      setTimeout(() => (unmuteUI.style.display = "none"), 2500);
    wordPill.classList.toggle("is-playing", !demoVid.muted);
  });

  wordHdr.addEventListener("mouseenter", () => {
    const rect = wordHdr.getBoundingClientRect();
    preview.style.left = rect.right + 10 + "px";
    preview.style.top = rect.top + "px";
    preview.style.display = "block";
    demoVid.currentTime = 0;
    demoVid.muted = true;
    demoVid.play().catch(() => {});
  });

  const hide = () => {
    preview.style.display = "none";
    demoVid.pause();
    demoVid.currentTime = 0;
    demoVid.muted = true;
    if (unmuteUI) unmuteUI.style.display = "none";
    document.getElementById("phonemeTitle")?.classList.remove("is-playing");
  };
  wordHdr.addEventListener("mouseleave", hide);
  preview.addEventListener("mouseleave", hide);
}

export function setupPhHeaderHover({
  previewId = "phPreview",
  videoId = "phDemo",
  tipId = "phUnmuteTip",
  headerId = "phonemeHeader",
  pillSelector = ".phoneme-chip",
} = {}) {
  const preview = document.getElementById(previewId);
  const demoVid = document.getElementById(videoId);
  const tip = document.getElementById(tipId);
  const phHdr = document.getElementById(headerId);
  const pill = phHdr?.querySelector(pillSelector);
  if (!preview || !demoVid || !phHdr || !pill) return;

  phHdr.addEventListener("mouseenter", () => {
    preview.style.display = "block";
    const rect = phHdr.getBoundingClientRect();
    const popW = preview.offsetWidth || 560;
    const popH = preview.offsetHeight || 390;
    let left = rect.left - popW - 10;
    if (left < 10) left = 10;
    let top = rect.top;
    if (top + popH > window.innerHeight - 10)
      top = window.innerHeight - popH - 10;
    if (top < 10) top = 10;
    preview.style.left = left + "px";
    preview.style.top = top + "px";
    demoVid.currentTime = 0;
    demoVid.muted = true;
    demoVid.play().catch(() => {});
  });

  const hide = () => {
    preview.style.display = "none";
    demoVid.pause();
    demoVid.currentTime = 0;
    demoVid.muted = true;
    if (tip) tip.style.display = "none";
    document.getElementById("phonemeTitle")?.classList.remove("is-playing");
  };
  phHdr.addEventListener("mouseleave", hide);
  preview.addEventListener("mouseleave", hide);
}

export function initPhonemeAudio({
  buttonId = "phonemeAudioBtn",
  pillId = "phonemeTitle",
  videoId = "phDemo",
  tipId = "phUnmuteTip",
} = {}) {
  const btn = document.getElementById(buttonId);
  const pill = document.getElementById(pillId);
  const vid = document.getElementById(videoId);
  const tip = document.getElementById(tipId);
  if (!vid) return;

  function toggle(e) {
    e.stopPropagation();
    vid.muted = !vid.muted;
    if (vid.paused) vid.play().catch(() => {});
    pill?.classList.toggle("is-playing", !vid.muted);
    if (tip) {
      tip.textContent = vid.muted ? "Muted" : "Audio on";
      tip.style.display = "block";
      setTimeout(() => (tip.style.display = "none"), 1500);
    }
  }
  btn?.addEventListener("click", toggle);
  pill?.addEventListener("click", toggle);
}

export function initPhonemeClickPlay(containerSelector = "#prettyResult") {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll("td .tooltip").forEach((pill) => {
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      const vid = pill.querySelector("video");
      if (!vid) return;
      container.querySelectorAll("video").forEach((v) => {
        if (v !== vid) {
          v.pause();
          v.currentTime = 0;
        }
      });
      if (vid.paused) {
        vid.currentTime = 0;
        vid.muted = false;
        vid.play().catch(() => {});
        pill.classList.add("is-playing");
      } else {
        vid.pause();
        pill.classList.remove("is-playing");
      }
    });
  });
}
