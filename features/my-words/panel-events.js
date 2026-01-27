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

  return {};
}
