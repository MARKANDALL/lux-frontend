// app-core/passages.js
import { passages } from "../src/data/index.js";
import {
  $,
  $$,
  setCustom,
  setPassageKey,
  setPartIdx,
  setParts,
  currentParts,
  currentPartIdx,
  currentPassageKey,
  isCustom,
} from "./state.js";

/* ---------------- helpers ---------------- */

export function ensureCustomOption() {
  const passageSelect = $("#passageSelect");
  if (!passageSelect) return;
  if (!passageSelect.querySelector('option[value="custom"]')) {
    const opt = document.createElement("option");
    opt.value = "custom";
    opt.textContent = "✍️ Write your own…";
    passageSelect.insertBefore(opt, passageSelect.firstChild);
  }
}

export function isCustomMode() {
  const passageSelect = $("#passageSelect");
  if (typeof isCustom === "boolean") return isCustom;
  const val = passageSelect?.value || "";
  const label = passageSelect?.selectedOptions?.[0]?.textContent || "";
  return val === "custom" || /write.*own/i.test(label);
}

export function updatePartsInfoTip() {
  const refInput = $("#referenceText");
  const passageSel = $("#passageSelect");
  const partsTip = $("#partsInfoTip");
  const partsText = partsTip?.querySelector(".tooltiptext");
  if (!partsTip) return;

  const TIP_CURATED = `These built-in texts were designed to cover most English sounds. 
Practicing them gives a balanced baseline and helps reveal strengths & weaknesses.`;
  const TIP_CUSTOM = `Type anything you want to practice—speeches, interviews, tricky words, 
or everyday phrases. We’ll score words & phonemes and add prosody feedback (stress, pauses, rhythm). 
Tip: shorter sentences (≈10–15 s) give the clearest results.`;

  const hasText = !!refInput?.value?.trim();
  const custom = isCustomMode();
  partsTip.classList.toggle("hidden", !(hasText || passageSel?.value));
  if (partsText) partsText.innerHTML = custom ? TIP_CUSTOM : TIP_CURATED;
}

/**
 * Multi-part navigation + summary button controller.
 *
 * Rules:
 * - For 0 or 1 part: hide Next + Summary and the helper message.
 * - For multi-part:
 *   - On each part we REQUIRE a fresh recording before allowing "Next".
 *   - "Next Part" is visible but disabled until a recording completes.
 *   - "Show Summary" is ALWAYS hidden here; it is only revealed by
 *     markPartCompleted() *after* the final part has been recorded.
 */
export function togglePartNav(enabled) {
  const nextBtn = $("#nextPartBtn");
  const nextMsg = $("#nextPartMsg");
  const summaryBtn = $("#showSummaryBtn");
  const tip = $("#partsInfoTip");

  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  const isMulti = enabled && total > 1;

  // Summary is controlled exclusively by markPartCompleted.
  if (summaryBtn) {
    summaryBtn.style.display = "none";
    summaryBtn.disabled = false;
  }

  tip?.classList.toggle("hidden", !isMulti);

  if (!isMulti) {
    if (nextBtn) {
      nextBtn.style.display = "none";
      nextBtn.disabled = true;
    }
    if (nextMsg) {
      nextMsg.textContent = "";
      nextMsg.style.display = "none";
    }
    return;
  }

  const atLast = currentPartIdx >= total - 1;

  if (nextBtn) {
    // No "Next" on the final part.
    nextBtn.style.display = atLast ? "none" : "";
    // Landing on a part always requires a new recording before moving on.
    nextBtn.disabled = !atLast; // value is irrelevant when hidden
  }

  if (nextMsg) {
    if (!atLast) {
      nextMsg.textContent = "Record something before continuing.";
      nextMsg.style.display = "inline";
    } else {
      nextMsg.textContent = "";
      nextMsg.style.display = "none";
    }
  }
}

/* ---------------- core UI ---------------- */

