// features/life/app.js
import { loadLifeRun, saveLifeRun, clearLifeRun } from "./storage.js";
import { LIFE_EVENTS } from "./deck.js";
import { launchLifeMissionToConvo } from "./mission-bridge.js";

function randSeed32() {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] >>> 0;
  } catch (_) {
    return (Date.now() >>> 0) ^ ((Math.random() * 0xffffffff) >>> 0);
  }
}

// Mulberry32 RNG (fast, deterministic)
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickEvent({ rng, seen }) {
  const deck = LIFE_EVENTS || [];
  const candidates = deck.filter((e) => !seen.has(e.id));
  const pool = candidates.length ? candidates : deck;
  if (!pool.length) return null;
  const idx = Math.floor(rng() * pool.length);
  return pool[idx] || null;
}

export function mountLifeApp({ rootId }) {
  const root = document.getElementById(rootId);
  if (!root) return;

  let run = loadLifeRun();

  function render() {
    root.innerHTML = "";
    if (!run) return renderSetup();
    return renderRun();
  }

  function renderSetup() {
    root.innerHTML = `
      <div class="ll-wrap">
        <div class="ll-header">
          <div>
            <div class="ll-title">Life Journey</div>
            <div class="ll-sub">Spin, choose, and launch mini “missions” into AI Conversations.</div>
          </div>
          <div class="ll-actions">
            <a class="ll-pill" href="./convo.html" data-lux-ripple>AI Hub</a>
            <a class="ll-pill" href="./index.html" data-lux-ripple>Practice Skills</a>
          </div>
        </div>

        <div class="ll-card">
          <div class="ll-row">
            <label class="ll-lab">Name</label>
            <input id="llName" class="ll-in" placeholder="Your name (optional)" />
          </div>

          <div class="ll-row">
            <label class="ll-lab">Run length</label>
            <select id="llLen" class="ll-sel">
              <option value="6">Short (6 turns)</option>
              <option value="10" selected>Medium (10 turns)</option>
              <option value="16">Long (16 turns)</option>
            </select>
          </div>

          <div class="ll-footer">
            <button id="llStart" class="ll-start" data-lux-ripple>Start a new run</button>
          </div>
        </div>
      </div>
    `;

    const elName = root.querySelector("#llName");
    const elLen = root.querySelector("#llLen");
    const elStart = root.querySelector("#llStart");

    elStart.addEventListener("click", () => {
      const totalTurns = Math.max(3, Number(elLen.value || 10));
      run = {
        v: 1,
        runId: String(Date.now()),
        created_ts: Date.now(),
        seed: randSeed32(),
        totalTurns,
        turn: 0,
        avatar: { name: (elName.value || "").trim() },
        seen: [],
        pending: null, // { eventId, choiceId, spin }
        log: [],
      };
      saveLifeRun(run);
      render();
    });
  }

  function renderRun() {
    const rng = mulberry32(run.seed);
    const seen = new Set(run.seen || []);

    // Advance RNG based on log length so rerenders don’t reshuffle history
    for (let i = 0; i < (run.log?.length || 0); i++) rng();

    const done = run.turn >= run.totalTurns;

    root.innerHTML = `
      <div class="ll-wrap">
        <div class="ll-header">
          <div>
            <div class="ll-title">Life Journey</div>
            <div class="ll-sub">
              Turn <b>${Math.min(run.turn + 1, run.totalTurns)}</b> of <b>${run.totalTurns}</b>
              ${run.avatar?.name ? `• ${run.avatar.name}` : ""}
            </div>
          </div>
          <div class="ll-actions">
            <a class="ll-pill" href="./convo.html" data-lux-ripple>AI Hub</a>
            <button id="llReset" class="ll-pill ll-pill-btn" data-lux-ripple>Reset</button>
          </div>
        </div>

        <div class="ll-card" id="llCard">
          ${done ? `
            <div class="ll-big">Run complete 🎉</div>
            <div class="ll-note">Reset to start a new journey.</div>
          ` : `
            <div class="ll-big">Spin → Event → Choice → Mission</div>
            <div class="ll-note">Each turn creates a scene you can practice immediately.</div>

            <div class="ll-footer">
              <button id="llSpin" class="ll-start" data-lux-ripple>Spin</button>
            </div>
          `}
        </div>

        <div class="ll-history">
          <div class="ll-historyTitle">History</div>
          <div class="ll-historyList">
            ${(run.log || []).slice().reverse().map((x) => {
              return `<div class="ll-hitem">
                <div class="ll-hmain">Turn ${x.turn}: ${x.eventTitle}</div>
                <div class="ll-hsub">Choice: ${x.choiceLabel} • Spin: ${x.spin}</div>
              </div>`;
            }).join("") || `<div class="ll-hempty">No turns yet.</div>`}
          </div>
        </div>
      </div>
    `;

    root.querySelector("#llReset")?.addEventListener("click", () => {
      clearLifeRun();
      run = null;
      render();
    });

    const elSpin = root.querySelector("#llSpin");
    if (!elSpin) return;

    elSpin.addEventListener("click", () => {
      // Spin
      const spin = 1 + Math.floor(rng() * 10);

      // Draw an unseen event if possible
      const ev = pickEvent({ rng, seen });
      if (!ev) return;

      // Render event + choices inline
      const card = root.querySelector("#llCard");
      card.innerHTML = `
        <div class="ll-eventTitle">${ev.title}</div>
        <div class="ll-note">${ev.blurb}</div>

        <div class="ll-meta">
          <div><b>Setting:</b> ${ev.setting}</div>
          <div><b>NPC:</b> ${ev.npcRole}</div>
          <div><b>Spin:</b> ${spin}</div>
        </div>

        <div class="ll-choices">
          ${(ev.choices || []).map((c) =>
            `<button class="ll-choice" data-choice="${c.id}" data-lux-ripple>${c.label}</button>`
          ).join("")}
        </div>
      `;

      card.querySelectorAll(".ll-choice").forEach((btn) => {
        btn.addEventListener("click", () => {
          const choiceId = btn.dataset.choice;
          const choice = (ev.choices || []).find((c) => c.id === choiceId);
          if (!choice) return;

          // Mark seen + log turn
          seen.add(ev.id);
          run.seen = Array.from(seen);
          run.pending = { eventId: ev.id, choiceId, spin };

          run.log = run.log || [];
          run.log.push({
            ts: Date.now(),
            turn: run.turn + 1,
            spin,
            eventId: ev.id,
            eventTitle: ev.title,
            choiceId,
            choiceLabel: choice.label,
          });

          saveLifeRun(run);

          // Mission CTA
          card.innerHTML = `
            <div class="ll-eventTitle">Mission ready: ${ev.title}</div>
            <div class="ll-note"><b>Your choice:</b> ${choice.label}</div>

            <div class="ll-wb">
              <div class="ll-wbTitle">Word bank</div>
              <div class="ll-wbRow">${(ev.wordBank || []).map((w) => `<span class="ll-chip">${w}</span>`).join("")}</div>
            </div>

            <div class="ll-footer ll-footer2">
              <button id="llMission" class="ll-start" data-lux-ripple>Start Mission (AI Conversation)</button>
              <button id="llNextTurn" class="ll-pill ll-pill-btn" data-lux-ripple>Continue</button>
            </div>
          `;

          card.querySelector("#llMission").addEventListener("click", () => {
            launchLifeMissionToConvo({ run, event: ev, choice });
          });

          card.querySelector("#llNextTurn").addEventListener("click", () => {
            run.turn += 1;
            run.pending = null;
            saveLifeRun(run);
            render();
          });
        });
      });
    });
  }

  render();
}
