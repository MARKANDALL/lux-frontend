// features/my-words/panel.js
// Phase 5: Library Modal + Active/Archived tabs + badge counts
// - Includes "View Library (N)" button in compact mode
// - Modal overlay
// - Tabs (Active / Archived) + badges
// - Archived actions: Send / WR / Restore / Delete
// - NO Copy (removed)

import { applyMyWordsStats } from "./stats.js";
import { normalizeText } from "./normalize.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function relTime(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const d = Date.now() - t;

  const sec = Math.floor(d / 1000);
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function openWordReference(text) {
  const q = String(text || "").trim();
  if (!q) return;
  const url = `https://www.wordreference.com/definition/${encodeURIComponent(q)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function mountMyWordsPanel({
  store,
  getAttempts,
  onSendToInput,

  mode = "compact", // "compact" | "library"
  maxPreview = 5,

  mountTo = document.body,
  asModal = false,

  onOpenLibrary,
} = {}) {
  // ------------------------------------------------------------
  // Root panel
  // ------------------------------------------------------------
  const root = document.createElement("div");
  root.className = "lux-mw-panel" + (asModal ? " is-modal" : "");
  mountTo.appendChild(root);

  // Local UI state (tab mode)
  let tab = "active"; // "active" | "archived"

  root.innerHTML = `
    <div class="${asModal ? "lux-mw-modalHead" : "lux-mw-head"}">
      <div class="lux-mw-title">My Words</div>

      <div class="lux-mw-headRight">
        <div class="lux-mw-tabs">
          <button class="lux-mw-tab is-active" data-tab="active" type="button">
            Active <span class="lux-mw-badge" data-badge="active">0</span>
          </button>
          <button class="lux-mw-tab" data-tab="archived" type="button">
            Archived <span class="lux-mw-badge" data-badge="archived">0</span>
          </button>
        </div>

        <input class="lux-mw-search" type="text" placeholder="Search…" />
        <button class="lux-mw-iconBtn" data-act="close" type="button" title="Close">×</button>
      </div>
    </div>

    <div class="lux-mw-body">
      <div class="lux-mw-add" data-zone="composer">
        <div class="lux-mw-addLabel">Add words/phrases (one per line)</div>
        <textarea class="lux-mw-addBox" rows="3" spellcheck="false"></textarea>

        <div class="lux-mw-addRow">
          <button class="lux-mw-addBtn" type="button">Add</button>
          <div class="lux-mw-hint">Tip: Tap <b>Send</b> to push into the input instantly.</div>
        </div>
      </div>

      <div class="lux-mw-list"></div>
    </div>
  `;

  const elSearch = root.querySelector(".lux-mw-search");
  const elClose = root.querySelector('button[data-act="close"]');
  const elTa = root.querySelector(".lux-mw-addBox");
  const elAdd = root.querySelector(".lux-mw-addBtn");
  const elList = root.querySelector(".lux-mw-list");
  const elTabs = root.querySelector(".lux-mw-tabs");
  const elBadgeActive = root.querySelector('[data-badge="active"]');
  const elBadgeArchived = root.querySelector('[data-badge="archived"]');
  const elComposerZone = root.querySelector('[data-zone="composer"]');

  function buildMeta(e) {
    const attempts = e.mw_attempts || 0;
    const score = e.mw_lastScore;
    const lastScoreStr = score == null ? "—" : `${Math.round(score)}%`;
    const lastAtStr = relTime(e.mw_lastAt);
    const trend = e.mw_trend || "—";
    return `Practiced ${attempts}× · Last ${lastScoreStr} ${trend} · ${lastAtStr}`;
  }

  function computeCountsAll() {
    const all = store.getState().entries || [];
    const activeTotal = all.filter((e) => !e.archived).length;
    const archivedTotal = all.filter((e) => !!e.archived).length;
    return { activeTotal, archivedTotal, total: all.length };
  }

  function setTab(nextTab) {
    tab = nextTab === "archived" ? "archived" : "active";

    root.querySelectorAll(".lux-mw-tab").forEach((b) => {
      const is = b.dataset.tab === tab;
      b.classList.toggle("is-active", is);
    });

    // Composer only makes sense on Active
    if (elComposerZone) {
      elComposerZone.style.display = tab === "active" ? "" : "none";
    }

    render();
  }

  function entryRowHTML(e, isArchived) {
    const dotCls = `lux-mw-dot ${esc(e.mw_cls || "mw-new")}`;
    const titleText = `${e.pinned ? "📌 " : ""}${e.text || ""}`;

    const actions = isArchived
      ? `
        ${onSendToInput ? `<button class="lux-mw-act" data-act="send">Send</button>` : ""}
        <button class="lux-mw-act" data-act="wr">WR</button>
        <button class="lux-mw-act" data-act="restore">Restore</button>
        <button class="lux-mw-act danger" data-act="delete">Delete</button>
      `
      : `
        ${onSendToInput ? `<button class="lux-mw-act" data-act="send">Send</button>` : ""}
        <button class="lux-mw-act" data-act="wr">WR</button>
        <button class="lux-mw-act" data-act="pin">${e.pinned ? "Unpin" : "Pin"}</button>
        <button class="lux-mw-act danger" data-act="archive">Archive</button>
      `;

    return `
      <div class="lux-mw-row" data-id="${esc(e.id)}">
        <span class="${dotCls}"></span>

        <div class="lux-mw-main">
          <div class="lux-mw-text">${esc(titleText)}</div>
          <div class="lux-mw-meta">${esc(buildMeta(e))}</div>
        </div>

        <div class="lux-mw-actions">
          ${actions}
        </div>
      </div>
    `;
  }

  function getFilteredListForTab() {
    const attempts = (typeof getAttempts === "function" ? getAttempts() : []) || [];
    const all = store.getState().entries || [];

    // Stats are applied to whichever list we’re showing
    const q = normalizeText(store.getState().query || "");

    if (tab === "archived") {
      const archived = all
        .filter((e) => !!e.archived)
        .filter((e) => (q ? normalizeText(e.text).includes(q) : true));

      return applyMyWordsStats(archived, attempts);
    }

    // Active tab uses visibleEntries (already excludes archived + applies store query)
    const active = store.visibleEntries();
    return applyMyWordsStats(active, attempts);
  }

  function render() {
    const { activeTotal, archivedTotal, total } = computeCountsAll();

    if (elBadgeActive) elBadgeActive.textContent = String(activeTotal);
    if (elBadgeArchived) elBadgeArchived.textContent = String(archivedTotal);

    const listAll = getFilteredListForTab();

    // compact mode only previews ACTIVE tab
    if (mode === "compact") {
      // Force active view in compact
      tab = "active";
      root.querySelectorAll(".lux-mw-tab").forEach((b) => {
        const is = b.dataset.tab === "active";
        b.classList.toggle("is-active", is);
      });
      if (elComposerZone) elComposerZone.style.display = "";

      const preview = listAll.slice(0, Math.max(0, maxPreview));

      if (!preview.length) {
        elList.innerHTML = `
          <div class="lux-mw-empty">
            <strong>No saved words yet.</strong>
            Add a few above 👆
          </div>
        `;
      } else {
        elList.innerHTML = preview.map((e) => entryRowHTML(e, false)).join("");
      }

      // ✅ Phase 5: View Library (N)
      if (total > 0 && (total > maxPreview || archivedTotal > 0)) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lux-mw-viewAllBtn";
        btn.textContent = `View Library (${total})`;

        // ✅ FIX 2 — wire the “View Library (N)” button
        btn.addEventListener("click", () => {
          window.LuxMyWords?.openLibrary?.();
        });

        elList.appendChild(btn);
      }

      return;
    }

    // Library mode (modal): active OR archived
    if (!listAll.length) {
      elList.innerHTML = `
        <div class="lux-mw-empty">
          <strong>${tab === "archived" ? "No archived words." : "No active words yet."}</strong>
          ${tab === "archived" ? "Archive something first." : "Add a few above 👆"}
        </div>
      `;
      return;
    }

    const isArchived = tab === "archived";
    elList.innerHTML = listAll.map((e) => entryRowHTML(e, isArchived)).join("");
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
  elTabs?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tab]");
    if (!btn) return;
    setTab(btn.dataset.tab);
  });

  elSearch?.addEventListener("input", (e) => {
    store.setQuery(e.target.value);
  });

  elClose?.addEventListener("click", () => {
    // Sidecar closes store open state.
    // Modal close is handled by the modal controller (below).
    store.setOpen(false);
  });

  elAdd?.addEventListener("click", () => {
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

    if (act === "pin") {
      store.togglePin(id);
      return;
    }

    if (act === "archive") {
      store.archive(id);
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
    setTab,
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
    const card = el.querySelector(".lux-mw-modal-card");

    // Mount panel once
    if (!panelMount) {
      panelMount = card;

      panelApi = mountMyWordsPanel({
        store,
        getAttempts,
        onSendToInput,
        mode: "library",
        mountTo: panelMount,
        asModal: true,
        onOpenLibrary: null,
      });

      // Default tab Active when opening
      panelApi?.setTab?.("active");
    }

    el.classList.add("is-open");

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
