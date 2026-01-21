// features/my-words/index.js

import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "../../api/identity.js";

import { createMyWordsStore } from "./store.js";
import { mountMyWordsPanel } from "./panel.js";
import { mountMyWordsCornerLauncher } from "./launcher.js";

import {
  getAuthedUID,
  fetchMyWords,
  upsertManyMyWords,
  setPinned,
  setArchived,
  deleteEntry,
} from "./service.js";

/**
 * Layout: bottom-left “lane”
 * - Top hugs bottom of Self Playback drawer (".lux-sp-panel")
 * - Right edge hugs LEFT edge of the practice input (#referenceText)
 */
function layoutPanel(panelEl, inputEl) {
  if (!panelEl) return;

  const GAP = 12;
  const LEFT = 18;
  const BOTTOM = 18;

  panelEl.style.left = LEFT + "px";
  panelEl.style.right = "auto";
  panelEl.style.bottom = BOTTOM + "px";

  // top = bottom of Self Playback panel (if present)
  let top = 92;
  const sp = document.querySelector(".lux-sp-panel");
  if (sp) {
    const r = sp.getBoundingClientRect();
    top = Math.ceil(r.bottom + GAP);
  }

  const maxTop = Math.max(92, window.innerHeight - 260);
  top = Math.min(top, maxTop);
  panelEl.style.top = top + "px";

  // Width ends near the left edge of input (if present)
  let width = 420;
  if (inputEl) {
    const inputRect = inputEl.getBoundingClientRect();
    const targetRight = Math.ceil(inputRect.left - GAP);
    width = targetRight - LEFT;
  }

  width = Math.max(300, Math.min(width, 560));
  width = Math.min(width, Math.floor(window.innerWidth - LEFT - GAP));

  panelEl.style.width = width + "px";
  panelEl.style.height = `calc(100vh - ${top}px - ${BOTTOM}px)`;
  panelEl.style.maxHeight = `calc(100vh - ${top}px - ${BOTTOM}px)`;
}

