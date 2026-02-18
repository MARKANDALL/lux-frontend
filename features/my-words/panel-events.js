// features/my-words/panel-events.js

export function bindMyWordsPanelEvents({
  root,
  store,
  isLibrary,

  elSearch,
  elClose,
  elAdd,
  elTa,

  onSendToInput,
  onOpenLibrary,
  onCloseLibrary,
  onCoach,

  openWordReference,
  openYouglish,

  render,
} = {}) {
  // ------------------------------------------------------------
  // Events
  // ------------------------------------------------------------
  elSearch?.addEventListener("input", (e) => {
    store.setQuery(e.target.value);
  });

  elClose?.addEventListener("click", () => {
    // If we're inside the modal → go “back”
    if (root.classList.contains("is-modal")) {
      onCloseLibrary?.();
      window.LuxMyWords?.closeLibrary?.();
      return;
    }

    // Sidecar closes store open state.
    store.setOpen(false);
  });

  elAdd?.addEventListener("click", () => {
    // Composer does not exist in library mode, but keep safe anyway
    if (isLibrary) return;

    const raw = elTa.value || "";
    const res = store.addMany(raw);
    if (res.added || res.merged) elTa.value = "";
  });

  // ✅ ENTER = Add (Shift+Enter = newline)
  elTa?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      elAdd.click();
    }
  });

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const row = e.target.closest("[data-id]");
    const id = row?.dataset?.id;
    if (!id) return;

    const entry = store.getState().entries.find((x) => x.id === id);
    if (!entry) return;

    const act = btn.dataset.act;

    if (act === "send") {
      onSendToInput?.(entry.text);
      return;
    }

    if (act === "wr") {
      openWordReference?.(entry.text);
      return;
    }

    if (act === "yg") {
      openYouglish?.(entry.text);
      return;
    }

    if (act === "coach") {
      onCoach?.(entry.text);
      return;
    }

    if (act === "pin") {
      store.togglePin(id);
      return;
    }

    if (act === "archive") {
      // ✅ Only in compact mode (active list)
      if (isLibrary) return;

      store.archive(entry.id);
      store.setOpen(false);               // close sidecar
      window.LuxMyWords?.openLibrary?.();  // open modal library
      return;
    }

    if (act === "restore") {
      store.restore(id);
      return;
    }

    if (act === "delete") {
      store.hardDelete(id);
      return;
    }
  });

  // Re-render on store updates
  store.subscribe(() => render());

  // ✅ Wiggle close button when user clicks blank space outside the My Words panel
  document.addEventListener("click", (e) => {
    // Only when panel is open
    if (!root.isConnected || root.style.display === "none") return;
    // Check panel is actually visible (has is-open or is mounted in sidecar)
    const panelOpen = root.closest(".lux-mw-panel.is-open") || root.classList.contains("is-open") || root.isConnected;
    if (!panelOpen) return;

    // If click is inside the panel, ignore
    if (root.contains(e.target)) return;

    // If click is on any interactive element, ignore — let them use the app normally
    const interactive = e.target.closest(
      "button, a, input, select, textarea, label, [role='button'], [role='tab'], [tabindex]"
    );
    if (interactive) return;

    // Blank space click — wiggle the close button
    const closeBtn = root.querySelector('button[data-act="close"]');
    if (!closeBtn) return;
    closeBtn.classList.remove("wiggle");
    void closeBtn.offsetWidth; // force reflow so re-triggering works
    closeBtn.classList.add("wiggle");
    closeBtn.addEventListener("animationend", () => {
      closeBtn.classList.remove("wiggle");
    }, { once: true });

  }, true); // useCapture — fires before other handlers

  return {};
}
