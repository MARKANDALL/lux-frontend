// ui/interactions/ph-audio.js
export function initPhonemeAudio() {
  const btn = document.getElementById("phonemeAudioBtn");
  const pill = document.querySelector("#phonemeHeader .phoneme-chip");
  const vid = document.getElementById("phDemo");
  const tip = document.getElementById("phUnmuteTip");
  if (!vid) return;

  function toggle(e) {
    e.stopPropagation();
    vid.muted = !vid.muted;
    if (vid.paused) vid.play().catch(() => {});
    if (pill) pill.classList.toggle("is-playing", !vid.muted);
    if (tip) {
      tip.textContent = vid.muted ? "Muted" : "Audio on";
      tip.style.display = "block";
      setTimeout(() => {
        tip.style.display = "none";
      }, 1500);
    }
  }
  if (btn && !btn._phA) {
    btn.addEventListener("click", toggle);
    btn._phA = 1;
  }
  if (pill && !pill._phA) {
    pill.addEventListener("click", toggle);
    pill._phA = 1;
  }
}
