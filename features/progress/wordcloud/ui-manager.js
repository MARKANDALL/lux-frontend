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

  // ✅ Busy overlay timing control (prevents invisible blink)
  let _busyOnAt = 0;
  let _hideTimer = null;
  const MIN_BUSY_MS = 250;

  function setBusy(on, title = "Loading…", subText = "") {
    if (!dom.overlay) return;

    if (on) {
      clearTimeout(_hideTimer);
      _busyOnAt = performance.now();

      dom.overlay.hidden = false;
      dom.overlay.style.display = "flex"; // ✅ override any CSS conflict
      dom.overlay.setAttribute("aria-busy", "true");

      if (dom.overlayTitle) dom.overlayTitle.textContent = title;
      if (dom.overlaySub) dom.overlaySub.textContent = subText || "";
      return;
    }

    // ✅ ensure overlay stays visible at least MIN_BUSY_MS (prevents invisible “blink”)
    const elapsed = performance.now() - _busyOnAt;
    const delay = Math.max(0, MIN_BUSY_MS - elapsed);

    clearTimeout(_hideTimer);
    _hideTimer = setTimeout(() => {
      dom.overlay.hidden = true;
      dom.overlay.style.display = "none";
      dom.overlay.setAttribute("aria-busy", "false");
    }, delay);
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
