// features/passages/library-modal.js
import { passages, PASSAGE_PHONEME_META } from "../../src/data/index.js";

const LS_FAVS = "LUX_PASSAGES_FAVS";
const LS_LAST = "LUX_PASSAGES_LAST";

function isHarvardKey(k) {
  return /^harvard\d{2}$/i.test(String(k || ""));
}

function linesForKey(key) {
  const rec = passages?.[key];
  const parts = rec?.parts;
  if (Array.isArray(parts)) return parts.map((s) => String(s || ""));
  return [];
}

function nameForKey(key) {
  const rec = passages?.[key];
  return String(rec?.name || key || "");
}

function countFor(key, ph) {
  if (!key || !ph) return 0;
  const m = PASSAGE_PHONEME_META?.[String(key)] || null;
  const c = m?.counts?.[String(ph).toUpperCase()];
  return Number(c || 0);
}

function totalFor(key) {
  const m = PASSAGE_PHONEME_META?.[String(key)] || null;
  return Number(m?.totalPhones || 0);
}

function getAllPhonemesFromMeta() {
  const set = new Set();
  const meta = PASSAGE_PHONEME_META || {};
  for (const m of Object.values(meta)) {
    const counts = m?.counts;
    if (!counts || typeof counts !== "object") continue;
    for (const ph of Object.keys(counts)) set.add(String(ph).toUpperCase());
  }
  return Array.from(set).sort();
}

function loadFavs() {
  try {
    const raw = localStorage.getItem(LS_FAVS) || "[]";
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map((x) => String(x)) : []);
  } catch {
    return new Set();
  }
}

function saveFavs(set) {
  try {
    localStorage.setItem(LS_FAVS, JSON.stringify(Array.from(set)));
  } catch {}
}

function loadLast() {
  try {
    return String(localStorage.getItem(LS_LAST) || "");
  } catch {
    return "";
  }
}

function saveLast(key) {
  try {
    localStorage.setItem(LS_LAST, String(key || ""));
  } catch {}
}

