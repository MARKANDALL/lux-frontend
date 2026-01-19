// features/my-words/library-modal.js

import { mountMyWordsPanel } from "./panel.js";

export function createMyWordsLibraryModal({ store, getAttempts, onSendToInput } = {}) {
  let overlay = null;
  let panel = null;

  function ensure() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "lux-mw-modal";

    const card = document.createElement("div");
    card.className = "lux-mw-modal-card";
    overlay.appendChild(card);

    document.body.appendChild(overlay);

    panel = mountMyWordsPanel({
      store,
      getAttempts,
      onSendToInput,
      mode: "library",
      maxPreview: Infinity,
      mountTo: card,
      asModal: true,
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
  }

  function open() {
    ensure();
    overlay.classList.add("is-open");
    panel?.render?.();
    panel?.focusSearch?.();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
  }

  return { open, close };
}
