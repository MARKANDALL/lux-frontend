// ui/interactions/tips.js
export function animateMetricTips() {
  [
    "Accuracy",
    "Fluency",
    "Completeness",
    "Pronunciation",
    "Phonemes",
    "Prosody",
    "ProsodyBars",
  ].forEach((key, idx) => {
    const el = document.querySelector("#prettyResult .tip-" + key);
    if (!el) return;
    el.classList.remove("hidden");
    void el.offsetWidth;
    el.classList.add("hidden");
    setTimeout(() => {
      el.classList.remove("hidden");
      el.classList.add("pop-in");
      setTimeout(() => el.classList.remove("pop-in"), 1200);
    }, 800 + idx * 350);
  });
}
