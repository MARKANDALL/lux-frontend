// features/onboarding/lux-onboarding.js
// Premium 4-card onboarding deck (do > explain)

const SEEN_KEY = "LUX_ONBOARD_V1_SEEN";

const STEPS = [
  {
    key: "welcome",
    stepLabel: "Welcome",
    title: "Welcome to Lux",
    bodyHtml: `
      <div>Master your pronunciation with 60-second sprints. Your progress saves automatically.</div>
    `,
    primary: { label: "Start setup" },
    secondary: { label: "Skip tour", kind: "link" },
  },
  {
    key: "mic",
    stepLabel: "Mic",
    title: "Enable your mic",
    bodyHtml: `
      <div>Tap below, then select <b>Allow</b> when your browser asks.</div>
      <div class="lux-onb-tip">
        <span class="lux-onb-tip-dot">i</span>
        <span><b>Tip:</b> quiet room + <b>good mic</b> = best scores</span>
      </div>
      <div class="lux-onb-meter" aria-label="Mic level meter"><span></span></div>
      <div id="luxOnbMicMsg" style="margin-top:10px; font-size:14px; color: rgba(31,41,55,0.62);"></div>
    `,
    primary: { label: "Allow microphone access", action: "requestMic" },
    secondary: { label: "Skip tour", kind: "link" },
  },
  {
    key: "try",
    stepLabel: "Try",
    title: "Your first recording",
    bodyHtml: `
      <div>Pick a short phrase and hit <b>Record</b>. We’ll analyze your speech and show results.</div>
    `,
    primary: { label: "● Try a sample phrase", action: "samplePhrase" }, // red-circle muscle memory
    secondary: { label: "Browse all lessons", action: "browseLessons", kind: "link" },
  },
  {
    key: "finish",
    stepLabel: "Finish",
    title: "See your growth",
    bodyHtml: `
      <div>After each session, you’ll get:</div>
      <ul class="lux-onb-bullets">
        <li><b>Scores</b>: Accuracy, Fluency, and Prosody</li>
        <li><b>Visuals</b>: mouth-shape videos for your trouble sounds</li>
      </ul>
    `,
    primary: { label: "Start practicing", action: "startPracticing" },
  },
];

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

  const elTitle = $("#luxOnbTitle");
  const elBody = $("#luxOnbBody");
  const elStepper = $("#luxOnbStepper");
  const btnPrev = $("#luxOnbPrev");
  const btnPrimary = $("#luxOnbPrimary");
  const btnSecondary = $("#luxOnbSecondary");
  const btnDone = $("#luxOnbDone");
  const btnSkip = $("#luxOnbSkip");

  function close(markSeen = true) {
    stopMic(state);
    if (markSeen) localStorage.setItem(SEEN_KEY, "1");
    overlay.remove();
  }

  // Close on ESC
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    }
  }
  document.addEventListener("keydown", onKey, { capture: true });

  // Click outside closes (optional)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close(true);
  });

  btnSkip.addEventListener("click", () => close(true));
  btnDone.addEventListener("click", () => close(true));

  btnPrev.addEventListener("click", () => {
    state.i = Math.max(0, state.i - 1);
    render();
  });

  btnSecondary.addEventListener("click", async () => {
    const step = STEPS[state.i];
    if (!step.secondary) return;

    if (step.secondary.action) await runAction(step.secondary.action);
    else close(true); // "Skip tour"
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
        close(true);
      }
      return;
    }

    if (step.primary?.action) {
      await runAction(step.primary.action);
      return;
    }

    // default primary = Next
    if (state.i < STEPS.length - 1) {
      state.i++;
      render();
    } else {
      close(true);
    }
  });

  async function runAction(action) {
    switch (action) {
      case "requestMic":
        await requestMic(state, card);
        // Re-render so the primary button becomes "Next" when mic is ready
        render();
        break;

      case "samplePhrase":
        trySamplePhrase();
        // After doing the action, advance
        state.i = Math.min(STEPS.length - 1, state.i + 1);
        render();
        break;

      case "browseLessons":
        close(true);
        tryBrowseLessons();
        break;

      case "startPracticing":
        close(true);
        tryStartPracticing();
        break;

      default:
        // no-op
        break;
    }
  }

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
      // If we’re on mic step and already have analyser, resume meter
      resumeMeterIfPossible(state, card);
    }
  }

  render();

  // Clean up key handler on close
  const origClose = close;
  function closeWrapped(markSeen = true) {
    document.removeEventListener("keydown", onKey, { capture: true });
    origClose(markSeen);
  }

  // Rebind close to wrapped
  close = closeWrapped; // eslint-disable-line no-func-assign
}

