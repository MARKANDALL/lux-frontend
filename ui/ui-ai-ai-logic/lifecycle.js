// ui/ui-ai-ai-logic/lifecycle.js
// AI Coach lifecycle wiring (always-on shell + persona/language change handlers).
// Extracted from ui/ui-ai-ai-logic.js (cut/paste only).

export function mountAICoachAlwaysOn(getContext, deps) {
  // ✅ HARD GUARD: only pages that *explicitly* include the AI coach drawer
  // should ever mount/wire it. If the drawer isn't present in the HTML,
  // do nothing (prevents AI Coach "leaking" onto other pages).
  const drawer = document.getElementById("aiCoachDrawer");
  const host = document.getElementById("aiFeedbackSection");
  if (!drawer || !host) return;

  const section = document.getElementById("aiFeedbackSection");
  if (!section) return;

  // Idempotent mount (don’t rebuild every render tick)
  if (section.dataset.convoMounted === "1") return;
  section.dataset.convoMounted = "1";

  // Keep collapsed on initial load (bubble bar only)
  deps.collapseAICoachDrawer();

  // Auto-scroll ONLY when the user manually opens the drawer
  // (prevents jumps when we open it programmatically after first recording).
  let wantScroll = false;
  const summaryEl = drawer.querySelector("summary");
  summaryEl?.addEventListener(
    "pointerdown",
    () => {
      wantScroll = true;
    },
    { passive: true }
  );
  summaryEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") wantScroll = true;
  });
  drawer.addEventListener("toggle", () => {
    if (!drawer.open || !wantScroll) return;
    wantScroll = false;
    requestAnimationFrame(() => deps.bringBoxBottomToViewport(drawer, 14));
  });

  deps.renderEntryButtons({
    onQuick: (persona) => {
      const ctx = (typeof getContext === "function" ? getContext() : null) || {};
      const azureResult = ctx.azureResult;
      const referenceText = ctx.referenceText || "";
      const firstLang = ctx.firstLang || "universal";

      const nb = azureResult?.NBest?.[0];
      const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();
      if (!nb || !saidText) {
        deps.clearAIFeedback();
        deps.renderAIFeedbackMarkdown(
          `### AI Coach is ready\nRecord **one** reply in the conversation, then click **Quick Tips** (or **Deep Dive**).`
        );
        return;
      }

      deps.setLastContext({ azureResult, referenceText, firstLang });
      deps.resetState();
      deps.startQuickMode(azureResult, referenceText, firstLang, persona);
    },
    onDeep: (persona) => {
      const ctx = (typeof getContext === "function" ? getContext() : null) || {};
      const azureResult = ctx.azureResult;
      const referenceText = ctx.referenceText || "";
      const firstLang = ctx.firstLang || "universal";

      const nb = azureResult?.NBest?.[0];
      const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();
      if (!nb || !saidText) {
        deps.clearAIFeedback();
        deps.renderAIFeedbackMarkdown(
          `### AI Coach is ready\nRecord **one** reply in the conversation, then click **Deep Dive** for a full breakdown.`
        );
        return;
      }

      deps.setLastContext({ azureResult, referenceText, firstLang });
      deps.resetState();
      deps.startDeepMode(azureResult, referenceText, firstLang, persona);
    },
    onPersonaChange: (newPersona) => deps.onPersonaChanged(newPersona),
  });
}

/**
 * Called when Sidebar "Coach Style" is clicked
 */
export function onPersonaChanged(newPersona, deps) {
  const lastContext = deps.getLastContext();
  if (!lastContext.azureResult) return;
  console.log(`[AI Logic] Persona changed to ${newPersona}. Refreshing...`);

  const currentArgs = deps.getCurrentArgs();

  if (currentArgs) {
    // If we are already viewing results, refresh immediately
    const { referenceText, firstLang, mode } = currentArgs;

    deps.setChunkHistory([]); // was: chunkHistory = [];
    deps.clearAIFeedback(); // Clears content area, keeps sidebar

    if (mode === "simple") {
      deps.startQuickMode(lastContext.azureResult, referenceText, firstLang, newPersona);
    } else {
      deps.startDeepMode(lastContext.azureResult, referenceText, firstLang, newPersona);
    }
  } else {
    // Just sitting at menu, no fetch needed, but we keep the buttons active
    // The visual state 'active' class is handled by the DOM module
  }
}

/**
 * Called when Main L1 Dropdown changes
 */
export function onLanguageChanged(newLang, deps) {
  const lastContext = deps.getLastContext();
  if (!lastContext.azureResult) return;
  console.log(`[AI Logic] Language changed to ${newLang}. Refreshing...`);

  deps.setLastContextFirstLang(newLang);

  // Get currently selected sidebar persona to maintain consistency
  const currentPersona = deps.getCurrentPersona();

  const currentArgs = deps.getCurrentArgs();

  if (currentArgs) {
    const { mode } = currentArgs;

    deps.setChunkHistory([]); // was: chunkHistory = [];
    deps.clearAIFeedback();

    if (mode === "simple") {
      deps.startQuickMode(
        lastContext.azureResult,
        lastContext.referenceText,
        newLang,
        currentPersona
      );
    } else {
      deps.startDeepMode(
        lastContext.azureResult,
        lastContext.referenceText,
        newLang,
        currentPersona
      );
    }
  } else {
    // Re-render to ensure any internal language state in closures is fresh
    deps.renderEntryButtons({
      onQuick: (p) =>
        deps.startQuickMode(
          lastContext.azureResult,
          lastContext.referenceText,
          newLang,
          p
        ),
      onDeep: (p) =>
        deps.startDeepMode(
          lastContext.azureResult,
          lastContext.referenceText,
          newLang,
          p
        ),
      onPersonaChange: (p) => deps.onPersonaChanged(p),
    });
  }
}
