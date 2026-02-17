// features/harvard/modal-actions.js

export function ensurePhonemeOptions({
  focusSel,
  getAllTopPhonemes,
  getAllPhonemesFromPassageMeta,
} = {}) {
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

export function updateFilterUI({
  filterClearBtn,
  modeSortBtn,
  modeOnlyBtn,
  tabHarvardBtn,
  tabPassagesBtn,
  focusSel,
  activePh,
  focusMode,
  activeTab,
} = {}) {
  if (filterClearBtn) filterClearBtn.disabled = !activePh;

  if (modeSortBtn) modeSortBtn.classList.toggle("is-active", focusMode === "sort");
  if (modeOnlyBtn) modeOnlyBtn.classList.toggle("is-active", focusMode === "only");

  if (tabHarvardBtn)
    tabHarvardBtn.classList.toggle("is-active", activeTab === "harvard");
  if (tabPassagesBtn)
    tabPassagesBtn.classList.toggle("is-active", activeTab === "passages");

  if (focusSel) focusSel.value = activePh || "";
}

export function selectHarvardList({
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
} = {}) {
  if (!listEl) return;

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
    phonTitleEl.textContent = "Top distinctive phonemes (this list vs Harvard set)";
  renderHarvardPhonemeRows(n, phonRows);

  practiceBtn.textContent = "Practice this list";
  practiceBtn.disabled = false;

  try {
    localStorage.setItem("LUX_HARVARD_LAST", String(n));
  } catch {}
}

export function selectPassage({
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
} = {}) {
  if (!listEl) return;

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

export function showHoverHarvard({
  n,
  btn,
  lists,
  hoverTitle,
  hoverLines,
  renderLines,
  hoverCard,
  positionHoverCard,
} = {}) {
  const rec = lists?.find((x) => x.n === n);
  if (!rec) return;

  hoverTitle.textContent = rec.name;
  renderLines(hoverLines, rec.parts);

  hoverCard.style.display = "block";
  positionHoverCard(btn);
}

export function showHoverPassage({
  key,
  btn,
  passRecs,
  hoverTitle,
  hoverLines,
  renderLines,
  hoverCard,
  positionHoverCard,
} = {}) {
  const rec = passRecs?.find((x) => x.key === key);
  if (!rec) return;

  hoverTitle.textContent = rec.name;
  renderLines(hoverLines, rec.parts);

  hoverCard.style.display = "block";
  positionHoverCard(btn);
}

export function hideHover({ hoverCard } = {}) {
  if (hoverCard) hoverCard.style.display = "none";
}

export function positionHoverCard({
  btn,
  hoverCard,
  card,
  listEl,
} = {}) {
  if (!btn || !hoverCard || !card || !listEl) return;

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

export function switchTabCore({
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
} = {}) {
  if (next !== "harvard" && next !== "passages") return activeTab;
  if (activeTab === next) return activeTab;

  activeTab = next;

  if (explainRight) {
    explainRight.innerHTML = activeTab === "harvard" ? EXPLAIN_HTML : PASSAGES_EXPLAIN_HTML;
  }

  if (activeTab === "harvard") {
    selTitle.textContent = selectedN ? selTitle.textContent : "Select a list";
    practiceBtn.textContent = "Practice this list";
    practiceBtn.disabled = !selectedN;
    listEl.setAttribute("aria-label", "Harvard lists");
    if (phonTitleEl)
      phonTitleEl.textContent = "Top distinctive phonemes (this list vs Harvard set)";
    if (selectedN) renderHarvardPhonemeRows(selectedN, phonRows);
  } else {
    selTitle.textContent = selectedKey ? selTitle.textContent : "Select an item";
    practiceBtn.textContent = "Practice this passage";
    practiceBtn.disabled = !selectedKey;
    listEl.setAttribute("aria-label", "Passages");
    if (phonTitleEl) phonTitleEl.textContent = "Top phonemes (this passage)";
    if (selectedKey) renderPassagePhonemeRows(selectedKey, phonRows);
  }

  hideHover?.();

  return activeTab;
}
