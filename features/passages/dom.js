// features/passages/dom.js
// Pure DOM manipulation for passage navigation and inputs.
// CLEANED: Balloon logic moved to features/balloon/

import { qs, setText, setVisible } from "../../app-core/lux-utils.js";

const ui = {
  get select() { return qs("#passageSelect"); },
  get input() { return qs("#referenceText"); },
  get suggested() { return qs("#suggestedSentence"); },
  get progress() { return qs("#partProgress"); },
  get label() { return qs("#passageLabel"); },
  get nextBtn() { return qs("#nextPartBtn"); },
  get nextMsg() { return qs("#nextPartMsg"); },
  get summaryBtn() { return qs("#showSummaryBtn"); },
  get tip() { return qs("#partsInfoTip"); },
  get tipText() { return qs("#partsInfoTip .tooltiptext"); },
  get pretty() { return qs("#prettyResult"); },
  get status() { return qs("#status"); },
  get aiBox() { return qs("#aiFeedback"); },
  get showMore() { return qs("#showMoreBtn"); },
};

/* --- Read --- */

export function getSelectValue() {
  return ui.select?.value || "";
}

export function getInputValue() {
  return ui.input?.value || "";
}

export function isSelectCustom() {
  const val = ui.select?.value || "";
  const label = ui.select?.selectedOptions?.[0]?.textContent || "";
  return val === "custom" || /write.*own/i.test(label);
}

/* --- Write --- */

export function ensureCustomOptionInDOM() {
  const sel = ui.select;
  if (!sel) return;
  
  if (!sel.querySelector('option[value="custom"]')) {
    const opt = document.createElement("option");
    opt.value = "custom";
    opt.textContent = "✍️ Write your own…";
    sel.insertBefore(opt, sel.firstChild);
  }
}

export function forceSelectCustom() {
  if (ui.select) ui.select.value = "custom";
}

export function renderInfoTip({ visible, textHTML }) {
  const t = ui.tip;
  if (!t) return;
  
  if (!visible) {
    t.classList.add("hidden");
  } else {
    t.classList.remove("hidden");
    if (ui.tipText) ui.tipText.innerHTML = textHTML;
  }
}

export function renderPartState({ 
  text, 
  progressText, 
  labelText, 
  showLabel, 
  preserveInput 
}) {
const safeText = (text == null) ? "" : text;
  if (ui.suggested) ui.suggested.textContent = safeText; 
  if (ui.input && !preserveInput) ui.input.value = safeText;
  if (ui.progress) ui.progress.textContent = progressText;
  
  if (ui.label) {
    setVisible(ui.label, showLabel);
    setText(ui.label, labelText);
  }
}

export function updateNavVisibility({ showNext, enableNext, nextMsgText, nextMsgColor, showSummary, customMode }) {
  if (ui.nextBtn) {
    setVisible(ui.nextBtn, showNext);
    ui.nextBtn.disabled = !enableNext;

    ui.nextBtn.classList.toggle("lux-ghost-custom", !!customMode);

    if (customMode) {
      ui.nextBtn.textContent = "Add Another Section";
    } else {
      ui.nextBtn.textContent = "Next Part";
    }
  }

  if (ui.nextMsg) {
    setText(ui.nextMsg, nextMsgText);
    setVisible(ui.nextMsg, !!nextMsgText);
    if (nextMsgColor) ui.nextMsg.style.color = nextMsgColor;
    if (nextMsgText) {
        ui.nextMsg.style.display = "inline-block";
        ui.nextMsg.style.marginLeft = "10px";
    }
  }

  if (ui.summaryBtn) {
    if (showSummary !== undefined) {
        setVisible(ui.summaryBtn, showSummary);
        ui.summaryBtn.disabled = !showSummary;
        
        if (customMode) {
            ui.summaryBtn.textContent = "Finish & View Summary";
        } else {
            ui.summaryBtn.textContent = "Show Summary";
        }
    }
  }
}

export function clearResultsUI(opts = {}) {
  const preservePretty = !!opts?.preservePretty;

  // Keep the Word & Phoneme bar always visible (closed by default).
  if (ui.pretty && !preservePretty)
    ui.pretty.innerHTML = `
      <details class="lux-results-accordion" id="luxWpAccordion">
        <summary class="lux-results-accordion-handle" title="Word &amp; Phoneme chart">
          <span class="lux-drawer-action lux-drawer-action--open" aria-hidden="true">Open</span>
          <span class="lux-drawer-action lux-drawer-action--close" aria-hidden="true">Close</span>
          <span class="lux-progress-drawer-title">Word &amp; Phoneme chart</span>
        </summary>
        <div class="results-flex">
          <div style="padding: 14px 16px; color:#64748b;">Record to see the Word &amp; Phoneme chart.</div>
        </div>
      </details>
    `;

  if (ui.status) ui.status.textContent = "Not recording";

  // AI Coach must always be openable. Don’t hide the box; show a placeholder instead.
  const coachDrawer = document.getElementById("aiCoachDrawer");
  if (coachDrawer) coachDrawer.open = false;

  const aiSection = document.getElementById("aiFeedbackSection");
  if (aiSection) aiSection.style.display = "";

  if (ui.aiBox) {
    ui.aiBox.style.display = "";
    ui.aiBox.innerHTML = `<div style="color:#64748b; padding: 14px 16px;">Open AI Coach anytime. Record to get feedback.</div>`;
  }

  setVisible(ui.showMore, false);
}

/* --- Events --- */

export function wireSelectEvents({ onChange, onClick }) {
  if (ui.select) {
    ui.select.addEventListener("change", (e) => onChange(e.target.value));
    ui.select.addEventListener("click", onClick);
  }
}

export function wireInputEvents({ onInput }) {
  if (ui.input) {
    ui.input.addEventListener("input", (e) => onInput(e.target.value));
  }
}

export function wireNextBtnEvent(onNext) {
  if (ui.nextBtn) {
    ui.nextBtn.addEventListener("click", onNext);
  }
}
