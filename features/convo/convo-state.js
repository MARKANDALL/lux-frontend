// features/convo/convo-state.js

import { SCENARIOS } from "./scenarios.js";
import { consumeNextActivityPlan } from "../next-activity/next-activity.js";
import { newSessionId } from "./convo-shared.js";
import { loadKnobs } from "./convo-knobs.js";

const QUICK_PRACTICE_ID = "quick-practice";

function getQuickPracticeIdx() {
  const idx = SCENARIOS.findIndex((s) => s?.id === QUICK_PRACTICE_ID);
  return idx >= 0 ? idx : 0;
}

export function createConvoState() {
  const state = {
    sessionId: newSessionId(),
    scenarioIdx: 0,
    mode: "intro", // intro | picker | chat
    knobsOpen: false,
    knobs: loadKnobs(),
    roleIdx: 0,

    messages: [], // {role:"user"|"assistant", content:string}
    turns: [], // {turn, userText, azureResult, attemptId?}

    isRecording: false,
    stream: null,
    recorder: null,
    chunks: [],

    busy: false,

    // Next practice (optional)
    nextActivity: null,
    coach: { startTipShown: false, replyTipShown: false, typeTipShown: false },
  };

const next = consumeNextActivityPlan();
  if (next && next.kind === "ai_conversation") {
    state.nextActivity = next;
    if (next.launch_mode !== "choose") {
      state.scenarioIdx = getQuickPracticeIdx();
      state.roleIdx = 0;
    }
  }

  return state;
}

export function tryConsumeStoredNextActivityPlan(state) {
  // If a Next Practice plan was stored, consume it once and keep in memory for this session.
  try {
    const plan = consumeNextActivityPlan();
    if (!plan) return;

    state.nextActivity = plan;

    if (plan.kind === "ai_conversation" && plan.launch_mode !== "choose") {
      state.scenarioIdx = getQuickPracticeIdx();
      state.roleIdx = 0;
    }
  } catch (err) { globalThis.warnSwallow("features/convo/convo-state.js", err, "important"); }
}