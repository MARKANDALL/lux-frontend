// ui/interactions/yg-hover.js
import { safePlay } from "./utils.js";

export function setupYGHover() {
  const preview = document.getElementById("ygPreview");
  const demoVid = document.getElementById("ygDemo");
  const unmuteUI = document.getElementById("unmuteTip");
  const wordHdr = document.getElementById("wordHeader");
  const wordPill = wordHdr && wordHdr.querySelector(".word-chip");
  if (!preview || !demoVid || !wordHdr || !wordPill) return;
  if (wordPill._ygBound) return;
  wordPill._ygBound = true;

  function showPreview() {
    const rect = wordPill.getBoundingClientRect();
    preview.style.left = rect.right + 10 + "px";
    preview.style.top = rect.top + "px";
    preview.style.display = "block";
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
  }
  function maybeHideFromPill(e) {
    const to = e.relatedTarget;
    if (to && (to === preview || preview.contains(to))) return;
    hidePreview();
  }
  function maybeHideFromPreview(e) {
    const to = e.relatedTarget;
    if (to && (to === wordPill || wordPill.contains(to))) return;
    hidePreview();
  }

  wordPill.addEventListener("mouseover", showPreview);
  wordPill.addEventListener("mouseout", maybeHideFromPill);
  preview.addEventListener("mouseout", maybeHideFromPreview);

  wordPill.addEventListener("click", (e) => {
    e.stopPropagation();
    demoVid.muted = !demoVid.muted;
    if (demoVid.paused) demoVid.play().catch(() => {});
    if (unmuteUI) {
      unmuteUI.textContent = demoVid.muted ? "Muted" : "Audio on";
      unmuteUI.style.display = "block";
      setTimeout(() => {
        unmuteUI.style.display = "none";
      }, 1500);
    }
    wordPill.classList.toggle("is-playing", !demoVid.muted);
  });
}
