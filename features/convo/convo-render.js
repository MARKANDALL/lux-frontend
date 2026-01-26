// features/convo/convo-render.js

import { highlightHtml, stripMarks } from "./convo-highlight.js";

let state = null;
let msgs = null;
let sugs = null;
let sugsNote = null;
let input = null;
let el = null;
let coach = null;

export function initConvoRender(deps) {
  state = deps.state;
  msgs = deps.msgs;
  sugs = deps.sugs;
  sugsNote = deps.sugsNote;
  input = deps.input;
  el = deps.el;
  coach = deps.coach;
}

// Helpers (for rendering / highlight inputs)
function getWordBank() {
  return (state.nextActivity?.targets?.words || [])
    .map((x) => x?.word || x)
    .filter(Boolean)
    .map((x) => String(x).trim())
    .filter(Boolean);
}

function getFocusIpa() {
  return state.nextActivity?.targets?.phoneme?.ipa || "";
}

// --- Chat rendering ---
export function renderMessages() {
  msgs.innerHTML = "";
  const focusIpa = getFocusIpa();
  const wb = getWordBank();

  for (const m of state.messages) {
    const bubble = el("div", "msg " + (m.role === "user" ? "user" : "assistant"));
    bubble.innerHTML = highlightHtml(m.content, {
      wordBank: wb,
      focusIpa,
      autoBlue: m.role !== "user",
    });
    msgs.append(bubble);
  }
  msgs.scrollTop = msgs.scrollHeight;
}

export function renderSuggestions(list) {
  sugs.innerHTML = "";
  const focusIpa = getFocusIpa();
  const wb = getWordBank();

  (list || []).forEach((t) => {
    const raw = stripMarks(t);
    const b = el("button", "sug");
    b.dataset.raw = raw;
    b.innerHTML = highlightHtml(t, { wordBank: wb, focusIpa, autoBlue: true });
    b.addEventListener("click", () => {
      input.value = raw;
      input.focus();
    });
    sugs.append(b);
  });

  // Tiny, always-light label (not overwhelming)
  if (state.nextActivity && (list || []).length) {
    const t = coach.targetsInline(state.nextActivity);
    sugsNote.textContent = t
      ? `Suggested replies are tuned to: ${t}`
      : "Suggested replies are tuned to your targets.";
  } else {
    sugsNote.textContent = "";
  }

  coach.noteSuggestionsRendered(list);
}
