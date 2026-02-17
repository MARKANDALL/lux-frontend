// ui/ui-ai-ai-logic/deep-mode.js
// Deep Dive mode (chunked sections + footer controls) for AI Coach.
// Extracted from ui/ui-ai-ai-logic.js (cut/paste only).

export async function startDeepMode({
  azureResult,
  referenceText,
  firstLang,
  persona,

  setCurrentArgs,
  getCurrentArgs,

  getChunkHistory,
  setChunkHistory,

  getIsFetching,
  setIsFetching,

  showLoading,
  renderSections,
  updateFooterButtons,
  fetchAIFeedback,
  persistFeedbackToDB,
  showAIFeedbackError,
  getLastAttemptId,
  normalizeLang,

  // NEW: footer wiring from orchestrator
  onShowLess,
}) {
  const lang = normalizeLang(firstLang);
  setCurrentArgs({
    azureResult,
    referenceText,
    firstLang: lang,
    persona,
    mode: "detailed",
  });

  setChunkHistory([]);

  await fetchNextChunk({
    getCurrentArgs,
    getChunkHistory,
    setChunkHistory,
    getIsFetching,
    setIsFetching,
    showLoading,
    renderSections,
    updateFooterButtons,
    fetchAIFeedback,
    persistFeedbackToDB,
    showAIFeedbackError,
    getLastAttemptId,
    onShowLess,
  });
}

export async function fetchNextChunk({
  getCurrentArgs,
  getChunkHistory,
  setChunkHistory,
  getIsFetching,
  setIsFetching,
  showLoading,
  renderSections,
  updateFooterButtons,
  fetchAIFeedback,
  persistFeedbackToDB,
  showAIFeedbackError,
  getLastAttemptId,

  // NEW: footer wiring from orchestrator
  onShowLess,
}) {
  if (getIsFetching()) return;

  const chunkHistory = getChunkHistory();
  const nextChunkId = chunkHistory.length + 1;

  // If we've hit the cap, still refresh footer so buttons reflect "no more"
  if (nextChunkId > 3) {
    refreshFooter({
      getChunkHistory,
      getIsFetching,
      updateFooterButtons,
      onShowMore: () => {},
      onShowLess,
    });
    return;
  }

  setIsFetching(true);

  // While loading:
  // - first chunk shows the big loading UI
  // - subsequent chunks keep footer responsive (back button still available)
  if (nextChunkId === 1) {
    showLoading();
  } else {
    refreshFooter({
      getChunkHistory,
      getIsFetching,
      updateFooterButtons,
      onShowMore: () =>
        fetchNextChunk({
          getCurrentArgs,
          getChunkHistory,
          setChunkHistory,
          getIsFetching,
          setIsFetching,
          showLoading,
          renderSections,
          updateFooterButtons,
          fetchAIFeedback,
          persistFeedbackToDB,
          showAIFeedbackError,
          getLastAttemptId,
          onShowLess,
        }),
      onShowLess,
    });
  }

  try {
    // DeepDive: includeHistory ~1/3 of the time deterministically on chunk 1
    const attemptIdNum = Number(getLastAttemptId());
    const includeHistory =
      nextChunkId === 1 && Number.isFinite(attemptIdNum)
        ? attemptIdNum % 3 === 0
        : undefined;

    const res = await fetchAIFeedback({
      ...getCurrentArgs(),
      chunk: nextChunkId,
      includeHistory,
    });

    const newSections = res.sections || res.fallbackSections || [];

    const nextHistory = getChunkHistory();
    nextHistory.push(newSections);
    setChunkHistory(nextHistory);

    const allSections = nextHistory.flat();
    renderSections(allSections, allSections.length);

    persistFeedbackToDB(allSections);
  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load next section.");
  } finally {
    // ✅ CRITICAL: restore footer buttons after fetch completes
    setIsFetching(false);

    refreshFooter({
      getChunkHistory,
      getIsFetching,
      updateFooterButtons,
      onShowMore: () =>
        fetchNextChunk({
          getCurrentArgs,
          getChunkHistory,
          setChunkHistory,
          getIsFetching,
          setIsFetching,
          showLoading,
          renderSections,
          updateFooterButtons,
          fetchAIFeedback,
          persistFeedbackToDB,
          showAIFeedbackError,
          getLastAttemptId,
          onShowLess,
        }),
      onShowLess,
    });
  }
}

export function refreshFooter({
  getChunkHistory,
  getIsFetching,
  updateFooterButtons,
  onShowMore,
  onShowLess,
}) {
  const currentCount = getChunkHistory().length;

  updateFooterButtons({
    onShowMore,
    onShowLess,
    canShowMore: currentCount < 3,
    canShowLess: true,
    isLoading: getIsFetching(),
  });
}
