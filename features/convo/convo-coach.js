// features/convo/convo-coach.js

export function createConvoCoach({ state, coachBar, input, el }) {
  function targetsInline(plan) {
    const ph = plan?.targets?.phoneme?.ipa ? `/${plan.targets.phoneme.ipa}/` : "";
    const words = (plan?.targets?.words || []).map((x) => x.word).filter(Boolean).slice(0, 6);
    const w = words.length ? words.join(", ") : "";
    if (ph && w) return `${ph} · ${w}`;
    return ph || w || "";
  }

  function showCoachCard({ title, body, meta, onDismiss }) {
    const card = el("div", "lux-coachcard");
    const left = el("div", "lux-coachtext");
    left.append(el("strong", "", title), el("div", "", body));
    if (meta) left.append(el("div", "lux-coachmeta", meta));
    const btn = el("button", "btn ghost lux-coachbtn", "Got it");
    btn.addEventListener("click", () => {
      card.remove();
      if (onDismiss) onDismiss();
    });
    card.append(left, btn);
    coachBar.append(card);
  }

  function maybeShowStartTip() {
    if (!state.nextActivity) return;
    if (state.coach.startTipShown) return;
    state.coach.startTipShown = true;
    const t = targetsInline(state.nextActivity);
    showCoachCard({
      title: "Targeted practice loaded",
      body:
        "Tip: read BOTH parts out loud. Lux will try to weave in your focus sound and target words naturally. Then click a suggested reply and record it.",
      meta: t ? `Focus: ${t}` : "",
    });
  }

  function noteSuggestionsRendered(list) {
    if (!state.nextActivity) return;
    if (!(list || []).length) return;
    if (state.coach.replyTipShown) return;

    state.coach.replyTipShown = true;
    const t = targetsInline(state.nextActivity);
    showCoachCard({
      title: "Recommended for best results",
      body:
        "This time, the suggested replies lean toward the sounds and words you need most. Use them when they feel natural.",
      meta: t ? `Targets inside the suggestions: ${t}` : "",
    });
  }

  function wireTypeTip() {
    input.addEventListener("focus", () => {
      if (!state.nextActivity) return;
      if (state.coach.typeTipShown) return;
      state.coach.typeTipShown = true;
      showCoachCard({
        title: "Quick note before typing",
        body:
          "The suggested replies are gently tuned toward your current targets. You can also type your own if that feels more natural.",
      });
    });
  }

  return {
    targetsInline,
    showCoachCard,
    maybeShowStartTip,
    noteSuggestionsRendered,
    wireTypeTip,
  };
}