/* ---------------- Actions ---------------- */

async function requestMic(state, card) {
  const stepPrimary = card.querySelector("#luxOnbPrimary");
  const msg = card.querySelector("#luxOnbMicMsg");

  try {
    stepPrimary.disabled = true;
    stepPrimary.textContent = "Requesting…";

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mic.stream = stream;
    state.mic.ready = true;

    if (msg) msg.textContent = "Mic ready ✓ Try speaking — you should see the meter move.";

    // Build analyser + start meter
    setupAnalyser(state);
    resumeMeterIfPossible(state, card);

    // Keep it clickable (render() will convert to "Next" on success)
    stepPrimary.classList.add("is-success");
    stepPrimary.disabled = false;
  } catch (err) {
    state.mic.ready = false;

    if (msg) {
      msg.textContent =
        "Mic blocked. Click the 🔒 icon in your browser bar to reset permissions.";
    }

    // Restore button so they can try again
    stepPrimary.disabled = false;
    stepPrimary.textContent = "Allow microphone access";
    stepPrimary.classList.remove("is-success");
  }
}

function setupAnalyser(state) {
  if (!state.mic.stream) return;

  // Reuse if already built
  if (state.mic.audioCtx && state.mic.analyser) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const audioCtx = new AudioCtx();
  const source = audioCtx.createMediaStreamSource(state.mic.stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  state.mic.audioCtx = audioCtx;
  state.mic.analyser = analyser;
}

function resumeMeterIfPossible(state, card) {
  const span = card.querySelector(".lux-onb-meter > span");
  if (!span || !state.mic.analyser) return;

  // Stop any prior loop
  stopMeterOnly(state);

  const analyser = state.mic.analyser;
  const data = new Uint8Array(analyser.frequencyBinCount);

  function tick() {
    analyser.getByteTimeDomainData(data);

    // crude energy estimate (0..1)
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);

    // map to scaleX (keep ghosty, never fully flat)
    const scale = Math.min(1, Math.max(0.10, rms * 3.2));
    span.style.transform = `scaleX(${scale.toFixed(3)})`;

    state.mic.raf = requestAnimationFrame(tick);
  }

  state.mic.raf = requestAnimationFrame(tick);
}

function stopMeterOnly(state) {
  if (state.mic.raf) cancelAnimationFrame(state.mic.raf);
  state.mic.raf = null;
}

function stopMic(state) {
  stopMeterOnly(state);

  if (state.mic.audioCtx) {
    try { state.mic.audioCtx.close(); } catch (_) {}
  }
  state.mic.audioCtx = null;
  state.mic.analyser = null;

  if (state.mic.stream) {
    try { state.mic.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
  }
  state.mic.stream = null;
  state.mic.ready = false;
}

function trySamplePhrase() {
  const sample = "The quick brown fox jumps over the lazy dog.";

  // Try: textarea with your placeholder text
  const ta = Array.from(document.querySelectorAll("textarea"))
    .find((t) => (t.getAttribute("placeholder") || "").toLowerCase().includes("paste or type"));

  if (ta) {
    ta.focus();
    ta.value = sample;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // Fallback: copy to clipboard
  try { navigator.clipboard.writeText(sample); } catch (_) {}
}

function tryBrowseLessons() {
  // If you have a “Browse” button/link, click it.
  // Add a data attribute on your real button (recommended): data-lux-browse-lessons
  document.querySelector("[data-lux-browse-lessons]")?.click();
}

function tryStartPracticing() {
  // Focus your Record button if present
  const btn =
    document.querySelector("[data-lux-record]") ||
    Array.from(document.querySelectorAll("button")).find((b) =>
      (b.textContent || "").trim().toLowerCase() === "record"
    );

  btn?.focus?.();
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
