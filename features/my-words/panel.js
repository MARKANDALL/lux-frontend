// features/my-words/panel.js

function escapeHTML(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fmtAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const d = Date.now() - t;
  const mins = Math.floor(d / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function mountMyWordsPanel({ store, onSendToInput }) {
  const panel = document.createElement("div");
  panel.className = "lux-mw-panel";
  panel.id = "luxMyWordsPanel";

  panel.innerHTML = `
    <div class="lux-mw-head">
      <div class="lux-mw-title">My Words</div>
      <div class="lux-mw-headRight">
        <input class="lux-mw-search" type="search" placeholder="Search..." aria-label="Search My Words" />
        <button class="lux-mw-iconBtn" type="button" title="Close" aria-label="Close">✕</button>
      </div>
    </div>

    <div class="lux-mw-body">
      <div class="lux-mw-add">
        <div class="lux-mw-addLabel">Add words/phrases (one per line)</div>
        <textarea class="lux-mw-addBox" rows="3" placeholder="conference call&#10;thirty-three&#10;thanks for having me"></textarea>

        <div class="lux-mw-addRow">
          <button class="lux-mw-addBtn" type="button">Add</button>
          <div class="lux-mw-hint">Tip: Tap <b>Send</b> to push into the input instantly.</div>
        </div>
      </div>

      <div class="lux-mw-list"></div>
    </div>
  `;

  document.body.appendChild(panel);

  const searchEl = panel.querySelector(".lux-mw-search");
  const closeBtn = panel.querySelector(".lux-mw-iconBtn");
  const addBox = panel.querySelector(".lux-mw-addBox");
  const addBtn = panel.querySelector(".lux-mw-addBtn");
  const listEl = panel.querySelector(".lux-mw-list");

  closeBtn.addEventListener("click", () => store.setOpen(false));

  searchEl.addEventListener("input", (e) => {
    store.setQuery(e.target.value);
  });

  addBtn.addEventListener("click", () => {
    const raw = addBox.value;
    const { added, merged } = store.addMany(raw);
    if (added || merged) addBox.value = "";
  });

  function render(state) {
    panel.classList.toggle("is-open", !!state.open);

    // list
    const entries = store.visibleEntries();

    if (!entries.length) {
      listEl.innerHTML = `
        <div class="lux-mw-empty">
          <strong>Your list is empty.</strong>
          Add real-life words here, then tap <b>Send</b> to practice instantly.
        </div>
      `;
      return;
    }

    listEl.innerHTML = "";

    entries.forEach((e) => {
      const row = document.createElement("div");
      row.className = "lux-mw-row";

      const dotColor = e.mw_color || "rgba(100,100,100,.35)";

      const attempts = e.mw_attempts || 0;
      const lastScore = Number.isFinite(e.mw_lastScore) ? Math.round(e.mw_lastScore) : null;

      const metaParts = [];
      metaParts.push(`Practiced ${attempts}×`);

      if (lastScore != null) metaParts.push(`Last ${lastScore}${e.mw_trend ? " " + e.mw_trend : ""}`);
      if (e.mw_lastAt) metaParts.push(fmtAgo(e.mw_lastAt));
      else metaParts.push(`Saved ${fmtAgo(e.updated_at || e.created_at)}`);

      if (e.pinned) metaParts.push("pinned");

      const meta = metaParts.join(" · ");

      row.innerHTML = `
        <div class="lux-mw-dot" aria-hidden="true" style="background:${dotColor};"></div>

        <div class="lux-mw-main">
          <div class="lux-mw-text" title="${escapeHTML(e.text)}">${escapeHTML(e.text)}</div>
          <div class="lux-mw-meta">${meta}</div>
        </div>

        <div class="lux-mw-actions">
          <button class="lux-mw-miniBtn primary" type="button">Send</button>
          <button class="lux-mw-miniBtn" type="button">Copy</button>
          <button class="lux-mw-miniBtn" type="button">${e.pinned ? "Unpin" : "Pin"}</button>
          <button class="lux-mw-miniBtn" type="button">Archive</button>
        </div>
      `;

      const btnSend = row.querySelectorAll(".lux-mw-miniBtn")[0];
      const btnCopy = row.querySelectorAll(".lux-mw-miniBtn")[1];
      const btnPin  = row.querySelectorAll(".lux-mw-miniBtn")[2];
      const btnArch = row.querySelectorAll(".lux-mw-miniBtn")[3];

      btnSend.addEventListener("click", () => onSendToInput?.(e.text));
      btnCopy.addEventListener("click", async () => {
        const ok = await copyText(e.text);
        btnCopy.textContent = ok ? "Copied" : "Copy";
        setTimeout(() => (btnCopy.textContent = "Copy"), 900);
      });
      btnPin.addEventListener("click", () => store.togglePin(e.id));
      btnArch.addEventListener("click", () => store.archive(e.id));

      listEl.appendChild(row);
    });
  }

  const unsub = store.subscribe(render);

  return {
    el: panel,
    destroy() {
      unsub?.();
      panel.remove();
    }
  };
}
