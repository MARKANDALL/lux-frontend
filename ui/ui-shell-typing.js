// ui/ui-shell-typing.js
// Rotating placeholder + one-time typewriter prompt
// Exported API: initUI()

export function initUI() {
  const refInput = document.getElementById("referenceText");
  const typingEl = document.getElementById("typewriterMsg");
  if (!refInput || !typingEl) return;

  // If we've already wired this once, bail (prevents duplicate typewriter)
  if (typingEl.dataset.typingAttached === "true") return;
  typingEl.dataset.typingAttached = "true"; // <— signal to other modules

  // Rotating placeholder messages
  const messages = [
    "Type something, then practice saying it",
    "Select a sound designed option",
    "Read how to make the sounds in the results",
    "Watch videos for correct tongue and lip placement",
    "Read the A.I. feedback analysis",
    "See a detailed video lesson!",
  ];
  let idx = 0;

  function rotate() {
    refInput.setAttribute("placeholder", messages[idx]);
    idx = (idx + 1) % messages.length;
  }
  const rotateTimer = setInterval(rotate, 3500);
  rotate();

  // One-time typewriter prompt
  const TYPE_LINE =
    "Here you can type whatever you want to practice saying, then press Record⬇️, or you can select a passage above ↖️";

  function typeWriter(i = 0) {
    if (i === 0) typingEl.textContent = ""; // ensure fresh start
    if (i < TYPE_LINE.length) {
      typingEl.textContent += TYPE_LINE.charAt(i);
      setTimeout(() => typeWriter(i + 1), 35);
    }
  }

  function onFirstFocus() {
    clearInterval(rotateTimer);
    refInput.removeEventListener("focus", onFirstFocus);
    typingEl.classList.remove("hidden");
    typingEl.style.opacity = "1";
    typeWriter();
    refInput.classList.add("placeholder-fade");
    setTimeout(() => refInput.setAttribute("placeholder", ""), 500);
  }

  function fadePrompt() {
    if (typingEl.style.opacity !== "0") {
      typingEl.style.opacity = "0";
      setTimeout(() => typingEl.classList.add("hidden"), 600);
    }
  }

  refInput.addEventListener("focus", onFirstFocus, { once: true });
  refInput.addEventListener("input", fadePrompt);

  // ---- NEW: auto-switch passage to "Write your own" on first focus --------
  (function ensureCustomWhenTyping() {
    const sel = document.getElementById("passageSelect");
    if (!sel) return;

    // Ensure there is a visible "custom" option
    if (!sel.querySelector('option[value="custom"]')) {
      const opt = document.createElement("option");
      opt.value = "custom";
      opt.textContent = "Write your own";
      sel.appendChild(opt);
    }

    const goCustom = () => {
      if (sel.value !== "custom") {
        sel.value = "custom";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    // Attach once, same timing as typewriter kick-off
    refInput.addEventListener("focus", goCustom, { once: true });
  })();
}
