// features/my-words/panel.js
// Phase 5: Library Modal + Active/Archived tabs + badge counts
// - Includes "View Library (N)" button in compact mode
// - Modal overlay
// - Tabs (Active / Archived) + badges
// - Archived actions: Send / WR / Restore / Delete
// - NO Copy (removed)

import { esc, relTime, openWordReference, openYouglish } from "./panel-utils.js";
import {
  computeCountsAll,
  getCompactActiveList,
  getLibraryArchivedList,
} from "./panel-data.js";
import { ensureMyWordsLibraryModalImpl } from "./library-modal-controller.js";

export function mountMyWordsPanel({
  store,
  getAttempts,
  onSendToInput,

  mode = "compact", // "compact" | "library"
  maxPreview = 5,

  mountTo = document.body,
  asModal = false,

  onOpenLibrary,
  onCloseLibrary,
  onCoach,
} = {}) {
  // ------------------------------------------------------------
  // Root panel
  // ------------------------------------------------------------
  const root = document.createElement("div");
  root.className = "lux-mw-panel" + (asModal ? " is-modal" : "");
  mountTo.appendChild(root);

  // ✅ Change C — stop tab state entirely
  const isLibrary = mode === "library" || asModal === true;

  // Mode-specific title
  const titleText = isLibrary ? "Library" : "My Words";

  // Composer only exists in compact sidecar
  const composerHTML = !isLibrary
    ? `
      <div class="lux-mw-add" data-zone="composer">
        <div class="lux-mw-addLabel">Add words/phrases (one per line)</div>
        <textarea class="lux-mw-addBox" rows="3" spellcheck="false"></textarea>

        <div class="lux-mw-addRow">
          <button class="lux-mw-addBtn" type="button">Add</button>
          <div class="lux-mw-hint">Tip: Tap <b>Send</b> to push into the input instantly.</div>
        </div>
      </div>
    `
    : "";

  root.innerHTML = `
    <div class="${asModal ? "lux-mw-modalHead" : "lux-mw-head"}">
      <div class="lux-mw-title">${esc(titleText)}</div>

      <div class="lux-mw-headRight">
        <input class="lux-mw-search" type="text" placeholder="Search…" />
        <button class="lux-mw-iconBtn" data-act="close" type="button" title="Close">×</button>
      </div>
    </div>

    <div class="lux-mw-body">
      ${composerHTML}
      <div class="lux-mw-list"></div>
    </div>
  `;

  const elTitle = root.querySelector(".lux-mw-title");
  const elSearch = root.querySelector(".lux-mw-search");
  const elClose = root.querySelector('button[data-act="close"]');
  const elTa = root.querySelector(".lux-mw-addBox");
  const elAdd = root.querySelector(".lux-mw-addBtn");
  const elList = root.querySelector(".lux-mw-list");
  const elComposerZone = root.querySelector('[data-zone="composer"]');

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

    // Remove any existing footer button before adding a new one
    const existing = elList.querySelector(".lux-mw-viewAllBtn");
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

      elList.appendChild(btn);
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

      elList.appendChild(btn);
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

  function focusComposer() {
    try {
      elTa?.focus();
    } catch {}
  }

  function focusSearch() {
    try {
      elSearch?.focus();
    } catch {}
  }

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
      openWordReference(entry.text);
      return;
    }

    if (act === "yg") {
      openYouglish(entry.text);
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
      store.setOpen(false);              // close sidecar
      window.LuxMyWords?.openLibrary?.(); // open modal library
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

  // initial render
  render();

  return {
    el: root,
    render,
    focusComposer,
    focusSearch,
  };
}

// ------------------------------------------------------------
// Phase 5 Modal Controller
// ------------------------------------------------------------
export function ensureMyWordsLibraryModal({
  store,
  getAttempts,
  onSendToInput,
} = {}) {
  return ensureMyWordsLibraryModalImpl({
    mountPanel: mountMyWordsPanel,
    store,
    getAttempts,
    onSendToInput,
  });
}
