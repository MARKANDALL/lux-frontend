
// features/harvard/modal-controller.js
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
import { renderHarvardModalList } from "./modal-render-list.js";
import {
  ensurePhonemeOptions as ensurePhonemeOptionsCore,
  updateFilterUI as updateFilterUICore,
  selectHarvardList,
  selectPassage,
  showHoverHarvard as showHoverHarvardCore,
  showHoverPassage as showHoverPassageCore,
  hideHover as hideHoverCore,
  positionHoverCard as positionHoverCardCore,
  switchTabCore,
} from "./modal-actions.js";

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
    return ensurePhonemeOptionsCore({
      focusSel,
      getAllTopPhonemes,
      getAllPhonemesFromPassageMeta,
    });
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
          btn = listEl.querySelector(
            `.lux-harvard-item[data-key="${hoverKey}"]`
          );

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
    return updateFilterUICore({
      filterClearBtn,
      modeSortBtn,
      modeOnlyBtn,
      tabHarvardBtn,
      tabPassagesBtn,
      focusSel,
      activePh,
      focusMode,
      activeTab,
    });
  }

  function setSelected(n) {
    selectedN = n;
    return selectHarvardList({
      n,
      listEl,
      lists,
      selTitle,
      selLines,
      renderLines,
      phonTitleEl,
      phonRows,
      renderHarvardPhonemeRows,
      practiceBtn,
    });
  }

  function setSelectedPassage(key) {
    selectedKey = key;
    return selectPassage({
      key,
      listEl,
      passRecs,
      selTitle,
      selLines,
      renderLines,
      phonTitleEl,
      phonRows,
      renderPassagePhonemeRows,
      practiceBtn,
    });
  }

  function showHoverHarvard(n, btn) {
    hoverN = n;
    hoverKey = null;
    return showHoverHarvardCore({
      n,
      btn,
      lists,
      hoverTitle,
      hoverLines,
      renderLines,
      hoverCard,
      positionHoverCard,
    });
  }

  function showHoverPassage(key, btn) {
    hoverKey = key;
    hoverN = null;
    return showHoverPassageCore({
      key,
      btn,
      passRecs,
      hoverTitle,
      hoverLines,
      renderLines,
      hoverCard,
      positionHoverCard,
    });
  }

  function hideHover() {
    hoverN = null;
    hoverKey = null;
    return hideHoverCore({ hoverCard });
  }

  function positionHoverCard(btn) {
    return positionHoverCardCore({
      btn,
      hoverCard,
      card,
      listEl,
    });
  }

  function switchTab(next) {
    activeTab = switchTabCore({
      next,
      activeTab,
      explainRight,
      EXPLAIN_HTML,
      PASSAGES_EXPLAIN_HTML,

      selectedN,
      selectedKey,
      selTitle,
      practiceBtn,
      listEl,
      phonTitleEl,
      phonRows,

      renderHarvardPhonemeRows,
      renderPassagePhonemeRows,

      hideHover,
      renderList,
    });
  }

  async function renderList() {
    return renderHarvardModalList({
      activeTab,
      searchQ,
      activePh,
      focusMode,
      selectedN,
      selectedKey,

      ensureLists,
      ensurePassages,
      favs,
      favKeys,

      listEl,

      clearNode,
      pad2,
      getHarvardMeta,
      metaForKey,
      countForHarvard,
      totalForHarvard,
      countForKey,
      totalForKey,

      updateFilterUI,
      setFilterPh,
      setSelected,
      setSelectedPassage,
      showHoverHarvard,
      showHoverPassage,
      hideHover,
      saveFavs,

      renderList,
    });
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