export function showCurrentPart({ preserveExistingInput = false } = {}) {
  const suggested = $("#suggestedSentence");
  const input = $("#referenceText");
  const progress = $("#partProgress");
  const label = $("#passageLabel");
  if (!suggested || !input || !progress) return;

  if (isCustom) {
    const txt = currentParts?.[0] ?? "";
    if (!preserveExistingInput) input.value = txt;
    suggested.textContent = "";
    progress.textContent = "Part 1 of 1";
    if (label) {
      label.style.display = "";
      label.textContent = "Your text:";
    }
    togglePartNav(false);
  } else {
    const text = currentParts[currentPartIdx];
    suggested.textContent = text;
    input.value = text;
    progress.textContent = `Part ${currentPartIdx + 1} of ${
      currentParts.length
    }`;
    if (label) {
      const name = passages[currentPassageKey]?.name || "Passage";
      label.style.display = currentPartIdx === 0 ? "" : "none";
      label.textContent = `${name}:`;
    }
    togglePartNav(currentParts.length > 1);
  }
}

export function setPassage(key, { clearInputForCustom = false } = {}) {
  const refInput = $("#referenceText");
  const pretty = $("#prettyResult");
  const status = $("#status");

  setCustom(key === "custom");
  setPassageKey(key);
  setPartIdx(0);

  if (isCustom) {
    const nextText = clearInputForCustom ? "" : refInput?.value ?? "";
    setParts([nextText]);
    showCurrentPart({ preserveExistingInput: !clearInputForCustom });
  } else {
    const p = passages[key]?.parts || [];
    setParts(p);
    showCurrentPart();
  }

  if (pretty) pretty.innerHTML = "";
  if (status) status.textContent = "Not recording";

  const aiBox = $("#aiFeedback");
  if (aiBox) {
    aiBox.style.display = "none";
    aiBox.innerHTML = "";
  }
  const showMore = $("#showMoreBtn");
  if (showMore) showMore.style.display = "none";
}

export function wirePassageSelect() {
  const passageSelect = $("#passageSelect");
  const refInput = $("#referenceText");

  passageSelect?.addEventListener("change", function () {
    setPassage(this.value, { clearInputForCustom: this.value === "custom" });
    updatePartsInfoTip();
  });

  passageSelect?.addEventListener("click", () => {
    const suggestionEmpty = !$("#suggestedSentence")?.textContent?.trim();
    if (suggestionEmpty && !isCustom) showCurrentPart();
  });

  refInput?.addEventListener("input", () => {
    if (!isCustom) {
      if (passageSelect) passageSelect.value = "custom";
      setPassage("custom", { clearInputForCustom: false });
    }
    if (isCustom) {
      setParts([refInput.value]);
      setPartIdx(0);
      const progress = $("#partProgress");
      if (progress) progress.textContent = "Part 1 of 1";
    }
    updatePartsInfoTip();
  });
}

export function goToNextPart() {
  if (isCustom) return;
  if (currentPartIdx < currentParts.length - 1) {
    setPartIdx(currentPartIdx + 1);
    showCurrentPart();
    const pretty = $("#prettyResult");
    const status = $("#status");
    if (pretty) pretty.innerHTML = "";
    if (status) status.textContent = "Not recording";
  }
}

export function wireNextBtn() {
  $("#nextPartBtn")?.addEventListener("click", goToNextPart);

  // Ensure Next / Summary / tip visibility is correct on boot.
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  togglePartNav(total > 1);
  updatePartsInfoTip();
}

/**
 * Called by the recorder pipeline after a successful Azure assessment.
 *
 * Responsibilities:
 * - On non-final parts: enable "Next Part" and hide the helper text.
 * - On the final part: hide "Next Part" and reveal "Show Summary".
 */
export function markPartCompleted() {
  if (isCustom) return;

  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  if (total <= 1) return;

  const atLast = currentPartIdx >= total - 1;

  const nextBtn = $("#nextPartBtn");
  const nextMsg = $("#nextPartMsg");
  const summaryBtn = $("#showSummaryBtn");

  if (!atLast) {
    // Middle parts: unlock Next once we've recorded.
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.style.display = "";
    }
    if (nextMsg) {
      nextMsg.textContent = "";
      nextMsg.style.display = "none";
    }
    if (summaryBtn) {
      summaryBtn.style.display = "none";
    }
  } else {
    // Final part completed: hide Next, show Summary.
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.style.display = "none";
    }
    if (nextMsg) {
      nextMsg.textContent = "";
      nextMsg.style.display = "none";
    }
    if (summaryBtn) {
      summaryBtn.style.display = "";
      summaryBtn.disabled = false;
    }
  }
}
