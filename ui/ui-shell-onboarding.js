// ui/ui-shell-onboarding.js
// Onboarding overlay (v2) + first-paint hydration for the blue #userMsg card,
// plus small first-paint helpers (UID links + textarea placeholder fade).

/* --------------------------- Config / constants --------------------------- */

// Base host for admin dashboards (overrideable for staging/local)
const ADMIN_BASE =
  window.ADMIN_BASE || "https://luxury-language-api.vercel.app";

const SEEN = "onboarding.v2.seen";
const STEP = "onboarding.v2.step";

/* ------------------------------ Tiny helpers ----------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------------------- UID & admin links (absolute) --------------------- */
function hydrateUidAndLinks() {
  const uid = window.LUX_USER_ID || "";
  $("#lux-uid")?.replaceChildren(document.createTextNode(uid || "—"));
  const q = uid ? `?uid=${encodeURIComponent(uid)}` : "";

  // Match your deployed admin pages:
  $("#lux-link-attempts")?.setAttribute(
    "href",
    `${ADMIN_BASE}/admin/user.html${q}`
  );
  $("#lux-link-progress")?.setAttribute("href", `${ADMIN_BASE}/admin/${q}`);
  $("#lux-link-cohort")?.setAttribute(
    "href",
    `${ADMIN_BASE}/admin/overview.html`
  );
}

/* ----------------------- Blue 3-line card first paint -------------------- */
function ensureUserMsgVisible() {
  const card = $("#userMsg");
  if (!card) return;
  // Add .show after paint so its CSS transition plays (idempotent)
  requestAnimationFrame(() => card.classList.add("show"));
}

/* ------------------ Placeholder fade for the textarea -------------------- */
// This is the exact helper you asked to include.
function installPlaceholderFade() {
  const input = document.getElementById("referenceText");
  if (!input || input._placeholderWired) return;
  input._placeholderWired = true;

  const update = () => {
    const active = document.activeElement === input;
    if (active || input.value.trim()) input.classList.add("placeholder-fade");
    else input.classList.remove("placeholder-fade");
  };
  ["focus", "blur", "input"].forEach((ev) =>
    input.addEventListener(ev, update)
  );
  update();
}

/* --------------------------- Overlay controller -------------------------- */
function setupOverlayControls(overlay) {
  const slides = $$(".ob-slide", overlay);
  const dots = $$(".ob-dot", overlay);
  const btnPrev = $("#obPrev", overlay);
  const btnNext = $("#obNext", overlay);
  const btnClose = $("#obCloseBtn", overlay);
  const btnDone = $("#obDone", overlay);
  const btnStart = $("#obStartRecording", overlay);
  const btnMic = $("#obEnableMic", overlay);
  const btnText = $("#obFocusText", overlay);
  const micNote = $("#obMicStatus", overlay);
  const textArea = $("#referenceText");
  const recordBtn = $("#record");

  const setStep = (n) => {
    slides.forEach((s) => s.classList.add("ob-hidden"));
    dots.forEach((d) => d.setAttribute("aria-current", "false"));
    slides[n - 1]?.classList.remove("ob-hidden");
    dots[n - 1]?.setAttribute("aria-current", "true");
    try {
      localStorage.setItem(STEP, String(n));
    } catch {}
  };

  const open = (n = 1) => {
    overlay.classList.remove("ob-hidden");
    document.body.style.overflow = "hidden";
    setStep(n);
  };
  const close = () => {
    overlay.classList.add("ob-hidden");
    document.body.style.overflow = "";
  };

  // First-time auto-open
  const seen = (() => {
    try {
      return localStorage.getItem(SEEN) === "true";
    } catch {
      return false;
    }
  })();
  if (!seen) {
    let last = 1;
    try {
      last = parseInt(localStorage.getItem(STEP) || "1", 10) || 1;
    } catch {}
    open(Math.max(1, Math.min(slides.length, last)));
  }

  // Dots & arrows
  dots.forEach((d) =>
    d.addEventListener("click", () => setStep(parseInt(d.dataset.go, 10)))
  );
  btnPrev?.addEventListener("click", () =>
    setStep(
      Math.max(1, (parseInt(localStorage.getItem(STEP) || "1", 10) || 1) - 1)
    )
  );
  btnNext?.addEventListener("click", () =>
    setStep(
      Math.min(
        slides.length,
        (parseInt(localStorage.getItem(STEP) || "1", 10) || 1) + 1
      )
    )
  );

  const markSeenAndClose = () => {
    try {
      localStorage.setItem(SEEN, "true");
    } catch {}
    close();
  };
  btnClose?.addEventListener("click", markSeenAndClose);
  btnDone?.addEventListener("click", markSeenAndClose);

  // Mic test
  btnMic?.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (micNote) micNote.textContent = "❌ Mic not supported.";
      return;
    }
    if (micNote) micNote.textContent = "Requesting mic…";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      if (micNote) micNote.textContent = "✅ Microphone ready";
      btnNext?.click();
    } catch {
      if (micNote) micNote.textContent = "❌ Please allow mic access.";
    }
  });

  // Focus textarea
  btnText?.addEventListener("click", () => {
    close();
    setTimeout(() => {
      textArea?.focus();
      textArea?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  });

  // Start recording
  btnStart?.addEventListener("click", () => {
    if (recordBtn && !recordBtn.disabled) recordBtn.click();
    setStep(4);
  });

  // Keyboard shortcuts while overlay is open
  window.addEventListener("keydown", (e) => {
    if (overlay.classList.contains("ob-hidden")) return;
    if (e.key === "Escape") {
      try {
        localStorage.setItem(SEEN, "true");
      } catch {}
      close();
    }
    if (e.key === "ArrowLeft") btnPrev?.click();
    if (e.key === "ArrowRight") btnNext?.click();
  });
}

/* --------------- Cooperative placeholder sample rotator ------------------ */
// Note: this stops automatically the moment your real typewriter attaches.
function installCooperativeRotator() {
  const ph = $("#typewriterMsg");
  if (!ph || ph.dataset.typingAttached === "true") return;

  const examples = [
    "Audio note: “Schedule a sales demo for 10am”",
    "Phone message: “Hi, this is Mark — please call me back”",
    "Interview intro: “Thanks for having me…”",
    "Tricky phrase: “third thorough thought”",
    "Speech closer: “In short, here’s why…”",
  ];
  let i = 0;
  const timer = setInterval(() => {
    if (ph.dataset.typingAttached === "true") {
      clearInterval(timer);
      return;
    }
    if (ph.offsetParent !== null)
      ph.textContent = examples[i++ % examples.length];
  }, 2400);
}

/* ------------------------------- Public API ------------------------------ */
let didInit = false;
export function initOnboarding() {
  if (didInit) return;
  didInit = true;

  hydrateUidAndLinks();
  // ensureUserMsgVisible(); // <--- DISABLED: Let boot.js handle the timing
  installPlaceholderFade();
  installCooperativeRotator();

  const overlay = $("#onboardingOverlay");
  if (overlay) setupOverlayControls(overlay);
}

// Back-compat: also expose on window
window.initOnboarding = initOnboarding;

/* --------------------------------- Boot ---------------------------------- */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOnboarding, { once: true });
} else {
  initOnboarding();
}
