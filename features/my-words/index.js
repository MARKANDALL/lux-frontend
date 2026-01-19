// features/my-words/index.js

import { createMyWordsStore } from "./store.js";
import { mountMyWordsPanel } from "./panel.js";

function flashInput(inputEl) {
  if (!inputEl) return;
  inputEl.classList.add("lux-mw-flash");
  window.setTimeout(() => inputEl.classList.remove("lux-mw-flash"), 420);
}

/**
 * V1: Sidecar panel + localStorage persistence.
 * Supabase + stats come in Commit B/C.
 */
export function initMyWordsSidecar({ uid, inputEl, buttonEl }) {
  if (!uid || !inputEl || !buttonEl) return null;

  const store = createMyWordsStore({ uid });

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

  // Sync button state
  store.subscribe((s) => {
    buttonEl.classList.toggle("is-open", !!s.open);
  });

  // Esc closes panel
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && store.getState().open) {
      store.setOpen(false);
    }
  });

  return { store, panel };
}
