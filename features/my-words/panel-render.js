// features/my-words/panel-render.js

export function createMyWordsPanelRenderer({
  root,
  elTitle,
  elList,
  elFooter,
  elComposerZone,

  store,
  getAttempts,

  onSendToInput,
  onOpenLibrary,
  onCloseLibrary,
  onCoach,

  isLibrary,
  maxPreview,

  esc,
  relTime,

  computeCountsAll,
  getCompactActiveList,
  getLibraryArchivedList,
} = {}) {
  function buildMeta(e) {
    const attempts = e.mw_attempts || 0;
    const score = e.mw_lastScore;
    const lastScoreStr = score == null ? "—" : `${Math.round(score)}%`;
    const lastAtStr = relTime(e.mw_lastAt);
    const trend = e.mw_trend || "—";
    return `Practiced ${attempts}× · Last ${lastScoreStr} ${trend} · ${lastAtStr}`;
  }

  function entryRowHTML(e, isArchived, opts = {}) {
    const isModal = !!opts.isModal;

    const dotCls = `lux-mw-dot ${esc(e.mw_cls || "mw-new")}`;
    const titleText = `${e.pinned ? "📌 " : ""}${e.text || ""}`;

    // ✅ Modal “Added” timestamp line (only in library)
    let addedLine = "";
    if (isModal) {
      const added = e.created_at || e.updated_at;
      const addedStr = added ? new Date(added).toLocaleString() : "";
      if (addedStr) {
        addedLine = `<div class="lux-mw-meta">Added ${esc(addedStr)}</div>`;
      }
    }

    // ✅ Actions differ depending on archived vs active
    const actions = isArchived
      ? `
        ${
          onSendToInput
            ? `<button class="lux-mw-act" data-act="send">Send</button>`
            : ""
        }
        <button class="lux-mw-act" data-act="wr">WR</button>
        <button class="lux-mw-act" data-act="yg">YG</button>
        <button class="lux-mw-act" data-act="coach">Coach</button>
        <button class="lux-mw-act" data-act="restore">Restore</button>
        <button class="lux-mw-act danger" data-act="delete">Delete</button>
      `
      : `
        ${
          onSendToInput
            ? `<button class="lux-mw-act" data-act="send">Send</button>`
            : ""
        }
        <button class="lux-mw-act" data-act="wr">WR</button>
        <button class="lux-mw-act" data-act="yg">YG</button>
        <button class="lux-mw-act" data-act="coach">Coach</button>
        <button class="lux-mw-act" data-act="pin">${e.pinned ? "Unpin" : "Pin"}</button>
        <button class="lux-mw-act danger" data-act="archive">Archive</button>
      `;

    return `
      <div class="lux-mw-row" data-id="${esc(e.id)}">
        <span class="${dotCls}"></span>

        <div class="lux-mw-main">
          <div class="lux-mw-text">${esc(titleText)}</div>
          <div class="lux-mw-meta">${esc(buildMeta(e))}</div>
          ${addedLine}
        </div>

        <div class="lux-mw-actions">
          ${actions}
        </div>
      </div>
    `;
  }

  function renderFooterButton(archivedTotal) {
    const isModal = root.classList.contains("is-modal");
    const host = elFooter || elList;

    // Remove any existing footer button before adding a new one
    const existing = host.querySelector(".lux-mw-viewAllBtn");
    if (existing) existing.remove();

    // Modal: always show Back
    if (isModal) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lux-mw-viewAllBtn";
      btn.textContent = "Back to My Words";

      btn.addEventListener("click", () => {
        onCloseLibrary?.();
        window.LuxMyWords?.closeLibrary?.();
      });

      host.appendChild(btn);
      return;
    }

    // Sidecar: show View Library only if there is anything archived
    if (archivedTotal > 0) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lux-mw-viewAllBtn";
      btn.textContent = `View Library (${archivedTotal})`;

      btn.addEventListener("click", () => {
        onOpenLibrary?.();
        window.LuxMyWords?.openLibrary?.();
      });

      host.appendChild(btn);
    }
  }

  function render() {
    const isModal = root.classList.contains("is-modal");

    // ✅ Mode-specific header
    if (elTitle) elTitle.textContent = isLibrary ? "Library" : "My Words";

    const { archivedTotal } = computeCountsAll(store);

    // ✅ Compact = active only (no archived rendering)
    // ✅ Library = archived only (no composer input)
    if (elComposerZone) {
      elComposerZone.style.display = isLibrary ? "none" : "";
    }

    if (!isLibrary) {
      // ----------------------------
      // COMPACT: Active-only preview
      // ----------------------------
      const listAll = getCompactActiveList(store, getAttempts);

      const pinned = listAll.filter((e) => e.pinned);
      const rest = listAll.filter((e) => !e.pinned);

      // Top N, but pins always show (even if > N)
      const preview =
        pinned.length > 0
          ? pinned.concat(rest.slice(0, Math.max(0, maxPreview - pinned.length)))
          : rest.slice(0, Math.max(0, maxPreview));

      if (!preview.length) {
        elList.innerHTML = `
          <div class="lux-mw-empty">
            <strong>No saved words yet.</strong>
            Add a few above 👆
          </div>
        `;
      } else {
        elList.innerHTML = preview
          .map((e) => entryRowHTML(e, false, { isModal: false }))
          .join("");
      }

      // Show "View Library (N)" if anything is archived
      renderFooterButton(archivedTotal);
      return;
    }

    // ----------------------------
    // LIBRARY: Archived-only list
    // ----------------------------
    const listAll = getLibraryArchivedList(store, getAttempts);

    if (!listAll.length) {
      elList.innerHTML = `
        <div class="lux-mw-empty">
          <strong>No archived words.</strong>
          Archive something first.
        </div>
      `;

      // Modal still gets Back button
      renderFooterButton(archivedTotal);
      return;
    }

    elList.innerHTML = listAll
      .map((e) => entryRowHTML(e, true, { isModal }))
      .join("");

    // Modal gets Back button
    renderFooterButton(archivedTotal);
  }

  return { render };
}
