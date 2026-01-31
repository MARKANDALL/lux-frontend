// features/streaming/router.js
import { SCENARIOS } from "../convo/scenarios.js";

const DEFAULTS = {
  input: "ptt", // ptt | vad | duplex | text
  transport: "webrtc", // webrtc | websocket
  model: "gpt-realtime-mini",
  voice: "marin",
  speed: 0.85,
  maxOutputTokens: 250,
};

function clampNumber(v, fallback, min, max) {
  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function clampInt(v, fallback, min, max) {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

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

  const model = (qs.get("model") || DEFAULTS.model).trim() || DEFAULTS.model;
  const voice = (qs.get("voice") || DEFAULTS.voice).trim() || DEFAULTS.voice;
  const speed = clampNumber(qs.get("speed"), DEFAULTS.speed, 0.25, 1.5);
  const maxOutputTokens = clampInt(
    qs.get("max_output_tokens") ?? qs.get("maxOutputTokens"),
    DEFAULTS.maxOutputTokens,
    1,
    4096
  );

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
    model,
    voice,
    speed,
    maxOutputTokens,
  };
}
