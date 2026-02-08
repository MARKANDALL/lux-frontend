// features/harvard/modal.js
import { ensureHarvardPassages, passages } from "../../src/data/index.js";
import {
  pad2,
  harvardKey,
  getHarvardMeta,
  isHarvardKey,
  metaForKey,
  countForHarvard,
  totalForHarvard,
  countForKey,
  totalForKey,
  getAllTopPhonemes,
  getAllPhonemesFromPassageMeta,
} from "./modal-phoneme-metrics.js";
import { loadFavs, saveFavs } from "./modal-favs.js";
import { clearNode, renderLines } from "./modal-dom-helpers.js";
import { loadHarvardListRecords, loadPassageRecords } from "./modal-data.js";
import {
  renderHarvardPhonemeRows,
  renderPassagePhonemeRows,
} from "./modal-phoneme-rows.js";
import { createHarvardModalDOM } from "./modal-dom.js";

const EXPLAIN_HTML = `
  <strong>What is the Harvard List?</strong><br/>
  The Harvard Sentences are a classic set of <b>72 lists × 10 short sentences</b>
  that cover a wide range of English sounds. Use them for a consistent, balanced
  practice baseline.
`;

const PASSAGES_EXPLAIN_HTML = `
  <strong>What are these passages?</strong><br/>
  These are curated practice passages, drills, and phoneme tests already included in Lux.
  Use them to target specific sounds and build fluency.
`;

