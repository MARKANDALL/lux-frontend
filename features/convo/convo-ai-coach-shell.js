// features/convo/convo-ai-coach-shell.js

import { mountAICoachAlwaysOn } from "../../ui/ui-ai-ai-logic.js";

export function renderAICoachShell(state) {
  // Ensure the AI Coach shell exists as soon as we enter chat mode.
  if (state.mode === "chat") {
    mountAICoachAlwaysOn(() => {
      const t = state.turns?.length ? state.turns[state.turns.length - 1] : null;
      return t
        ? { azureResult: t.azureResult, referenceText: t.userText, firstLang: "universal" }
        : null;
    });
  }
}
