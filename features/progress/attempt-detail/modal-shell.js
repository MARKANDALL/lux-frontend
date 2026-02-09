// features/progress/attempt-detail/modal-shell.js
// Modal shell + lifecycle for Attempt Details modal.

export function createAttemptDetailModalShell() {
  const modal = document.createElement("div");
  modal.id = "lux-detail-modal";
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.5); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(2px);
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    background: white; width: 94%; max-width: 640px;
    border-radius: 16px; padding: 22px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.18);
    position: relative; max-height: 90vh; overflow-y: auto; overflow-x: hidden;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
    position: absolute; top: 14px; right: 14px;
    background: none; border: none; font-size: 1.6rem;
    cursor: pointer; color: #94a3b8;
  `;

  let mounted = false;

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  function onBackdrop(e) {
    if (e.target === modal) close();
  }

  function close() {
    if (!mounted) {
      // Still safe to remove if someone calls close early
      try { modal.remove(); } catch (_) {}
      return;
    }

    mounted = false;
    try { modal.remove(); } catch (_) {}

    document.removeEventListener("keydown", onKey);
    modal.removeEventListener("click", onBackdrop);

    try {
      document.body.style.overflow = "";
    } catch (_) {}
  }

  closeBtn.onclick = close;

  card.appendChild(closeBtn);
  modal.appendChild(card);

  function mount() {
    if (mounted) return;
    mounted = true;

    document.body.appendChild(modal);

    try {
      document.body.style.overflow = "hidden";
    } catch (_) {}

    document.addEventListener("keydown", onKey);
    modal.addEventListener("click", onBackdrop);
  }

  return { modal, card, close, mount };
}
