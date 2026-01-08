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
        "Tip: read BOTH parts out loud. The assistant lines are packed with your focus sound/words. Then click a suggested reply and record it.",
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
        "This time, please use the suggested replies (at least for a few turns). They’re designed to include the sounds/words you need most.",
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
          "The suggested replies are packed with the exact sounds/words Lux thinks you need most right now. You can still type your own, but you might accidentally skip the targeted practice if you do.",
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
