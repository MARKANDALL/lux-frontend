// features/my-words/panel.js

import { applyMyWordsStats } from "./stats.js";

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

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
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
  const root = document.createElement("div");
  root.className = "lux-mw-panel" + (asModal ? " is-modal" : "");
  mountTo.appendChild(root);

  root.innerHTML = `
    <div class="lux-mw-head">
      <div class="lux-mw-title">My Words</div>
      <div class="lux-mw-headRight">
        <input class="lux-mw-search" type="text" placeholder="Search…" />
        <button class="lux-mw-close" type="button" title="Close">×</button>
      </div>
    </div>

    <div class="lux-mw-compose">
      <div class="lux-mw-composeLabel">Add words/phrases (one per line)</div>
      <textarea class="lux-mw-textarea" rows="3" spellcheck="false"></textarea>

      <div class="lux-mw-composeRow">
        <button class="lux-mw-addBtn" type="button">Add</button>
        <div class="lux-mw-tip">Tip: Tap <b>Send</b> to push into the input instantly.</div>
      </div>
    </div>

    <div class="lux-mw-list"></div>
  `;

  const elSearch = root.querySelector(".lux-mw-search");
  const elClose = root.querySelector(".lux-mw-close");
  const elTa = root.querySelector(".lux-mw-textarea");
  const elAdd = root.querySelector(".lux-mw-addBtn");
  const elList = root.querySelector(".lux-mw-list");

  function buildMeta(e) {
    const attempts = e.mw_attempts || 0;
    const score = e.mw_lastScore;
    const lastScoreStr = score == null ? "—" : `${Math.round(score)}%`;
    const lastAtStr = relTime(e.mw_lastAt);
    const trend = e.mw_trend || "—";
    return `Practiced ${attempts}× · Last ${lastScoreStr} ${trend} · ${lastAtStr}`;
  }

  function entryHTML(e) {
    const dotCls = `lux-mw-dot ${esc(e.mw_cls || "mw-new")}`;
    const titleText = `${e.pinned ? "📌 " : ""}${e.text || ""}`;

    return `
      <div class="lux-mw-entry" data-id="${esc(e.id)}">
        <div class="lux-mw-entryLeft">
          <span class="${dotCls}"></span>
          <div class="lux-mw-entryText">
            <div class="lux-mw-entryWord">${esc(titleText)}</div>
            <div class="lux-mw-entryMeta">${esc(buildMeta(e))}</div>
          </div>
        </div>

        <div class="lux-mw-actions">
          ${onSendToInput ? `<button class="lux-mw-act" data-act="send">Send</button>` : ""}
          <button class="lux-mw-act" data-act="copy">Copy</button>
          <button class="lux-mw-act" data-act="wr">WR</button>
          <button class="lux-mw-act" data-act="pin">${e.pinned ? "Unpin" : "Pin"}</button>
          <button class="lux-mw-act danger" data-act="archive">Archive</button>
        </div>
      </div>
    `;
  }

  function render() {
    const attempts = (typeof getAttempts === "function" ? getAttempts() : []) || [];
    const raw = store.visibleEntries();
    const withStats = applyMyWordsStats(raw, attempts);

    const list =
      mode === "compact" ? withStats.slice(0, Math.max(0, maxPreview)) : withStats;

    if (!list.length) {
      elList.innerHTML = `
        <div class="lux-mw-empty">
          No saved words yet. Add a few above 👆
        </div>
      `;
      return;
    }

    elList.innerHTML = list.map(entryHTML).join("");

    if (mode === "compact" && withStats.length > maxPreview) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "lux-mw-viewAllBtn";
      more.textContent = `View all (${withStats.length})`;
      more.addEventListener("click", () => onOpenLibrary?.());
      elList.appendChild(more);
    }
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

  // --- events ---
  elSearch.addEventListener("input", (e) => {
    store.setQuery(e.target.value);
  });

  elClose.addEventListener("click", () => {
    // only closes the sidecar state (modal has its own close behavior)
    store.setOpen(false);
  });

  elAdd.addEventListener("click", () => {
    const raw = elTa.value || "";
    const res = store.addMany(raw);
    if (res.added || res.merged) elTa.value = "";
  });

  // ✅ ENTER = Add (Shift+Enter = newline)
  elTa.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      elAdd.click();
    }
  });

  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const row = e.target.closest(".lux-mw-entry");
    const id = row?.dataset?.id;
    if (!id) return;

    const entry = store.getState().entries.find((x) => x.id === id);
    if (!entry) return;

    const act = btn.dataset.act;

    if (act === "send") {
      onSendToInput?.(entry.text);
      return;
    }

    if (act === "copy") {
      await copyText(entry.text);
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