export function createHarvardLibraryModal({ onPractice } = {}) {
  let overlay = null;
  let card = null;

  // header
  let tabHarvardBtn = null;
  let tabPassagesBtn = null;
  let explainRight = null;

  // left side
  let listEl = null;

  // right side
  let selTitle = null;
  let selLines = null;
  let practiceBtn = null;
  let statusMsg = null;

  // right-side phoneme block
  let phonTitleEl = null;
  let phonRows = null;

  // hover preview
  let hoverCard = null;
  let hoverTitle = null;
  let hoverLines = null;

  // data
  let lists = null; // [{ n, key, name, parts, first, searchText }]
  let passRecs = null; // [{ key, name, parts, first, searchText }]
  let selectedN = null;
  let selectedKey = null;
  let hoverN = null;
  let hoverKey = null;
  let activeTab = "harvard"; // "harvard" | "passages"

  let activePh = null;
  let filterBar = null;
  let filterClearBtn = null;

  let focusMode = "sort"; // "sort" | "only"
  let searchQ = "";
  let favs = new Set(); // list numbers
  let favKeys = new Set(); // passage keys
  let focusSel = null;
  let searchInput = null;
  let modeSortBtn = null;
  let modeOnlyBtn = null;

  function ensurePhonemeOptions() {
    if (!focusSel || focusSel.dataset.populated === "1") return;

    const set = new Set();
    getAllTopPhonemes().forEach((ph) => set.add(ph));
    getAllPhonemesFromPassageMeta().forEach((ph) => set.add(ph));
    const list = Array.from(set).sort();

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

    const dom = createHarvardModalDOM({
      EXPLAIN_HTML,
      onSwitchTab: (t) => switchTab(t),
      onClose: () => close(),
      onModeSort: () => {
        focusMode = "sort";
        renderList();
      },
      onModeOnly: () => {
        focusMode = "only";
        renderList();
      },
      onSearchInput: (val) => {
        searchQ = String(val || "").trim().toLowerCase();
        renderList();
      },
      onClearFilter: () => {
        activePh = null;
        if (focusSel) focusSel.value = "";
        renderList();
      },
      onFocusChange: (val) => {
        activePh = val ? String(val) : null;
        renderList();
      },
      onPracticeClick: async () => {
        statusMsg.textContent = "";
        const prevLabel = practiceBtn.textContent;

        try {
          practiceBtn.disabled = true;
          practiceBtn.textContent = "Loading…";

          if (activeTab === "harvard") {
            if (!selectedN) return;
            await onPractice?.({ kind: "harvard", n: selectedN });
          } else {
            if (!selectedKey) return;
            await onPractice?.({ kind: "passage", key: selectedKey });
          }

          close();
        } catch (err) {
          console.error("[Harvard] Practice action failed", err);
          statusMsg.textContent =
            "Could not start practice. See console for details.";
          practiceBtn.disabled = false;
        } finally {
          practiceBtn.textContent = prevLabel;
        }
      },
      onListScrollReposition: () => {
        if (!hoverCard) return;

        let btn = null;
        if (hoverN)
          btn = listEl.querySelector(`.lux-harvard-item[data-n="${hoverN}"]`);
        else if (hoverKey)
          btn = listEl.querySelector(`.lux-harvard-item[data-key="${hoverKey}"]`);

        if (btn) positionHoverCard(btn);
      },
    });

    overlay = dom.overlay;
    card = dom.card;

    tabHarvardBtn = dom.tabHarvardBtn;
    tabPassagesBtn = dom.tabPassagesBtn;
    explainRight = dom.explainRight;

    listEl = dom.listEl;

    selTitle = dom.selTitle;
    selLines = dom.selLines;
    practiceBtn = dom.practiceBtn;
    statusMsg = dom.statusMsg;

    phonTitleEl = dom.phonTitleEl;
    phonRows = dom.phonRows;

    hoverCard = dom.hoverCard;
    hoverTitle = dom.hoverTitle;
    hoverLines = dom.hoverLines;

    filterBar = dom.filterBar;
    filterClearBtn = dom.filterClearBtn;
    focusSel = dom.focusSel;
    searchInput = dom.searchInput;
    modeSortBtn = dom.modeSortBtn;
    modeOnlyBtn = dom.modeOnlyBtn;
  }

  async function ensureLists() {
    if (lists) return lists;
    const next = await loadHarvardListRecords({
      listEl,
      ensureHarvardPassages,
      passages,
      pad2,
      harvardKey,
    });
    lists = next;
    return lists;
  }

  async function ensurePassages() {
    if (passRecs) return passRecs;
    const next = loadPassageRecords({ passages, isHarvardKey });
    passRecs = next;
    return passRecs;
  }

  function setFilterPh(ph) {
    // toggle
    activePh = activePh === ph ? null : ph;
    renderList();
  }

  function updateFilterUI() {
    if (filterClearBtn) filterClearBtn.disabled = !activePh;

    if (modeSortBtn)
      modeSortBtn.classList.toggle("is-active", focusMode === "sort");
    if (modeOnlyBtn)
      modeOnlyBtn.classList.toggle("is-active", focusMode === "only");

    if (tabHarvardBtn)
      tabHarvardBtn.classList.toggle("is-active", activeTab === "harvard");
    if (tabPassagesBtn)
      tabPassagesBtn.classList.toggle("is-active", activeTab === "passages");

    if (focusSel) focusSel.value = activePh || "";
  }

  // (moved) renderHarvardPhonemeRows + renderPassagePhonemeRows

  function setSelected(n) {
    selectedN = n;

    listEl.querySelectorAll(".lux-harvard-item[data-n]").forEach((btn) => {
      const isSel = Number(btn.dataset.n) === Number(n);
      btn.classList.toggle("is-selected", isSel);
      btn.setAttribute("aria-selected", isSel ? "true" : "false");
    });

    const rec = lists?.find((x) => x.n === n);
    if (!rec) return;

    selTitle.textContent = rec.name;
    renderLines(selLines, rec.parts);

    if (phonTitleEl)
      phonTitleEl.textContent =
        "Top distinctive phonemes (this list vs Harvard set)";
    renderHarvardPhonemeRows(n, phonRows);

    practiceBtn.textContent = "Practice this list";
    practiceBtn.disabled = false;

    try {
      localStorage.setItem("LUX_HARVARD_LAST", String(n));
    } catch {}
  }

  function setSelectedPassage(key) {
    selectedKey = key;

    listEl.querySelectorAll(".lux-harvard-item[data-key]").forEach((btn) => {
      const isSel = String(btn.dataset.key) === String(key);
      btn.classList.toggle("is-selected", isSel);
      btn.setAttribute("aria-selected", isSel ? "true" : "false");
    });

    const rec = passRecs?.find((x) => x.key === key);
    if (!rec) return;

    selTitle.textContent = rec.name;
    renderLines(selLines, rec.parts);

    if (phonTitleEl) phonTitleEl.textContent = "Top phonemes (this passage)";
    renderPassagePhonemeRows(key, phonRows);

    practiceBtn.textContent = "Practice this passage";
    practiceBtn.disabled = false;

    try {
      localStorage.setItem("LUX_PASSAGES_LAST", String(key));
    } catch {}
  }

  function showHoverHarvard(n, btn) {
    hoverN = n;
    hoverKey = null;

    const rec = lists?.find((x) => x.n === n);
    if (!rec) return;

    hoverTitle.textContent = rec.name;
    renderLines(hoverLines, rec.parts);

    hoverCard.style.display = "block";
    positionHoverCard(btn);
  }

  function showHoverPassage(key, btn) {
    hoverKey = key;
    hoverN = null;

    const rec = passRecs?.find((x) => x.key === key);
    if (!rec) return;

    hoverTitle.textContent = rec.name;
    renderLines(hoverLines, rec.parts);

    hoverCard.style.display = "block";
    positionHoverCard(btn);
  }

  function hideHover() {
    hoverN = null;
    hoverKey = null;
    if (hoverCard) hoverCard.style.display = "none";
  }

  function positionHoverCard(btn) {
    if (!btn || !hoverCard || !card) return;

    const cardRect = card.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const listRect = listEl.getBoundingClientRect();

    // base: to the right of the list panel, aligned with the hovered row
    const left = Math.max(12, listRect.right - cardRect.left + 12);
    let top = Math.max(12, btnRect.top - cardRect.top - 6);

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

  function switchTab(next) {
    if (next !== "harvard" && next !== "passages") return;
    if (activeTab === next) return;

    activeTab = next;

    if (explainRight) {
      explainRight.innerHTML =
        activeTab === "harvard" ? EXPLAIN_HTML : PASSAGES_EXPLAIN_HTML;
    }

    if (activeTab === "harvard") {
      selTitle.textContent = selectedN ? selTitle.textContent : "Select a list";
      practiceBtn.textContent = "Practice this list";
      practiceBtn.disabled = !selectedN;
      listEl.setAttribute("aria-label", "Harvard lists");
      if (phonTitleEl)
        phonTitleEl.textContent =
          "Top distinctive phonemes (this list vs Harvard set)";
      if (selectedN) renderHarvardPhonemeRows(selectedN, phonRows);
    } else {
      selTitle.textContent = selectedKey
        ? selTitle.textContent
        : "Select an item";
      practiceBtn.textContent = "Practice this passage";
      practiceBtn.disabled = !selectedKey;
      listEl.setAttribute("aria-label", "Passages");
      if (phonTitleEl) phonTitleEl.textContent = "Top phonemes (this passage)";
      if (selectedKey) renderPassagePhonemeRows(selectedKey, phonRows);
    }

    hideHover();
    renderList();
  }

  async function renderList() {
    const isHarvard = activeTab === "harvard";
    const data = isHarvard ? await ensureLists() : await ensurePassages();

    clearNode(listEl);

    let rows = data.slice();

    if (searchQ) {
      rows = rows.filter((rec) => rec.searchText?.includes(searchQ));
    }

    if (activePh) {
      const scored = rows.map((rec) => {
        const score = isHarvard
          ? countForHarvard(rec.n, activePh)
          : countForKey(rec.key, activePh);

        const total = isHarvard ? totalForHarvard(rec.n) : totalForKey(rec.key);

        const pct = total ? score / total : 0;

        return { rec, score, pct };
      });

      const filtered =
        focusMode === "only" ? scored.filter((x) => x.score > 0) : scored;

      rows = filtered
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.pct !== a.pct) return b.pct - a.pct;
          return isHarvard
            ? a.rec.n - b.rec.n
            : String(a.rec.name).localeCompare(String(b.rec.name));
        })
        .map((x) => x.rec);
    }

    // Favorites: pin to top (preserve existing order within each group)
    if (isHarvard) {
      if (favs && favs.size) {
        const favRows = rows.filter((r) => favs.has(r.n));
        const otherRows = rows.filter((r) => !favs.has(r.n));
        rows = favRows.concat(otherRows);
      }
    } else {
      if (favKeys && favKeys.size) {
        const favRows = rows.filter((r) => favKeys.has(r.key));
        const otherRows = rows.filter((r) => !favKeys.has(r.key));
        rows = favRows.concat(otherRows);
      }
    }

    updateFilterUI();

    rows.forEach((rec) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lux-harvard-item";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");

      if (isHarvard) {
        btn.dataset.n = String(rec.n);

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
          saveFavs(favs, favKeys);
          renderList();
        });
        btn.appendChild(favBtn);

        // Focus score (count + %), shown when a phoneme is selected
        if (activePh) {
          const c = countForHarvard(rec.n, activePh);
          const t = totalForHarvard(rec.n);
          const pct = t ? c / t : 0;

          const badge = document.createElement("span");
          badge.className = "lux-harvard-focusbadge" + (c ? "" : " is-zero");
          badge.textContent = c
            ? t
              ? `${c} • ${(pct * 100).toFixed(1)}%`
              : `${c}`
            : "—";
          badge.title = c
            ? `${activePh} appears ${c} times in this list`
            : `${activePh} not present`;
          btn.appendChild(badge);
        }

        // phoneme chips (top 3 distinctive)
        const chipWrap = document.createElement("div");
        chipWrap.className = "lux-harvard-item-chips";
        const top3 = getHarvardMeta(rec.n)?.top3 || [];
        top3.forEach((p) => {
          const chip = document.createElement("span");
          chip.className =
            "lux-harvard-item-chip" + (activePh === p.ph ? " is-active" : "");
          chip.textContent = p.ph;
          chip.title = `×${Number(p.lift || 0).toFixed(2)} • ${(
            Number(p.pct || 0) * 100
          ).toFixed(1)}%`;
          chip.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            setFilterPh(p.ph);
          });
          chipWrap.appendChild(chip);
        });
        btn.appendChild(chipWrap);

        btn.classList.toggle("is-selected", Number(rec.n) === Number(selectedN));
        btn.setAttribute(
          "aria-selected",
          Number(rec.n) === Number(selectedN) ? "true" : "false"
        );

        btn.addEventListener("mouseenter", () => showHoverHarvard(rec.n, btn));
        btn.addEventListener("mouseleave", hideHover);
        btn.addEventListener("click", () => setSelected(rec.n));
      } else {
        btn.dataset.key = String(rec.key);

        const first = document.createElement("span");
        first.className = "lux-harvard-item-first";
        first.textContent = rec.name;
        btn.appendChild(first);

        const favBtn = document.createElement("button");
        favBtn.type = "button";
        favBtn.className = "lux-harvard-fav";
        favBtn.textContent = favKeys.has(rec.key) ? "★" : "☆";
        favBtn.title = favKeys.has(rec.key) ? "Unfavorite" : "Favorite";
        favBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (favKeys.has(rec.key)) favKeys.delete(rec.key);
          else favKeys.add(rec.key);
          saveFavs(favs, favKeys);
          renderList();
        });
        btn.appendChild(favBtn);

        if (activePh) {
          const c = countForKey(rec.key, activePh);
          const t = totalForKey(rec.key);
          const pct = t ? c / t : 0;

          const badge = document.createElement("span");
          badge.className = "lux-harvard-focusbadge" + (c ? "" : " is-zero");
          badge.textContent = c ? `${c} • ${(pct * 100).toFixed(1)}%` : "—";
          badge.title = c
            ? `${activePh} appears ${c} times in this passage`
            : `${activePh} not present`;
          btn.appendChild(badge);
        }

        const chipWrap = document.createElement("div");
        chipWrap.className = "lux-harvard-item-chips";

        const m = metaForKey(rec.key);
        const counts = m?.counts;
        if (counts && typeof counts === "object") {
          const top = Object.entries(counts)
            .map(([ph, c]) => ({
              ph: String(ph).toUpperCase(),
              c: Number(c || 0),
            }))
            .filter((x) => x.c > 0)
            .sort((a, b) => b.c - a.c)
            .slice(0, 3);

          top.forEach((p) => {
            const chip = document.createElement("span");
            chip.className =
              "lux-harvard-item-chip" + (activePh === p.ph ? " is-active" : "");
            chip.textContent = p.ph;
            chip.title = `${p.c} occurrences`;
            chip.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              setFilterPh(p.ph);
            });
            chipWrap.appendChild(chip);
          });
        }
        btn.appendChild(chipWrap);

        btn.classList.toggle(
          "is-selected",
          String(rec.key) === String(selectedKey)
        );
        btn.setAttribute(
          "aria-selected",
          String(rec.key) === String(selectedKey) ? "true" : "false"
        );

        btn.addEventListener("mouseenter", () => showHoverPassage(rec.key, btn));
        btn.addEventListener("mouseleave", hideHover);
        btn.addEventListener("click", () => setSelectedPassage(rec.key));
      }

      listEl.appendChild(btn);
    });

    // pre-select last used, but don't auto-practice
    if (isHarvard) {
      try {
        const last = localStorage.getItem("LUX_HARVARD_LAST");
        const n = last ? Number.parseInt(last, 10) : null;
        if (n && n >= 1 && n <= 72) setSelected(n);
      } catch {}
    } else {
      try {
        const last = localStorage.getItem("LUX_PASSAGES_LAST");
        const key = last ? String(last) : "";
        if (key && passRecs?.some((r) => r.key === key))
          setSelectedPassage(key);
      } catch {}
    }
  }

  function open() {
    ensureDOM();
    overlay.classList.add("is-open");

    {
      const loaded = loadFavs();
      favs = loaded.favs;
      favKeys = loaded.favKeys;
    }
    ensurePhonemeOptions();

    if (explainRight) {
      explainRight.innerHTML =
        activeTab === "harvard" ? EXPLAIN_HTML : PASSAGES_EXPLAIN_HTML;
    }

    renderList();

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
