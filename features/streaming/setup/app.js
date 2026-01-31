// features/streaming/setup/app.js
import { SCENARIOS } from "../../convo/scenarios.js";

const KEY = "lux.stream.setup.v1";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch (_) {}
}

function pickRandomScenarioId() {
  const list = Array.isArray(SCENARIOS) ? SCENARIOS : [];
  if (!list.length) return "";
  const idx = Math.floor(Math.random() * list.length);
  return list[idx]?.id || "";
}

export function mountStreamingSetupApp({ rootId }) {
  const root = document.getElementById(rootId);
  if (!root) return;

  const prefs = loadPrefs() || {};
  const input = prefs.input || "ptt";
  const transport = prefs.transport || "webrtc";
  const starterMode = prefs.starterMode || "random"; // random | pick
  const scenario = prefs.scenario || "";
  const tone = prefs.tone || "";
  const stress = prefs.stress || "";
  const pace = prefs.pace || "";

  const scenarioOpts = (SCENARIOS || []).map(
    (s) => `<option value="${s.id}">${s.title}</option>`
  );

  root.innerHTML = `
    <div class="lss-wrap">
      <div class="lss-header">
        <div>
          <div class="lss-title">Streaming Conversations</div>
          <div class="lss-sub">Pick a couple settings, then jump into real-time practice.</div>
        </div>
        <div class="lss-actions">
          <a class="lss-pill" href="./convo.html" data-lux-ripple>AI Hub</a>
          <a class="lss-pill" href="./index.html" data-lux-ripple>Practice Skills</a>
        </div>
      </div>

      <div class="lss-card">
        <div class="lss-row">
          <label class="lss-lab">Input</label>
          <select id="lssInput" class="lss-sel">
            <option value="ptt">Push-to-talk (Space)</option>
            <option value="vad">Voice activity (VAD)</option>
            <option value="duplex">Duplex</option>
            <option value="text">Text only</option>
          </select>
        </div>

        <div class="lss-row">
          <label class="lss-lab">Transport</label>
          <select id="lssTransport" class="lss-sel">
            <option value="webrtc">WebRTC</option>
            <option value="websocket">WebSocket</option>
          </select>
        </div>

        <div class="lss-row">
          <label class="lss-lab">Starter</label>
          <select id="lssStarterMode" class="lss-sel">
            <option value="random">Random starter topic</option>
            <option value="pick">Pick a starter topic</option>
          </select>
        </div>

        <div class="lss-row" id="lssScenarioRow">
          <label class="lss-lab">Topic</label>
          <select id="lssScenario" class="lss-sel">
            <option value="">(select)</option>
            ${scenarioOpts.join("")}
          </select>
        </div>

        <div class="lss-split"></div>

        <div class="lss-row3">
          <div class="lss-mini">
            <label class="lss-lab">Tone</label>
            <select id="lssTone" class="lss-sel">
              <option value="">(default)</option>
              <option value="friendly">friendly</option>
              <option value="neutral">neutral</option>
              <option value="playful">playful</option>
              <option value="formal">formal</option>
            </select>
          </div>

          <div class="lss-mini">
            <label class="lss-lab">Stress</label>
            <select id="lssStress" class="lss-sel">
              <option value="">(default)</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>

          <div class="lss-mini">
            <label class="lss-lab">Pace</label>
            <select id="lssPace" class="lss-sel">
              <option value="">(default)</option>
              <option value="slow">slow</option>
              <option value="normal">normal</option>
              <option value="fast">fast</option>
            </select>
          </div>
        </div>

        <div class="lss-footer">
          <button id="lssStart" class="lss-start" data-lux-ripple>Start Streaming</button>
        </div>
      </div>
    </div>
  `;

  const elInput = root.querySelector("#lssInput");
  const elTransport = root.querySelector("#lssTransport");
  const elStarterMode = root.querySelector("#lssStarterMode");
  const elScenarioRow = root.querySelector("#lssScenarioRow");
  const elScenario = root.querySelector("#lssScenario");
  const elTone = root.querySelector("#lssTone");
  const elStress = root.querySelector("#lssStress");
  const elPace = root.querySelector("#lssPace");
  const elStart = root.querySelector("#lssStart");

  elInput.value = input;
  elTransport.value = transport;
  elStarterMode.value = starterMode;
  elScenario.value = scenario;
  elTone.value = tone;
  elStress.value = stress;
  elPace.value = pace;

  function syncScenarioVisibility() {
    const show = elStarterMode.value === "pick";
    elScenarioRow.style.display = show ? "" : "none";
  }
  syncScenarioVisibility();

  elStarterMode.addEventListener("change", syncScenarioVisibility);

  elStart.addEventListener("click", () => {
    const prefsNow = {
      input: elInput.value,
      transport: elTransport.value,
      starterMode: elStarterMode.value,
      scenario: elScenario.value,
      tone: elTone.value,
      stress: elStress.value,
      pace: elPace.value,
    };
    savePrefs(prefsNow);

    const qp = new URLSearchParams();
    qp.set("input", prefsNow.input);
    qp.set("transport", prefsNow.transport);

    const scenarioId =
      prefsNow.starterMode === "pick"
        ? (prefsNow.scenario || "")
        : pickRandomScenarioId();

    if (scenarioId) qp.set("scenario", scenarioId);
    if (prefsNow.tone) qp.set("tone", prefsNow.tone);
    if (prefsNow.stress) qp.set("stress", prefsNow.stress);
    if (prefsNow.pace) qp.set("pace", prefsNow.pace);

    window.location.href = `./stream.html?${qp.toString()}`;
  });
}
