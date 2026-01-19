// features/my-words/index.js

import { createMyWordsStore } from "./store.js";
import { mountMyWordsPanel } from "./panel.js";

import {
  getAuthedUID,
  fetchMyWords,
  upsertManyMyWords,
  setPinned,
  archiveEntry,
  deleteEntry
} from "./service.js";

function flashInput(inputEl) {
  if (!inputEl) return;
  inputEl.classList.add("lux-mw-flash");
  window.setTimeout(() => inputEl.classList.remove("lux-mw-flash"), 420);
}

/**
 * Layout: bottom-left “lane”
 * - Top hugs bottom of Self Playback drawer (".lux-sp-panel")
 * - Right edge hugs LEFT edge of the practice input (#referenceText)
 */
function layoutPanel(panelEl, inputEl) {
  if (!panelEl || !inputEl) return;

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

  // Clamp so panel still has minimum usable height
  const maxTop = Math.max(92, window.innerHeight - 260);
  top = Math.min(top, maxTop);

  panelEl.style.top = top + "px";

  // Width ends near the left edge of input
  const inputRect = inputEl.getBoundingClientRect();
  const targetRight = Math.ceil(inputRect.left - GAP);

  let width = targetRight - LEFT;
  width = Math.max(280, Math.min(width, 560));
  width = Math.min(width, Math.floor(window.innerWidth - LEFT - GAP));

  panelEl.style.width = width + "px";

  // Height fills remaining viewport down to bottom margin
  panelEl.style.height = `calc(100vh - ${top}px - ${BOTTOM}px)`;
  panelEl.style.maxHeight = `calc(100vh - ${top}px - ${BOTTOM}px)`;
}

export function initMyWordsSidecar({ uid, inputEl, buttonEl }) {
  if (!uid || !inputEl || !buttonEl) return null;

  let authedUID = null;

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

        if (evt.type === "archive") {
          await archiveEntry(authedUID, evt.id);
        }

        if (evt.type === "hardDelete") {
          await deleteEntry(authedUID, evt.id);
        }
      } catch (e) {
        console.warn("[my-words] supabase sync failed:", e);
      }
    }
  });

  const panel = mountMyWordsPanel({
    store,
    onSendToInput: (text) => {
      inputEl.value = text;
      inputEl.focus();
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      flashInput(inputEl);
    }
  });

  // Button toggles panel
  buttonEl.addEventListener("click", () => store.toggleOpen());

  // Sync button state + layout on open
  store.subscribe((s) => {
    buttonEl.classList.toggle("is-open", !!s.open);

    if (s.open) {
      requestAnimationFrame(() => layoutPanel(panel.el, inputEl));
    }
  });

  // Esc closes panel
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && store.getState().open) {
      store.setOpen(false);
    }
  });

  // Keep it aligned on resize
  window.addEventListener("resize", () => {
    if (store.getState().open) layoutPanel(panel.el, inputEl);
  }, { passive: true });

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
    const localTexts = store.getState().entries
      .filter((e) => !e.archived)
      .map((e) => e.text);

    if (localTexts.length) {
      await upsertManyMyWords(authedUID, localTexts);
      const after = await fetchMyWords(authedUID);
      if (after?.length) store.replaceEntries(after);
    }
  })();

  return { store, panel };
}
