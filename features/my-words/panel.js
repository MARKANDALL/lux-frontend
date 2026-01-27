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
import { createMyWordsPanelDOM } from "./panel-dom.js";

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
  // ✅ Change C — stop tab state entirely
  const isLibrary = mode === "library" || asModal === true;

  const {
    root,
    elTitle,
    elSearch,
    elClose,
    elTa,
    elAdd,
    elList,
    elComposerZone,
  } = createMyWordsPanelDOM({
    mountTo,
    asModal,
    isLibrary,
    esc,
  });

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
