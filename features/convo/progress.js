// features/convo/progress.js
import { fetchHistory, ensureUID } from "../../api/index.js";
import { computeRollups } from "../progress/rollups.js";
import { renderMiniProgress } from "../progress/render.js";

export async function initConvoProgress() {
  const host = document.getElementById("convoProgress");
  if (!host) return;

  host.innerHTML = `<div style="color:#64748b; padding: 10px 0;">Loading AI Conversation progress…</div>`;

  let attempts = [];
  try {
    const uid = ensureUID();
    attempts = await fetchHistory(uid);
  } catch (_) {}

  const convoAttempts = (attempts || []).filter((a) => {
    const pk = a?.passage_key || a?.passageKey || "";
    return String(pk).startsWith("convo:");
  });

  const model = computeRollups(convoAttempts, { windowDays: 30 });
  renderMiniProgress(host, model, { title: "AI Conversations Progress" });
}
