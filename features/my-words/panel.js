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
import { bindMyWordsPanelEvents } from "./panel-events.js";
import { createMyWordsPanelRenderer } from "./panel-render.js";

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

  const renderer = createMyWordsPanelRenderer({
    root,
    elTitle,
    elList,
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
  });

  const render = renderer.render;

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

  bindMyWordsPanelEvents({
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
  });

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
