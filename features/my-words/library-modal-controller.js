// features/my-words/library-modal-controller.js

export function ensureMyWordsLibraryModalImpl({
  mountPanel,
  store,
  getAttempts,
  onSendToInput,
} = {}) {
  let modalEl = document.querySelector(".lux-mw-modal");
  let panelMount = null;
  let panelApi = null;

  function ensure() {
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.className = "lux-mw-modal";
    modalEl.innerHTML = `
      <div class="lux-mw-modal-card"></div>
    `;

    document.body.appendChild(modalEl);

    // Click outside card closes
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) close();
    });

    // Esc closes
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalEl.classList.contains("is-open")) {
        close();
      }
    });

    return modalEl;
  }

  function open() {
    const el = ensure();

    // Ensure the card exists even if an older modal shell is present
    let card = el.querySelector(".lux-mw-modal-card");
    if (!card) {
      el.innerHTML = `<div class="lux-mw-modal-card"></div>`;
      card = el.querySelector(".lux-mw-modal-card");
    }

    // If something rebuilt the modal card, our mount becomes stale.
    // Remount cleanly instead of showing a blank card.
    if (panelMount && (!panelMount.isConnected || !el.contains(panelMount))) {
      panelMount = null;
      panelApi = null;
    }

    // Mount panel once
    if (!panelMount) {
      panelMount = card;

      panelApi = mountPanel?.({
        store,
        getAttempts,
        onSendToInput,
        mode: "library",
        mountTo: panelMount,
        asModal: true,
        onOpenLibrary: null,
        onCloseLibrary: close,
        onCoach: null,
      });
    }

    el.classList.add("is-open");

    // ✅ Re-render on open (prevents “blank modal” even if something failed earlier)
    try {
      panelApi?.render?.();
    } catch {}

    // Focus search for fast browsing
    try {
      panelApi?.focusSearch?.();
    } catch {}
  }

  function close() {
    if (!modalEl) return;
    modalEl.classList.remove("is-open");
  }

  return { open, close, el: modalEl };
}
