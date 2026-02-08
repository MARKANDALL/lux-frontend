// features/harvard/modal-dom.js

export function createHarvardModalDOM({
  EXPLAIN_HTML,
  onSwitchTab,
  onClose,
  onModeSort,
  onModeOnly,
  onSearchInput,
  onClearFilter,
  onFocusChange,
  onPracticeClick,
  onListScrollReposition,
} = {}) {
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

  let filterBar = null;
  let filterClearBtn = null;

  let focusSel = null;
  let searchInput = null;
  let modeSortBtn = null;
  let modeOnlyBtn = null;

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

  // title + tabs
  const headLeft = document.createElement("div");
  headLeft.style.display = "flex";
  headLeft.style.alignItems = "center";
  headLeft.style.gap = "12px";
  head.appendChild(headLeft);

  const title = document.createElement("div");
  title.className = "lux-harvard-modal-title";
  title.textContent = "Library";
  headLeft.appendChild(title);

  const tabWrap = document.createElement("div");
  tabWrap.style.display = "flex";
  tabWrap.style.gap = "8px";
  tabWrap.style.alignItems = "center";
  headLeft.appendChild(tabWrap);

  tabHarvardBtn = document.createElement("button");
  tabHarvardBtn.type = "button";
  tabHarvardBtn.className = "lux-harvard-modetab is-active";
  tabHarvardBtn.textContent = "Harvard";
  tabHarvardBtn.addEventListener("click", () => onSwitchTab?.("harvard"));
  tabWrap.appendChild(tabHarvardBtn);

  tabPassagesBtn = document.createElement("button");
  tabPassagesBtn.type = "button";
  tabPassagesBtn.className = "lux-harvard-modetab";
  tabPassagesBtn.textContent = "Passages";
  tabPassagesBtn.addEventListener("click", () => onSwitchTab?.("passages"));
  tabWrap.appendChild(tabPassagesBtn);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lux-harvard-modal-x";
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => onClose?.());
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
  modeSortBtn.addEventListener("click", () => onModeSort?.());
  leftGroup.appendChild(modeSortBtn);

  modeOnlyBtn = document.createElement("button");
  modeOnlyBtn.type = "button";
  modeOnlyBtn.className = "lux-harvard-modetab";
  modeOnlyBtn.textContent = "Only";
  modeOnlyBtn.addEventListener("click", () => onModeOnly?.());
  leftGroup.appendChild(modeOnlyBtn);

  searchInput = document.createElement("input");
  searchInput.className = "lux-harvard-search";
  searchInput.type = "text";
  searchInput.placeholder = "Search…";
  searchInput.addEventListener("input", () =>
    onSearchInput?.(String(searchInput.value || ""))
  );
  filterBar.appendChild(searchInput);

  filterClearBtn = document.createElement("button");
  filterClearBtn.type = "button";
  filterClearBtn.className = "lux-harvard-filterclear";
  filterClearBtn.textContent = "Clear";
  filterClearBtn.disabled = true;
  filterClearBtn.addEventListener("click", () => onClearFilter?.());
  filterBar.appendChild(filterClearBtn);

  focusSel.addEventListener("change", () =>
    onFocusChange?.(focusSel.value ? String(focusSel.value) : "")
  );

  listEl = document.createElement("div");
  listEl.className = "lux-harvard-list";
  listEl.setAttribute("role", "listbox");
  listEl.setAttribute("aria-label", "Harvard lists");
  left.appendChild(listEl);

  // right panel
  const right = document.createElement("div");
  right.className = "lux-harvard-right";
  body.appendChild(right);

  explainRight = document.createElement("div");
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

  phonTitleEl = document.createElement("div");
  phonTitleEl.className = "lux-harvard-phoneme-title";
  phonTitleEl.textContent = "Top distinctive phonemes (this list vs Harvard set)";
  phonBlock.appendChild(phonTitleEl);

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
  practiceBtn.addEventListener("click", async () => onPracticeClick?.());
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
    if (e.target === overlay) onClose?.();
  });

  // close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay?.classList?.contains("is-open")) onClose?.();
  });

  // keep hover card positioned if list scrolls
  listEl.addEventListener("scroll", () => onListScrollReposition?.());

  document.body.appendChild(overlay);

  return {
    overlay,
    card,

    tabHarvardBtn,
    tabPassagesBtn,
    explainRight,

    listEl,

    selTitle,
    selLines,
    practiceBtn,
    statusMsg,

    phonTitleEl,
    phonRows,

    hoverCard,
    hoverTitle,
    hoverLines,

    filterBar,
    filterClearBtn,
    focusSel,
    searchInput,
    modeSortBtn,
    modeOnlyBtn,
  };
}
