// features/onboarding/lux-onboarding.js
// Premium 4-card onboarding deck (do > explain)

import { SEEN_KEY, STEPS } from "./onboarding-steps.js";
import { stopMic, stopMeterOnly, resumeMeterIfPossible } from "./onboarding-mic.js";
import { runAction } from "./onboarding-actions.js";

export function maybeShowOnboarding() {
  // Force open via ?onboard=1
  const params = new URLSearchParams(location.search);
  const force = params.get("onboard") === "1";

  if (!force && localStorage.getItem(SEEN_KEY) === "1") return;
  showOnboarding();
}

function showOnboarding() {
  const state = {
    i: 0,
    mic: { ready: false, stream: null, audioCtx: null, raf: null, analyser: null },
  };

  const overlay = document.createElement("div");
  overlay.className = "lux-onb-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const card = document.createElement("div");
  card.className = "lux-onb-card";
  card.innerHTML = `
    <div class="lux-onb-accent"></div>

    <div class="lux-onb-header">
      <h2 class="lux-onb-title" id="luxOnbTitle"></h2>
      <button class="lux-onb-skip" id="luxOnbSkip" type="button">Skip</button>
    </div>

    <div class="lux-onb-body" id="luxOnbBody"></div>

    <div class="lux-onb-stepper" id="luxOnbStepper"></div>

    <div class="lux-onb-footer">
      <div class="lux-onb-left">
        <button class="lux-onb-btn" id="luxOnbPrev" type="button">Prev</button>
      </div>
      <div class="lux-onb-right">
        <button class="lux-onb-btn lux-onb-btn-link" id="luxOnbSecondary" type="button"></button>
        <button class="lux-onb-btn lux-onb-btn-primary" id="luxOnbPrimary" type="button"></button>
        <button class="lux-onb-btn" id="luxOnbDone" type="button" style="display:none;">Done</button>
      </div>
    </div>
  `;
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const $ = (sel) => card.querySelector(sel);

  const elTitle     = $("#luxOnbTitle");
  const elBody      = $("#luxOnbBody");
  const elStepper   = $("#luxOnbStepper");
  const btnPrev     = $("#luxOnbPrev");
  const btnPrimary  = $("#luxOnbPrimary");
  const btnSecondary = $("#luxOnbSecondary");
  const btnDone     = $("#luxOnbDone");
  const btnSkip     = $("#luxOnbSkip");

  function close(markSeen = true) {
    stopMic(state);
    if (markSeen) localStorage.setItem(SEEN_KEY, "1");
    overlay.remove();
  }

  // Close on ESC
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeWrapped(true);
    }
  }
  document.addEventListener("keydown", onKey, { capture: true });

  function closeWrapped(markSeen = true) {
    document.removeEventListener("keydown", onKey, { capture: true });
    close(markSeen);
  }

  // Click outside closes
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeWrapped(true);
  });

  btnSkip.addEventListener("click", () => closeWrapped(true));
  btnDone.addEventListener("click", () => closeWrapped(true));

  btnPrev.addEventListener("click", () => {
    state.i = Math.max(0, state.i - 1);
    render();
  });

  btnSecondary.addEventListener("click", async () => {
    const step = STEPS[state.i];
    if (!step.secondary) return;

    if (step.secondary.action) await runAction(step.secondary.action, { state, card, render, close: closeWrapped });
    else closeWrapped(true); // "Skip tour"
  });

  btnPrimary.addEventListener("click", async () => {
    const step = STEPS[state.i];

    // SPECIAL CASE:
    // Mic step primary is "requestMic" initially, but once ready it should act like Next.
    if (step.key === "mic" && state.mic.ready) {
      if (state.i < STEPS.length - 1) {
        state.i++;
        render();
      } else {
        closeWrapped(true);
      }
      return;
    }

    if (step.primary?.action) {
      await runAction(step.primary.action, { state, card, render, close: closeWrapped });
      return;
    }

    // default primary = Next
    if (state.i < STEPS.length - 1) {
      state.i++;
      render();
    } else {
      closeWrapped(true);
    }
  });

  function render() {
    const step = STEPS[state.i];
    elTitle.textContent = step.title;
    elBody.innerHTML = step.bodyHtml;

    // Stepper
    elStepper.innerHTML = STEPS.map((s, idx) => {
      const active = idx === state.i ? " is-active" : "";
      return `
        <div class="lux-onb-step${active}">
          <div class="lux-onb-dot"></div>
          <div class="lux-onb-label">${escapeHtml(s.stepLabel)}</div>
        </div>
      `;
    }).join("");

    // Buttons
    btnPrev.disabled = state.i === 0;

    const isLast = state.i === STEPS.length - 1;
    btnDone.style.display = isLast ? "inline-flex" : "none";

    // Secondary
    if (step.secondary) {
      btnSecondary.style.display = "inline-flex";
      btnSecondary.textContent = step.secondary.label;
      btnSecondary.className = step.secondary.kind === "link"
        ? "lux-onb-btn lux-onb-btn-link"
        : "lux-onb-btn";
    } else {
      btnSecondary.style.display = "none";
    }

    // Primary
    btnPrimary.textContent = step.primary?.label || (isLast ? "Done" : "Next");
    btnPrimary.classList.toggle("is-success", false);
    btnPrimary.disabled = false;

    // If mic is ready on mic step, allow Next
    if (step.key === "mic" && state.mic.ready) {
      btnPrimary.textContent = "Next";
      btnPrimary.disabled = false;
      btnPrimary.classList.remove("is-success");
      const msg = card.querySelector("#luxOnbMicMsg");
      if (msg) msg.textContent = "Mic ready ✓ Try speaking — you should see the meter move.";
    }

    // Always keep skip in top-right
    btnSkip.style.display = "inline-flex";

    // If we left mic step, stop the meter but keep permission (stream)
    if (step.key !== "mic") {
      stopMeterOnly(state);
    } else {
      // If we're on mic step and already have analyser, resume meter
      resumeMeterIfPossible(state, card);
    }
  }

  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}