export function createPassageLibraryModal({ onPractice } = {}) {
  let overlay = null;
  let card = null;

  // left
  let listEl = null;

  // filters
  let focusSel = null;
  let btnSort = null;
  let btnOnly = null;
  let searchEl = null;
  let clearBtn = null;

  // right
  let selTitle = null;
  let selLines = null;
  let practiceBtn = null;
  let statusMsg = null;

  // hover
  let hoverCard = null;
  let hoverTitle = null;
  let hoverLines = null;

  let activeKey = null;
  let activePh = null;
  let focusMode = "sort"; // "sort" | "only"
  let q = "";

  let favs = loadFavs();

  function getAllPassageKeys() {
    const keys = Object.keys(passages || {});
    // Phase C: non-Harvard only (Harvard stays in its own modal for now)
    return keys.filter((k) => !isHarvardKey(k));
  }

  function getRows() {
    const keys = getAllPassageKeys();
    return keys.map((key) => {
      const name = nameForKey(key);
      const lines = linesForKey(key);
      const preview = lines[0] || "";
      return { key, name, preview, lines };
    });
  }

  function ensureDOM() {
    if (overlay) return;

    overlay = document.createElement("div");
    // Reuse the Harvard modal styling classes for a consistent look with zero new CSS
    overlay.className = "lux-harvard-modal";

    card = document.createElement("div");
    card.className = "lux-harvard-modal-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "Passage library");
    overlay.appendChild(card);

    // header
    const head = document.createElement("div");
    head.className = "lux-harvard-modal-head";
    card.appendChild(head);

    const title = document.createElement("div");
    title.className = "lux-harvard-modal-title";
    title.textContent = "Passage Library";
    head.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lux-harvard-modal-x";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", close);
    head.appendChild(closeBtn);

    // body shell
    const body = document.createElement("div");
    body.className = "lux-harvard-modal-body";
    card.appendChild(body);

    // LEFT: filterbar + list
    const left = document.createElement("div");
    left.className = "lux-harvard-left";
    body.appendChild(left);

    const filterbar = document.createElement("div");
    filterbar.className = "lux-harvard-filterbar";
    left.appendChild(filterbar);

    const fLabel = document.createElement("div");
    fLabel.className = "lux-harvard-filterlabel";
    fLabel.textContent = "Focus phoneme:";
    filterbar.appendChild(fLabel);

    focusSel = document.createElement("select");
    focusSel.className = "lux-harvard-filterselect";
    filterbar.appendChild(focusSel);

    btnSort = document.createElement("button");
    btnSort.type = "button";
    btnSort.className = "lux-harvard-filterbtn is-active";
    btnSort.textContent = "Sort";
    filterbar.appendChild(btnSort);

    btnOnly = document.createElement("button");
    btnOnly.type = "button";
    btnOnly.className = "lux-harvard-filterbtn";
    btnOnly.textContent = "Only";
    filterbar.appendChild(btnOnly);

    searchEl = document.createElement("input");
    searchEl.type = "search";
    searchEl.className = "lux-harvard-search";
    searchEl.placeholder = "Search...";
    filterbar.appendChild(searchEl);

    clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "lux-harvard-clear";
    clearBtn.textContent = "Clear";
    filterbar.appendChild(clearBtn);

    listEl = document.createElement("div");
    listEl.className = "lux-harvard-list";
    left.appendChild(listEl);

    // RIGHT: preview + practice
    const right = document.createElement("div");
    right.className = "lux-harvard-right";
    body.appendChild(right);

    const about = document.createElement("div");
    about.className = "lux-harvard-about";
    right.appendChild(about);

    const aboutTitle = document.createElement("div");
    aboutTitle.className = "lux-harvard-about-title";
    aboutTitle.textContent = "Selected passage";
    about.appendChild(aboutTitle);

    selTitle = document.createElement("div");
    selTitle.className = "lux-harvard-selected-title";
    about.appendChild(selTitle);

    selLines = document.createElement("div");
    selLines.className = "lux-harvard-selected-lines";
    about.appendChild(selLines);

    practiceBtn = document.createElement("button");
    practiceBtn.type = "button";
    practiceBtn.className = "lux-harvard-practice";
    practiceBtn.textContent = "Practice this passage";
    about.appendChild(practiceBtn);

    statusMsg = document.createElement("div");
    statusMsg.className = "lux-harvard-status";
    about.appendChild(statusMsg);

    // Hover preview (optional but cheap)
    hoverCard = document.createElement("div");
    hoverCard.className = "lux-harvard-hover";
    hoverCard.style.display = "none";

    hoverTitle = document.createElement("div");
    hoverTitle.className = "lux-harvard-hover-title";
    hoverCard.appendChild(hoverTitle);

    hoverLines = document.createElement("div");
    hoverLines.className = "lux-harvard-hover-lines";
    hoverCard.appendChild(hoverLines);

    overlay.appendChild(hoverCard);

    // Populate phoneme dropdown
    focusSel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "None";
    focusSel.appendChild(opt0);

    for (const ph of getAllPhonemesFromMeta()) {
      const o = document.createElement("option");
      o.value = ph;
      o.textContent = ph;
      focusSel.appendChild(o);
    }

    // Events
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", onEsc);

    focusSel.addEventListener("change", () => {
      activePh = focusSel.value ? String(focusSel.value).toUpperCase() : null;
      renderList();
    });

    btnSort.addEventListener("click", () => {
      focusMode = "sort";
      syncModeUI();
      renderList();
    });

    btnOnly.addEventListener("click", () => {
      focusMode = "only";
      syncModeUI();
      renderList();
    });

    searchEl.addEventListener("input", () => {
      q = String(searchEl.value || "").trim().toLowerCase();
      renderList();
    });

    clearBtn.addEventListener("click", () => {
      if (focusSel) focusSel.value = "";
      if (searchEl) searchEl.value = "";
      activePh = null;
      q = "";
      focusMode = "sort";
      syncModeUI();
      renderList();
    });

    practiceBtn.addEventListener("click", async () => {
      if (!activeKey) return;
      statusMsg.textContent = "Loading…";
      try {
        await onPractice?.(activeKey);
        statusMsg.textContent = "";
        close();
      } catch (err) {
        statusMsg.textContent = "Could not load that passage.";
        console.error("[PassageLibrary] onPractice error:", err);
      }
    });

    document.body.appendChild(overlay);

    // Initial selection: last or first
    const last = loadLast();
    const rows = getRows();
    const fallback = rows[0]?.key || null;
    const start = rows.some((r) => r.key === last) ? last : fallback;

    if (start) selectKey(start);
    renderList();
  }

  function syncModeUI() {
    if (btnSort) btnSort.classList.toggle("is-active", focusMode === "sort");
    if (btnOnly) btnOnly.classList.toggle("is-active", focusMode === "only");
  }

  function onEsc(e) {
    if (e.key === "Escape") close();
  }

  function selectKey(key) {
    activeKey = key;
    saveLast(key);

    const nm = nameForKey(key);
    const lines = linesForKey(key);

    selTitle.textContent = nm;
    selLines.innerHTML = "";

    for (const s of lines) {
      const div = document.createElement("div");
      div.className = "lux-harvard-line";
      div.textContent = s;
      selLines.appendChild(div);
    }

    // button enable
    practiceBtn.disabled = !key;
  }

  function matchesSearch(row) {
    if (!q) return true;
    if (row.name.toLowerCase().includes(q)) return true;
    // keep it simple: scan full text
    const full = row.lines.join(" ").toLowerCase();
    return full.includes(q);
  }

  function renderList() {
    if (!listEl) return;

    const rows = getRows();

    // Search filter
    let filtered = rows.filter(matchesSearch);

    // Focus phoneme filter/sort
    if (activePh) {
      const scored = filtered.map((r) => {
        const score = countFor(r.key, activePh);
        const total = totalFor(r.key);
        const pct = total ? score / total : 0;
        return { r, score, pct };
      });

      filtered =
        focusMode === "only"
          ? scored.filter((x) => x.score > 0).map((x) => x.r)
          : scored
              .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.pct !== a.pct) return b.pct - a.pct;
                return a.r.name.localeCompare(b.r.name);
              })
              .map((x) => x.r);
    } else {
      // Default ordering: name
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    listEl.innerHTML = "";

    for (const row of filtered) {
      const item = document.createElement("div");
      item.className = "lux-harvard-row";
      item.dataset.key = row.key;

      if (row.key === activeKey) item.classList.add("is-active");

      // left main
      const main = document.createElement("div");
      main.className = "lux-harvard-row-main";
      item.appendChild(main);

      const t = document.createElement("div");
      t.className = "lux-harvard-row-title";
      t.textContent = row.name;
      main.appendChild(t);

      const p = document.createElement("div");
      p.className = "lux-harvard-row-preview";
      p.textContent = row.preview;
      main.appendChild(p);

      // fav star
      const star = document.createElement("button");
      star.type = "button";
      star.className = "lux-harvard-fav";
      const isFav = favs.has(row.key);
      star.classList.toggle("is-on", isFav);
      star.textContent = isFav ? "★" : "☆";
      item.appendChild(star);

      item.addEventListener("click", (e) => {
        // if star clicked, toggle fav
        if (e.target === star) return;
        selectKey(row.key);
        renderList();
      });

      star.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (favs.has(row.key)) favs.delete(row.key);
        else favs.add(row.key);
        saveFavs(favs);
        renderList();
      });

      // hover preview
      item.addEventListener("mouseenter", () => {
        if (!hoverCard) return;
        hoverTitle.textContent = row.name;
        hoverLines.innerHTML = "";
        for (const s of row.lines.slice(0, 6)) {
          const div = document.createElement("div");
          div.className = "lux-harvard-hover-line";
          div.textContent = s;
          hoverLines.appendChild(div);
        }
        hoverCard.style.display = "block";
      });

      item.addEventListener("mouseleave", () => {
        if (!hoverCard) return;
        hoverCard.style.display = "none";
      });

      listEl.appendChild(item);
    }
  }

  function open() {
    ensureDOM();
    overlay.style.display = "flex";
    syncModeUI();
    // focus search for convenience
    setTimeout(() => {
      try {
        searchEl?.focus?.();
      } catch {}
    }, 0);
  }

  function close() {
    if (!overlay) return;
    overlay.style.display = "none";
    if (hoverCard) hoverCard.style.display = "none";
  }

  return { open, close };
}