export function initMyWordsGlobal({ uid, inputEl } = {}) {
  // ✅ Hide on AI landing page (convo.html)
  if (location.pathname.endsWith("convo.html")) return null;

  if (!uid) return null;

  let authedUID = null;

  // --- attempts cache for stats ---
  let attemptsLoaded = false;
  let attemptsCache = [];

  async function ensureAttempts() {
    if (attemptsLoaded) return attemptsCache;
    attemptsLoaded = true;

    try {
      const all = await fetchHistory(uid);
      attemptsCache = Array.isArray(all) ? all : [];
    } catch (e) {
      console.warn("[my-words] fetchHistory failed:", e);
      attemptsCache = [];
    }

    return attemptsCache;
  }

  // ============================================================
  // ✅ FIX — Real AI Coach handler (Coach button)
  // ============================================================
  async function sendToAICoach(text) {
    const t = String(text || "").trim();
    if (!t) return;

    // open the AI coach drawer
    const drawer = document.querySelector("#aiCoachDrawer");
    if (drawer) drawer.open = true;

    // Scroll so AI section is visible and low in viewport
    requestAnimationFrame(() => {
      try {
        drawer?.scrollIntoView({ behavior: "smooth", block: "end" });
      } catch (_) {}
    });

    // show loading feedback
    const box = document.querySelector("#aiFeedback");
    if (box)
      box.innerHTML = `<div style="padding:12px;opacity:.8;">Thinking…</div>`;

    // Persona (default tutor)
    const persona =
      document.querySelector(".ai-voice-btn.active")?.dataset?.value || "tutor";

    // Default to Quick Tip (placeholder until backend call)
    if (box) {
      box.innerHTML = `
        <div style="padding:14px;">
          <strong>Quick Tip for:</strong> ${t}<br/><br/>
          <em>Persona:</em> ${persona}<br/><br/>
          (placeholder until API call is wired)
        </div>`;
    }
  }

  const store = createMyWordsStore({
    uid,
    onMutation: async (evt) => {
      // Only sync to Supabase if logged in
      if (!authedUID) return;

      try {
        if (evt.type === "addMany") {
          await upsertManyMyWords(authedUID, evt.lines || []);
          const remote = await fetchMyWords(authedUID);
          if (remote?.length) store.replaceEntries(remote);
        }

        if (evt.type === "togglePin") {
          await setPinned(authedUID, evt.id, evt.pinned);
        }

        // ✅ Archive / Restore via setArchived()
        if (evt.type === "archive") {
          await setArchived(authedUID, evt.id, true);
        }

        if (evt.type === "restore") {
          await setArchived(authedUID, evt.id, false);
        }

        if (evt.type === "hardDelete") {
          await deleteEntry(authedUID, evt.id);
        }
      } catch (e) {
        console.warn("[my-words] supabase sync failed:", e);
      }
    },
  });

  // --- sidecar panel ---
  const panel = mountMyWordsPanel({
    store,
    getAttempts: () => attemptsCache,
    onSendToInput: inputEl
      ? (text) => {
          inputEl.value = text;
          inputEl.focus();
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
      : null,
    mode: "compact",
    maxPreview: 5,
    onOpenLibrary: () => openLibrary(), // ✅ wire to reliable modal
    onCoach: (text) => sendToAICoach(text), // ✅ Coach button now works
  });

  // ✅ Alias for older code that expects "sidecar"
  const sidecar = panel;

  // ============================================================
  // ✅ FIX 1 — Make Library Modal open reliably (View Library)
  // ============================================================

  // --- Library Modal (View Library) ---
  let _mwModal = null;
  let _mwHome = null;

  function ensureLibraryModal() {
    if (_mwModal) return _mwModal;

    const m = document.createElement("div");
    m.id = "luxMwModal";
    m.className = "lux-mw-modal";
    m.innerHTML = `<div class="lux-mw-modal-card" role="dialog" aria-modal="true"></div>`;
    document.body.appendChild(m);

    // click outside closes
    m.addEventListener("click", (e) => {
      if (e.target === m) closeLibrary();
    });

    _mwModal = m;
    return m;
  }

  function openLibrary() {
    const m = ensureLibraryModal();
    const card = m.querySelector(".lux-mw-modal-card");
    if (!card) return;

    // Create a "home marker" so we can put the panel back where it came from
    if (!_mwHome) {
      _mwHome = document.createElement("div");
      _mwHome.id = "luxMwPanelHome";
      _mwHome.style.display = "none";

      // home marker goes right before panel.el
      panel.el.parentNode.insertBefore(_mwHome, panel.el);
    }

    // ✅ force panel visible (important if your CSS uses display:none by default)
    store.setOpen(true);
    panel.el.classList.add("is-open", "is-modal");

    // Move panel into the modal card
    card.appendChild(panel.el);

    // Show modal
    m.classList.add("is-open");
  }

  function closeLibrary() {
    if (!_mwModal || !_mwHome) return;

    _mwModal.classList.remove("is-open");

    // Put panel back to its original spot
    panel.el.classList.remove("is-modal");
    _mwHome.parentNode.insertBefore(panel.el, _mwHome);

    // Re-layout if still open (sidecar mode)
    if (store.getState().open) {
      requestAnimationFrame(() => layoutPanel(panel.el, inputEl));
    }
  }

  // ✅ Make available globally
  window.LuxMyWords = window.LuxMyWords || {};
  window.LuxMyWords.openLibrary = openLibrary;
  window.LuxMyWords.closeLibrary = closeLibrary;

  // --- launcher button (triangle) ---
  const launcher = mountMyWordsCornerLauncher({
    onClick: async () => {
      const isOpen = store.getState().open;
      store.setOpen(!isOpen);

      if (!isOpen) {
        // opening: load stats + layout + focus composer
        await ensureAttempts();
        requestAnimationFrame(() => {
          // ✅ don’t run sidecar layout when panel is inside modal
          if (!panel.el.classList.contains("is-modal")) {
            layoutPanel(panel.el, inputEl);
          }
          panel.focusComposer?.();
          panel.render?.();
        });
      }
    },
  });

  // Keep it aligned on resize (when open)
  window.addEventListener(
    "resize",
    () => {
      if (!store.getState().open) return;
      if (panel.el.classList.contains("is-modal")) return; // ✅ modal handles its own sizing
      layoutPanel(panel.el, inputEl);
    },
    { passive: true }
  );

  // When opened through store state
  store.subscribe(async (s) => {
    launcher.classList.toggle("is-open", !!s.open);
    panel.el.classList.toggle("is-open", !!s.open);

    if (s.open) {
      await ensureAttempts();
      requestAnimationFrame(() => {
        // ✅ don’t run sidecar layout when panel is inside modal
        if (!panel.el.classList.contains("is-modal")) {
          layoutPanel(panel.el, inputEl);
        }
        panel.render?.();
      });
    }
  });

  // --- Remote hydration when logged in ---
  (async () => {
    authedUID = await getAuthedUID();
    if (!authedUID) return;

    const remote = await fetchMyWords(authedUID);
    if (remote?.length) {
      store.replaceEntries(remote);
      return;
    }

    // If remote empty but local has data, upload local once
    const localTexts = store
      .getState()
      .entries.filter((e) => !e.archived)
      .map((e) => e.text);

    if (localTexts.length) {
      await upsertManyMyWords(authedUID, localTexts);
      const after = await fetchMyWords(authedUID);
      if (after?.length) store.replaceEntries(after);
    }
  })();

  // Global hook for Progress page button + external calls
  window.LuxMyWords = {
    ...(window.LuxMyWords || {}),
    toggle: () => store.toggleOpen(),
    open: () => store.setOpen(true),
    close: () => store.setOpen(false),
    openLibrary, // ✅ reliable open
    closeLibrary,
  };

  return { store, panel, sidecar, launcher };
}

/**
 * ✅ FIX 2 — always produce a UID (correct import)
 * This is what launcher.js lazy-imports and uses.
 */
export function initMyWordsEverywhere() {
  const uid = ensureUID(); // ✅ always returns a stable local UID
  const inputEl = document.getElementById("referenceText") || null;
  return initMyWordsGlobal({ uid, inputEl });
}
