// features/my-words/index.js

import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "../../api/identity.js";

import { createMyWordsStore } from "./store.js";
import { mountMyWordsPanel } from "./panel.js";
import { createMyWordsLibraryModal } from "./library-modal.js";
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

        // ✅ PHASE 3: Archive / Restore both go through setArchived()
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
  const sidecar = mountMyWordsPanel({
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
    onOpenLibrary: () => modal.open(),
  });

  // --- library modal ---
  const modal = createMyWordsLibraryModal({
    store,
    getAttempts: () => attemptsCache,
    onSendToInput: inputEl
      ? (text) => {
          inputEl.value = text;
          inputEl.focus();
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
      : null,
  });

  // --- launcher button (triangle) ---
  const launcher = mountMyWordsCornerLauncher({
    onClick: async () => {
      const isOpen = store.getState().open;
      store.setOpen(!isOpen);

      if (!isOpen) {
        // opening: load stats + layout + focus composer
        await ensureAttempts();
        requestAnimationFrame(() => {
          layoutPanel(sidecar.el, inputEl);
          sidecar.focusComposer?.();
          sidecar.render?.();
        });
      }
    },
  });

  // Keep it aligned on resize (when open)
  window.addEventListener(
    "resize",
    () => {
      if (store.getState().open) layoutPanel(sidecar.el, inputEl);
    },
    { passive: true }
  );

  // When opened through store state
  store.subscribe(async (s) => {
    launcher.classList.toggle("is-open", !!s.open);
    sidecar.el.classList.toggle("is-open", !!s.open);

    if (s.open) {
      await ensureAttempts();
      requestAnimationFrame(() => {
        layoutPanel(sidecar.el, inputEl);
        sidecar.render?.();
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

  // Global hook for Progress page button
  window.LuxMyWords = {
    openLibrary: () => modal.open(),
    toggle: () => store.toggleOpen(),
    open: () => store.setOpen(true),
    close: () => store.setOpen(false),
  };

  return { store, sidecar, modal, launcher };
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
