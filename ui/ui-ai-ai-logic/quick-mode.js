// ui/ui-ai-ai-logic/quick-mode.js
// Quick Tips mode (paged tips + cache) for AI Coach.
// Extracted from ui/ui-ai-ai-logic.js (cut/paste only).

let quickTipState = { index: 0, count: 3, cache: [] };

export function resetQuickModeState() {
  quickTipState = { index: 0, count: 3, cache: [] };
}

export async function startQuickMode({
  azureResult,
  referenceText,
  firstLang,
  persona,
  setCurrentArgs,
  getCurrentArgs,
  getIsFetching,
  setIsFetching,
  showLoading,
  renderSections,
  updateFooterButtons,
  fetchAIFeedback,
  persistFeedbackToDB,
  showAIFeedbackError,
  handleShowLess,
  normalizeLang,
}) {
  const lang = normalizeLang(firstLang);
  setCurrentArgs({
    azureResult,
    referenceText,
    firstLang: lang,
    persona,
    mode: "simple",
  });

  resetQuickModeState();
  await showQuickTipAt({
    i: 0,
    getCurrentArgs,
    getIsFetching,
    setIsFetching,
    showLoading,
    renderSections,
    updateFooterButtons,
    fetchAIFeedback,
    persistFeedbackToDB,
    showAIFeedbackError,
    handleShowLess,
  });
}

async function showQuickTipAt({
  i,
  getCurrentArgs,
  getIsFetching,
  setIsFetching,
  showLoading,
  renderSections,
  updateFooterButtons,
  fetchAIFeedback,
  persistFeedbackToDB,
  showAIFeedbackError,
  handleShowLess,
}) {
  if (getIsFetching()) return;
  setIsFetching(true);
  showLoading();

  try {
    // cached?
    if (quickTipState.cache[i]) {
      hideLoadingAndRenderQuick({
        i,
        renderSections,
        updateFooterButtons,
        handleShowLess,
        showQuickTipAt,
        getCurrentArgs,
        getIsFetching,
        setIsFetching,
        showLoading,
        fetchAIFeedback,
        persistFeedbackToDB,
        showAIFeedbackError,
      });
      return;
    }

    const currentArgs = getCurrentArgs();
    const res = await fetchAIFeedback({
      ...currentArgs,
      mode: "simple",
      tipIndex: i,
      tipCount: quickTipState.count,
    });

    const sections = res.sections || res.fallbackSections || [];
    const meta = res.meta || {};

    if (Number.isFinite(meta.tipCount)) quickTipState.count = meta.tipCount;

    quickTipState.cache[i] = sections;

    hideLoadingAndRenderQuick({
      i,
      renderSections,
      updateFooterButtons,
      handleShowLess,
      showQuickTipAt,
      getCurrentArgs,
      getIsFetching,
      setIsFetching,
      showLoading,
      fetchAIFeedback,
      persistFeedbackToDB,
      showAIFeedbackError,
    });

    // OPTIONAL: prefetch next tip to make Next feel instant
    const next = i + 1;
    if (next < quickTipState.count && !quickTipState.cache[next]) {
      fetchAIFeedback({
        ...getCurrentArgs(),
        mode: "simple",
        tipIndex: next,
        tipCount: quickTipState.count,
      })
        .then((r) => {
          quickTipState.cache[next] = r.sections || r.fallbackSections || [];
        })
        .catch(() => {});
    }

    // Persist only the first viewed tip (keeps DB clean + fast)
    if (i === 0) persistFeedbackToDB(sections);
  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load Quick Tip.");
  } finally {
    setIsFetching(false);
  }
}

function hideLoadingAndRenderQuick({
  i,
  renderSections,
  updateFooterButtons,
  handleShowLess,
  showQuickTipAt,
  getCurrentArgs,
  getIsFetching,
  setIsFetching,
  showLoading,
  fetchAIFeedback,
  persistFeedbackToDB,
  showAIFeedbackError,
}) {
  const sections = quickTipState.cache[i] || [];
  quickTipState.index = i;

  renderSections(sections, sections.length);

  updateFooterButtons({
    canShowMore: i < quickTipState.count - 1,
    canShowLess: true,
    moreLabel: "Next Tip ➡",
    lessLabel: i === 0 ? "Back to Options ⬅" : "Previous Tip ⬅",
    onShowMore: () =>
      showQuickTipAt({
        i: i + 1,
        getCurrentArgs,
        getIsFetching,
        setIsFetching,
        showLoading,
        renderSections,
        updateFooterButtons,
        fetchAIFeedback,
        persistFeedbackToDB,
        showAIFeedbackError,
        handleShowLess,
      }),
    onShowLess: () =>
      i === 0
        ? handleShowLess()
        : showQuickTipAt({
            i: i - 1,
            getCurrentArgs,
            getIsFetching,
            setIsFetching,
            showLoading,
            renderSections,
            updateFooterButtons,
            fetchAIFeedback,
            persistFeedbackToDB,
            showAIFeedbackError,
            handleShowLess,
          }),
  });
}
