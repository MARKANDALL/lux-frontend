// features/life/mission-bridge.js
import { saveNextActivityPlan } from "../next-activity/next-activity.js";

export function launchLifeMissionToConvo({ run, event, choice }) {
  const ts = Date.now();
  const turnNo = (run?.turn || 0) + 1;

  const sceneTitle = `Life Journey — ${event.title}`;
  const sceneDesc = [
    `You are in a Life Journey run. Turn ${turnNo} of ${run.totalTurns}.`,
    `Setting: ${event.setting}.`,
    `You are speaking to: ${event.npcRole}.`,
    `Situation: ${event.blurb}`,
    `Your choice: ${choice.label}`,
    "",
    "Conversation goals:",
    `- ${event.goal}`,
    "- Keep the learner reply to 1–2 sentences.",
    "- Ask short follow-up questions to continue the scene naturally.",
  ].join("\n");

  const plan = {
    plan_version: "v1",
    kind: "ai_conversation",
    created_ts: ts,
    source: "life_journey",
    confidence: null,

    // Use the Life event word bank as the “targets.words”
    targets: {
      phoneme: null,
      words: (event.wordBank || []).map((w) => ({ word: w })),
    },

    // ✅ Custom scene so convo uses the right title/desc (we’ll wire this in convo-flow.js)
    scene: {
      id: `life:${run.runId}:${turnNo}:${event.id}`,
      title: sceneTitle,
      desc: sceneDesc,
    },
  };

  saveNextActivityPlan(plan);

  // Convo already auto-starts if nextActivity exists; #chat ensures we land in chat mode.
  window.location.href = "./convo.html#chat";
}
