// features/convo/convo-persistence.js

import { setLastAttemptId } from "../../app-core/runtime.js";

export async function persistConvoAttempt({
  saveAttempt,
  uid,
  s,
  state,
  userText,
  azureResult,
}) {
  // save attempt (always)
  try {
    const saved = await saveAttempt({
      uid: uid(),
      passageKey: `convo:${s.id}`,
      partIndex: state.turns.length,
      text: userText,
      azureResult,
      sessionId: state.sessionId,
      localTime: new Date().toISOString(),
    });

    // Keep AI Coach wired to the latest convo attempt (Practice Skills parity)
    setLastAttemptId(saved?.id || null);

    state.turns.push({ turn: state.turns.length, userText, azureResult, attemptId: saved?.id });
  } catch (e) {
    console.error("[Convo] saveAttempt failed", e);
    state.turns.push({ turn: state.turns.length, userText, azureResult, attemptId: null });
  }
}
