// features/streaming/router.js
import { SCENARIOS } from "../convo/scenarios.js";

const DEFAULTS = {
  input: "ptt", // ptt | vad | duplex | text
  transport: "webrtc", // webrtc | websocket
};

function pickScenario(id) {
  const list = Array.isArray(SCENARIOS) ? SCENARIOS : [];
  if (!id) return list[0] || null;
  return list.find((s) => s.id === id) || list[0] || null;
}

export function parseStreamRoute() {
  const qs = new URLSearchParams(window.location.search);

  const scenarioId = (qs.get("scenario") || "").trim();
  const tone = (qs.get("tone") || "").trim();
  const stress = (qs.get("stress") || "").trim();
  const pace = (qs.get("pace") || "").trim();

  const input = (qs.get("input") || DEFAULTS.input).trim();
  const transport = (qs.get("transport") || DEFAULTS.transport).trim();

  const scenario = pickScenario(scenarioId);

  return {
    scenarioId: scenario?.id || null,
    scenario,
    knobs: {
      tone: tone || null,
      stress: stress || null,
      pace: pace || null,
    },
    input,
    transport,
  };
}
