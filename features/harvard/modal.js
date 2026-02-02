// features/harvard/modal.js
import { ensureHarvardPassages, passages } from "../../src/data/index.js";
import { HARVARD_PHONEME_META } from "../../src/data/harvard-phoneme-meta.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function harvardKey(n) {
  return `harvard${pad2(n)}`;
}

function getHarvardMeta(n) {
  return (
    HARVARD_PHONEME_META?.[n] ??
    HARVARD_PHONEME_META?.[String(n)] ??
    HARVARD_PHONEME_META?.[String(n).padStart(2, "0")]
  );
}

const EXPLAIN_HTML = `
  <strong>What is the Harvard List?</strong><br/>
  The Harvard Sentences are a classic set of <b>72 lists × 10 short sentences</b>
  that cover a wide range of English sounds. Use them for a consistent, balanced
  practice baseline.
`;

export function createHarvardLibraryModal({ onPractice } = {}) {
  let overlay = null;
  let card = null;

  // left side
  let listEl = null;

  // right side
  let selTitle = null;
  let selLines = null;
  let practiceBtn = null;
  let statusMsg = null;

  // right-side phoneme block
  let phonRows = null;

  // hover preview
  let hoverCard = null;
  let hoverTitle = null;
  let hoverLines = null;

  // data
  let lists = null; // [{ n, key, name, parts, first }]
  let selectedN = null;
  let hoverN = null;
  let activePh = null;
  let filterBar = null;
  let filterClearBtn = null;

  let focusMode = "sort"; // "sort" | "only"
  let searchQ = "";
  let favs = new Set(); // list numbers
  let focusSel = null;
  let searchInput = null;
  let modeSortBtn = null;
  let modeOnlyBtn = null;

  function metaFor(n) {
    return (
      HARVARD_PHONEME_META?.[n] ??
      HARVARD_PHONEME_META?.[String(n)] ??
      HARVARD_PHONEME_META?.[String(n).padStart(2, "0")] ??
      null
    );
  }

  function countFor(n, ph) {
    if (!ph) return 0;
    const m = metaFor(n);
    const c = m?.phCounts?.[ph];
    return Number(c || 0);
  }

  function totalFor(n) {
    const m = metaFor(n);
    return Number(m?.totalPhones || 0);
  }

  function loadFavs() {
    try {
      const raw = localStorage.getItem("LUX_HARVARD_FAVS");
      const arr = raw ? JSON.parse(raw) : [];
      favs = new Set((Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter(Boolean));
    } catch {
      favs = new Set();
    }
  }

  function saveFavs() {
    try {
      localStorage.setItem("LUX_HARVARD_FAVS", JSON.stringify(Array.from(favs)));
    } catch {}
  }

  function ensurePhonemeOptions() {
    if (!focusSel || focusSel.dataset.populated === "1") return;

    const set = new Set();
    for (const m of Object.values(HARVARD_PHONEME_META || {})) {
      const keys = Object.keys(m?.phCounts || {});
      for (const ph of keys) set.add(ph);
    }
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));

    focusSel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "None";
    focusSel.appendChild(opt0);

    for (const ph of list) {
      const opt = document.createElement("option");
      opt.value = ph;
      opt.textContent = ph;
      focusSel.appendChild(opt);
    }

    focusSel.dataset.populated = "1";
  }

  function ensureDOM() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "lux-harvard-modal";

    card = document.createElement("div");
    card.className = "lux-harvard-modal-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "Harvard list browser");
    overlay.appendChild(card);

    // header
    const head = document.createElement("div");
    head.className = "lux-harvard-modal-head";
    card.appendChild(head);

    const title = document.createElement("div");
    title.className = "lux-harvard-modal-title";
    title.textContent = "Harvard List Library";
    head.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lux-harvard-modal-x";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", close);
    head.appendChild(closeBtn);

    // body
    const body = document.createElement("div");
    body.className = "lux-harvard-modal-body";
    card.appendChild(body);

    // left panel
    const left = document.createElement("div");
    left.className = "lux-harvard-left";
    body.appendChild(left);

    filterBar = document.createElement("div");
    filterBar.className = "lux-harvard-filterbar";
    left.appendChild(filterBar);

    const leftGroup = document.createElement("div");
    leftGroup.className = "lux-harvard-filterleft";
    filterBar.appendChild(leftGroup);

    const label = document.createElement("span");
    label.className = "lux-harvard-filterlabel";
    label.textContent = "Focus phoneme:";
    leftGroup.appendChild(label);

    focusSel = document.createElement("select");
    focusSel.className = "lux-harvard-phsel";
    leftGroup.appendChild(focusSel);

    modeSortBtn = document.createElement("button");
    modeSortBtn.type = "button";
    modeSortBtn.className = "lux-harvard-modetab";
    modeSortBtn.textContent = "Sort";
    modeSortBtn.addEventListener("click", () => {
      focusMode = "sort";
      renderList();
    });
    leftGroup.appendChild(modeSortBtn);

    modeOnlyBtn = document.createElement("button");
    modeOnlyBtn.type = "button";
    modeOnlyBtn.className = "lux-harvard-modetab";
    modeOnlyBtn.textContent = "Only";
    modeOnlyBtn.addEventListener("click", () => {
      focusMode = "only";
      renderList();
    });
    leftGroup.appendChild(modeOnlyBtn);

    searchInput = document.createElement("input");
    searchInput.className = "lux-harvard-search";
    searchInput.type = "text";
    searchInput.placeholder = "Search…";
    searchInput.addEventListener("input", () => {
      searchQ = String(searchInput.value || "").trim().toLowerCase();
      renderList();
    });
    filterBar.appendChild(searchInput);

    filterClearBtn = document.createElement("button");
    filterClearBtn.type = "button";
    filterClearBtn.className = "lux-harvard-filterclear";
    filterClearBtn.textContent = "Clear";
    filterClearBtn.disabled = true;
    filterClearBtn.addEventListener("click", () => {
      activePh = null;
      if (focusSel) focusSel.value = "";
      renderList();
    });
    filterBar.appendChild(filterClearBtn);

    focusSel.addEventListener("change", () => {
      activePh = focusSel.value ? String(focusSel.value) : null;
      renderList();
    });

    listEl = document.createElement("div");
    listEl.className = "lux-harvard-list";
    listEl.setAttribute("role", "listbox");
    listEl.setAttribute("aria-label", "Harvard lists");
    left.appendChild(listEl);

    // right panel
    const right = document.createElement("div");
    right.className = "lux-harvard-right";
    body.appendChild(right);

    const explainRight = document.createElement("div");
    explainRight.className = "lux-harvard-explain-right";
    explainRight.innerHTML = EXPLAIN_HTML;
    right.appendChild(explainRight);

    selTitle = document.createElement("div");
    selTitle.className = "lux-harvard-selected-title";
    selTitle.textContent = "Select a list";
    right.appendChild(selTitle);

    selLines = document.createElement("div");
    selLines.className = "lux-harvard-selected-lines";
    right.appendChild(selLines);

    const phonBlock = document.createElement("div");
    phonBlock.className = "lux-harvard-phoneme-block";
    right.appendChild(phonBlock);

    const phonTitle = document.createElement("div");
    phonTitle.className = "lux-harvard-phoneme-title";
    phonTitle.textContent = "Top distinctive phonemes (this list vs Harvard set)";
    phonBlock.appendChild(phonTitle);

    phonRows = document.createElement("div");
    phonBlock.appendChild(phonRows);

    statusMsg = document.createElement("div");
    statusMsg.className = "lux-harvard-status";
    statusMsg.textContent = "";
    right.appendChild(statusMsg);

    const footer = document.createElement("div");
    footer.className = "lux-harvard-selected-footer";
    right.appendChild(footer);

    practiceBtn = document.createElement("button");
    practiceBtn.type = "button";
    practiceBtn.className = "lux-harvard-practice";
    practiceBtn.textContent = "Practice this list";
    practiceBtn.disabled = true;
    practiceBtn.addEventListener("click", async () => {
      if (!selectedN) return;

      statusMsg.textContent = "";
      const prevLabel = practiceBtn.textContent;

      try {
        practiceBtn.disabled = true;
        practiceBtn.textContent = "Loading…";
        await onPractice?.(selectedN);
        close();
      } catch (err) {
        console.error("[Harvard] Practice action failed", err);
        statusMsg.textContent = "Could not start practice. See console for details.";
        practiceBtn.disabled = false;
      } finally {
        practiceBtn.textContent = prevLabel;
      }
    });
    footer.appendChild(practiceBtn);

    // hover preview card (absolute inside modal)
    hoverCard = document.createElement("div");
    hoverCard.className = "lux-harvard-hovercard";
    hoverCard.setAttribute("aria-hidden", "true");

    hoverTitle = document.createElement("div");
    hoverTitle.className = "lux-harvard-hovercard-title";
    hoverCard.appendChild(hoverTitle);

    hoverLines = document.createElement("div");
    hoverLines.className = "lux-harvard-hovercard-lines";
    hoverCard.appendChild(hoverLines);

    card.appendChild(hoverCard);

    // close on overlay click (outside the card)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay?.classList?.contains("is-open")) close();
    });

    // keep hover card positioned if list scrolls
    listEl.addEventListener("scroll", () => {
      if (!hoverN) return;
      const btn = listEl.querySelector(`.lux-harvard-item[data-n="${hoverN}"]`);
      if (btn) positionHoverCard(btn);
    });

    document.body.appendChild(overlay);
  }

  async function ensureLists() {
    if (lists) return lists;

    listEl.textContent = "Loading Harvard lists…";

    try {
      await ensureHarvardPassages();
    } catch (err) {
      console.error("[Harvard] ensureHarvardPassages failed", err);
      listEl.textContent = "Could not load Harvard lists.";
      return (lists = []);
    }

    const next = [];
    for (let n = 1; n <= 72; n++) {
      const key = harvardKey(n);
      const p = passages?.[key];
      const parts = Array.isArray(p?.parts) ? p.parts.slice(0, 10) : null;
      if (!parts || parts.length === 0) continue;
      next.push({
        n,
        key,
        name: p?.name || `Harvard List ${pad2(n)}`,
        parts,
        first: parts[0] || "",
        searchText: parts.join(" ").toLowerCase(),
      });
    }

    lists = next;
    return lists;
  }

  function clearNode(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }

  function renderLines(target, parts) {
    clearNode(target);
    (parts || []).forEach((line) => {
      const div = document.createElement("div");
      div.className = "lux-harvard-line";
      div.textContent = line;
      target.appendChild(div);
    });
  }

  function setFilterPh(ph) {
    // toggle
    activePh = (activePh === ph) ? null : ph;
    renderList();
  }

  function updateFilterUI() {
    if (filterClearBtn) filterClearBtn.disabled = !activePh;

    if (modeSortBtn) modeSortBtn.classList.toggle("is-active", focusMode === "sort");
    if (modeOnlyBtn) modeOnlyBtn.classList.toggle("is-active", focusMode === "only");

    if (focusSel) focusSel.value = activePh || "";
  }

  function renderPhonemeRows(n, phonRowsEl) {
    while (phonRowsEl.firstChild) phonRowsEl.removeChild(phonRowsEl.firstChild);

const meta =
  HARVARD_PHONEME_META?.[n] ??
  HARVARD_PHONEME_META?.[String(n)] ??
  HARVARD_PHONEME_META?.[String(n).padStart(2, "0")];
    const top3 = meta?.top3;

    if (!Array.isArray(top3) || top3.length === 0) {
      const empty = document.createElement("div");
      empty.className = "lux-harvard-status";
      empty.textContent = "Phoneme stats not available yet.";
      phonRowsEl.appendChild(empty);
      return;
    }

    top3.forEach((p) => {
      const row = document.createElement("div");
      row.className = "lux-harvard-phoneme-row";

      const chip = document.createElement("span");
      chip.className = "lux-harvard-phoneme-chip";
      chip.textContent = p.ph;

      const metaTxt = document.createElement("span");
      metaTxt.className = "lux-harvard-phoneme-meta";
      metaTxt.textContent = `${p.count} • ${(p.pct * 100).toFixed(1)}% • ×${p.lift.toFixed(2)}`;

      row.appendChild(chip);
      row.appendChild(metaTxt);
      phonRowsEl.appendChild(row);
    });
  }

  function setSelected(n) {
    selectedN = n;

    // highlight list selection
    listEl.querySelectorAll(".lux-harvard-item").forEach((btn) => {
      const isSel = Number(btn.dataset.n) === Number(n);
      btn.classList.toggle("is-selected", isSel);
      btn.setAttribute("aria-selected", isSel ? "true" : "false");
    });

    const rec = lists?.find((x) => x.n === n);
    if (!rec) return;

    selTitle.textContent = rec.name;
    renderLines(selLines, rec.parts);

    renderPhonemeRows(n, phonRows);

    practiceBtn.disabled = false;
  }

  function showHover(n, btn) {
    hoverN = n;

    const rec = lists?.find((x) => x.n === n);
    if (!rec) return;

    hoverTitle.textContent = rec.name;
    renderLines(hoverLines, rec.parts);

    hoverCard.style.display = "block";
    positionHoverCard(btn);
  }

  function hideHover() {
    hoverN = null;
    if (hoverCard) hoverCard.style.display = "none";
  }

  function positionHoverCard(btn) {
    if (!btn || !hoverCard || !card) return;

    const cardRect = card.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const listRect = listEl.getBoundingClientRect();

    // base: to the right of the list panel, aligned with the hovered row
    const left = Math.max(12, (listRect.right - cardRect.left) + 12);
    let top = Math.max(12, (btnRect.top - cardRect.top) - 6);

    hoverCard.style.left = `${left}px`;
    hoverCard.style.top = `${top}px`;

    // clamp bottom
    const maxBottom = cardRect.height - 12;
    const h = hoverCard.offsetHeight || 0;
    if (top + h > maxBottom) {
      top = Math.max(12, maxBottom - h);
      hoverCard.style.top = `${top}px`;
    }
  }

  async function renderList() {
    const data = await ensureLists();

    clearNode(listEl);

    let rows = data.slice();

    if (searchQ) {
      rows = rows.filter((rec) => rec.searchText?.includes(searchQ));
    }

    if (activePh) {
      // Sort ALL lists by how much the focus phoneme appears
      rows.sort((a, b) => {
        const cb = countFor(b.n, activePh);
        const ca = countFor(a.n, activePh);
        if (cb !== ca) return cb - ca;
        return a.n - b.n;
      });

      if (focusMode === "only") {
        rows = rows.filter((rec) => countFor(rec.n, activePh) > 0);
      }
    }

    // Favorites: pin to top (preserve existing order within each group)
    if (favs && favs.size) {
      const favRows = rows.filter((r) => favs.has(r.n));
      const otherRows = rows.filter((r) => !favs.has(r.n));
      rows = favRows.concat(otherRows);
    }

    updateFilterUI();

    rows.forEach((rec) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lux-harvard-item";
      btn.dataset.n = String(rec.n);
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");

      const num = document.createElement("span");
      num.className = "lux-harvard-item-num";
      num.textContent = pad2(rec.n);

      const first = document.createElement("span");
      first.className = "lux-harvard-item-first";
      first.textContent = rec.first;

      btn.appendChild(num);
      btn.appendChild(first);

      // Favorite star (doesn't trigger selection)
      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "lux-harvard-fav";
      favBtn.textContent = favs.has(rec.n) ? "★" : "☆";
      favBtn.title = favs.has(rec.n) ? "Unfavorite" : "Favorite";
      favBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (favs.has(rec.n)) favs.delete(rec.n);
        else favs.add(rec.n);
        saveFavs();
        renderList();
      });
      btn.appendChild(favBtn);

      // Focus score (count + %), shown when a phoneme is selected
      if (activePh) {
        const c = countFor(rec.n, activePh);
        const t = totalFor(rec.n);
        const pct = t ? (c / t) : 0;

        const badge = document.createElement("span");
        badge.className = "lux-harvard-focusbadge" + (c ? "" : " is-zero");
        badge.textContent = c ? `${c} • ${(pct * 100).toFixed(1)}%` : "—";
        badge.title = c ? `${activePh} appears ${c} times in this list` : `${activePh} not present`;
        btn.appendChild(badge);
      }

      // phoneme chips (top 3 distinctive)
      const chipWrap = document.createElement("div");
      chipWrap.className = "lux-harvard-item-chips";
      const top3 = getHarvardMeta(rec.n)?.top3 || [];
      top3.forEach((p) => {
        const chip = document.createElement("span");
        chip.className = "lux-harvard-item-chip" + (activePh === p.ph ? " is-active" : "");
        chip.textContent = p.ph;
        chip.title = `×${Number(p.lift || 0).toFixed(2)} • ${(Number(p.pct || 0) * 100).toFixed(1)}%`;
        chip.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          setFilterPh(p.ph);
        });
        chipWrap.appendChild(chip);
      });
      btn.appendChild(chipWrap);

      btn.addEventListener("mouseenter", () => showHover(rec.n, btn));
      btn.addEventListener("mouseleave", hideHover);

      btn.addEventListener("click", () => setSelected(rec.n));

      listEl.appendChild(btn);
    });

    // pre-select last used, but don't auto-practice
    try {
      const last = localStorage.getItem("LUX_HARVARD_LAST");
      const n = last ? Number.parseInt(last, 10) : null;
      if (n && n >= 1 && n <= 72) setSelected(n);
    } catch {}
  }

  function open() {
    ensureDOM();
    overlay.classList.add("is-open");

    loadFavs();
    ensurePhonemeOptions();

    // only build the list once, but allow re-open
    if (!lists) renderList();

    // reset hover
    hideHover();
    statusMsg.textContent = "";
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    hideHover();
  }

  return { open, close };
}
