/**
 * features/progress/wordcloud/ui-manager.js
 *
 * Commit 14: "The Sync Layer"
 * Separates "how the page looks" from "what the page does".
 *
 * Owns:
 * - overlay / busy UI
 * - active pills/toggles UI
 * - timeline row sync
 * - mode story text
 *
 * index.js should call these functions after state changes.
 */

export function createWordcloudUIManager({ dom, getState, fmtDaysAgo }) {
  if (!dom) throw new Error("[wc/ui] dom is required");
  if (typeof getState !== "function")
    throw new Error("[wc/ui] getState() is required");

  const _fmtDaysAgo =
    typeof fmtDaysAgo === "function"
      ? fmtDaysAgo
      : (pos) => (pos === 0 ? "Now" : `${pos}d ago`);

  function setBusy(on, title = "Loading…", subText = "") {
    if (!dom.overlay) return;

    dom.overlay.hidden = !on;
    dom.overlay.style.display = on ? "flex" : "none"; // ✅ override any CSS conflict
    dom.overlay.setAttribute("aria-busy", on ? "true" : "false");

    if (dom.overlayTitle) dom.overlayTitle.textContent = title;
    if (dom.overlaySub) dom.overlaySub.textContent = subText || "";
  }

  function applyTimelineUI() {
    const S = getState();
    const show = S.range === "timeline";
    if (dom.timelineRow) dom.timelineRow.style.display = show ? "flex" : "none";

    if (dom.winSlider) dom.winSlider.value = String(S.timelineWin);
    if (dom.posSlider) dom.posSlider.value = String(S.timelinePos);

    if (dom.winVal) dom.winVal.textContent = `${S.timelineWin}d`;
    if (dom.posVal) dom.posVal.textContent = _fmtDaysAgo(S.timelinePos);
  }

  function setModeStory() {
    const S = getState();
    if (!dom.sub) return;

    dom.sub.textContent =
      S.mode === "phonemes"
        ? "Sounds that show up often + cause trouble (size = frequency, color = Lux difficulty)"
        : "Words you use often + struggle with most (size = frequency, color = Lux difficulty)";
  }

  function setActiveButtons() {
    const S = getState();

    (dom.pills || []).forEach((b) =>
      b.classList.toggle("is-active", b.dataset.mode === S.mode)
    );

    (dom.sortBtns || []).forEach((b) =>
      b.classList.toggle("is-on", b.dataset.sort === S.sort)
    );

    (dom.rangeBtns || []).forEach((b) =>
      b.classList.toggle("is-on", b.dataset.range === S.range)
    );

    if (dom.btnCluster) dom.btnCluster.classList.toggle("is-on", S.clusterMode);

    if (dom.mixView) dom.mixView.classList.toggle("is-on", S.mix === "view");
    if (dom.mixSmart) dom.mixSmart.classList.toggle("is-on", S.mix === "smart");

    applyTimelineUI();
  }

  return {
    setBusy,
    applyTimelineUI,
    setModeStory,
    setActiveButtons,
  };
}
