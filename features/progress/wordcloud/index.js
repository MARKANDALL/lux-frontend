// features/progress/wordcloud/index.js
import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";
import { computeRollups } from "../rollups.js";
import { renderWordCloudCanvas } from "./render-canvas.js";
import { ensureWordCloudLibs } from "./libs.js";

import { createCloudActionSheet } from "./action-sheet.js";

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../../next-activity/next-activity.js";

import { openDetailsModal } from "../attempt-detail-modal.js";
import { pickTS, pickAzure, pickSummary, pickPassageKey } from "../attempt-pickers.js";
import { titleFromPassageKey } from "../render/format.js";

const ROOT_ID = "wordcloud-root";

// Reasonable refresh interval (only while on this page)
const AUTO_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
const TOP_N = 20;

const THEME_KEY = "lux.cloud.theme.v1";

export async function initWordCloudPage() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  // ✅ Header + toggle pills (Words / Phonemes)
  root.innerHTML = `
    <section class="lux-wc-shell" id="luxWcShell">
      <div class="lux-wc-head">
        <div>
          <div class="lux-wc-title">☁️ Cloud Visuals</div>
          <div class="lux-wc-sub" id="luxWcSub">
            Size = frequency · Color = difficulty (Lux scoring)
          </div>
        </div>

        <div class="lux-wc-actions">
          <div class="lux-wc-toggle" role="tablist" aria-label="Cloud mode">
            <button class="lux-wc-pill is-active" data-mode="words">Words</button>
            <button class="lux-wc-pill" data-mode="phonemes">Phonemes</button>
          </div>

          <button class="lux-pbtn lux-pbtn--ghost" id="luxWcThemeToggle" title="Toggle theme">🌙</button>
          <button class="lux-pbtn" id="luxWcRefresh">Refresh</button>
          <button class="lux-pbtn lux-pbtn--ghost" id="luxWcBack">← Back</button>
        </div>
      </div>

      <div class="lux-wc-body">
        <div class="lux-wc-canvasWrap">
          <canvas id="luxWcCanvas" class="lux-wc-canvas"></canvas>
        </div>

        <div class="lux-wc-legend">
          <span><span class="lux-wc-dot" style="background:#2563eb;"></span>80+ (Good)</span>
          <span><span class="lux-wc-dot" style="background:#d97706;"></span>60–79 (Warn)</span>
          <span><span class="lux-wc-dot" style="background:#dc2626;"></span>&lt;60 (Needs work)</span>
        </div>

        <div id="luxWcMeta" style="margin-top:10px; color:#94a3b8; font-weight:900;"></div>
      </div>
    </section>
  `;

  const shell = root.querySelector("#luxWcShell");
  const canvas = root.querySelector("#luxWcCanvas");
  const meta = root.querySelector("#luxWcMeta");

  const btnTheme = root.querySelector("#luxWcThemeToggle");
  const btnRefresh = root.querySelector("#luxWcRefresh");
  const btnBack = root.querySelector("#luxWcBack");
  const sub = root.querySelector("#luxWcSub");

  // ✅ Toggle state
  let _mode = "words"; // "words" | "phonemes"

  // Cached data so click-actions are instant
  let _attempts = [];
  let _model = null;
  let _items = [];

  // ✅ Action Sheet (Phase A)
  const sheet = createCloudActionSheet({
    onGenerate: (state) => {
      // state.kind: "word" | "phoneme"
      const plan = buildCloudPlan(_model, state);
      if (!plan) return;
      saveNextActivityPlan(plan);
      window.location.assign("./convo.html#chat");
    },
    onOpenAttempt: (attempt) => {
      if (!attempt) return;
      openDetailsModal(attempt, attemptOverallScore(attempt), attemptDateStr(attempt), {
        sid: "",
        list: [attempt],
        session: null,
      });
    },
  });

  // Theme
  let _theme = (localStorage.getItem(THEME_KEY) || "light").toLowerCase();
  if (_theme !== "night") _theme = "light";

  function applyTheme() {
    const isNight = _theme === "night";
    shell.classList.toggle("lux-wc--night", isNight);
    btnTheme.textContent = isNight ? "☀️" : "🌙";
    btnTheme.title = isNight ? "Switch to light theme" : "Switch to night theme";
    try {
      localStorage.setItem(THEME_KEY, _theme);
    } catch (_) {}
  }
  applyTheme();

  btnTheme?.addEventListener("click", () => {
    _theme = _theme === "night" ? "light" : "night";
    applyTheme();
  });

  btnBack?.addEventListener("click", () => {
    window.location.assign("./progress.html");
  });

  function setModeStory() {
    if (!sub) return;
    sub.textContent =
      _mode === "phonemes"
        ? "Sounds that show up often + cause trouble (size = frequency, color = Lux difficulty)"
        : "Words you use often + struggle with most (size = frequency, color = Lux difficulty)";
  }

  async function loadAndDraw() {
    meta.textContent = "Loading…";

    // ✅ Lazy-load D3 + cloud layout ONLY on this page
    const ok = await ensureWordCloudLibs();
    if (!ok) {
      meta.textContent =
        "Word Cloud libraries not found. Add /public/vendor/d3.v7.min.js + /public/vendor/d3.layout.cloud.js";
      return;
    }

    const uid = ensureUID();
    _attempts = await fetchHistory(uid);

    // ✅ Use existing rollups model (same data + same scoring)
    _model = computeRollups(_attempts);

    // ✅ Pick items based on current mode
    _items =
      _mode === "phonemes"
        ? (_model?.trouble?.phonemesAll || []).slice(0, TOP_N)
        : (_model?.trouble?.wordsAll || []).slice(0, TOP_N);

    if (!_items.length) {
      meta.textContent =
        _mode === "phonemes"
          ? "Not enough phoneme data yet — do a little more practice first."
          : "Not enough word data yet — do a little more practice first.";
      renderWordCloudCanvas(canvas, []); // clears
      return;
    }

    renderWordCloudCanvas(canvas, _items, {
      onSelect: (hit) => {
        const metaObj = hit?.meta || {};
        const isPh = _mode === "phonemes" || metaObj.ipa != null;

        const kind = isPh ? "phoneme" : "word";
        const id = isPh ? String(metaObj.ipa || hit.text || "").trim() : String(metaObj.word || hit.text || "").trim();

        const title = kind === "phoneme" ? `/${id}/` : id;

        const recents =
          kind === "word"
            ? findRecentAttemptsForWord(_attempts, id, 6)
            : findRecentAttemptsForPhoneme(_attempts, id, 6);

        sheet.open({
          kind,
          id,
          title,
          avg: Number(metaObj.avg ?? hit.avg ?? 0) || 0,
          count: Number(metaObj.count ?? hit.count ?? 0) || 0,
          days: metaObj.days ?? null,
          priority: metaObj.priority ?? null,
          examples: Array.isArray(metaObj.examples) ? metaObj.examples : [],
          recents,
        });
      },
    });

    const label = _mode === "phonemes" ? "Phonemes" : "Words";
    meta.textContent = `Updated ${new Date().toLocaleString()} · ${label} · Showing top ${_items.length}`;
  }

  btnRefresh?.addEventListener("click", loadAndDraw);

  // ✅ Wire pills
  const pills = Array.from(root.querySelectorAll(".lux-wc-pill"));

  function setMode(next) {
    _mode = next;
    pills.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === next));
    setModeStory();
    loadAndDraw();
  }

  pills.forEach((b) => {
    b.addEventListener("click", () => setMode(b.dataset.mode));
  });

  // Helpers for opening Attempt Details
  function attemptOverallScore(a) {
    const sum = pickSummary(a) || {};
    if (sum.pron != null) return Number(sum.pron) || 0;

    const az = pickAzure(a);
    const v = az?.NBest?.[0]?.PronScore;
    return Number(v) || 0;
  }

  function attemptDateStr(a) {
    const ts = pickTS(a);
    const d = new Date(ts || Date.now());
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function attemptWhen(a) {
    const ts = pickTS(a);
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString();
  }

  function attemptTitle(a) {
    const pk = pickPassageKey(a);
    return titleFromPassageKey(pk);
  }

  // Recent matchers
  function findRecentAttemptsForWord(attempts, word, limit = 6) {
    const needle = String(word || "").trim().toLowerCase();
    if (!needle) return [];

    const out = [];
    const list = Array.isArray(attempts) ? attempts.slice() : [];

    // newest first
    list.sort((a, b) => +new Date(pickTS(b) || 0) - +new Date(pickTS(a) || 0));

    for (const a of list) {
      if (out.length >= limit) break;

      const az = pickAzure(a);
      const W = az?.NBest?.[0]?.Words || [];
      let found = false;

      if (Array.isArray(W) && W.length) {
        found = W.some((w) => String(w?.Word || "").trim().toLowerCase() === needle);
      } else {
        const sum = pickSummary(a) || {};
        const words = Array.isArray(sum?.words) ? sum.words : [];
        found = words.some((w) => String(w || "").trim().toLowerCase() === needle);
      }

      if (!found) continue;

      out.push({
        attempt: a,
        title: attemptTitle(a),
        when: attemptWhen(a),
        score: attemptOverallScore(a),
      });
    }

    return out;
  }

  function findRecentAttemptsForPhoneme(attempts, ipa, limit = 6) {
    // Phase A: keep phoneme recents lightweight.
    // We'll still return some attempts if we can detect it, otherwise empty.
    const needle = String(ipa || "").trim();
    if (!needle) return [];

    const out = [];
    const list = Array.isArray(attempts) ? attempts.slice() : [];

    list.sort((a, b) => +new Date(pickTS(b) || 0) - +new Date(pickTS(a) || 0));

    for (const a of list) {
      if (out.length >= limit) break;

      const az = pickAzure(a);
      const W = az?.NBest?.[0]?.Words || [];
      let found = false;

      if (Array.isArray(W) && W.length) {
        // check phonemes inside words
        for (const w of W) {
          const P = Array.isArray(w?.Phonemes) ? w.Phonemes : [];
          if (!P.length) continue;
          if (P.some((p) => String(p?.Phoneme || "").trim() === needle)) {
            found = true;
            break;
          }
        }
      }

      if (!found) continue;

      out.push({
        attempt: a,
        title: attemptTitle(a),
        when: attemptWhen(a),
        score: attemptOverallScore(a),
      });
    }

    return out;
  }

  // Build the actual Next Activity Plan (override target)
  function buildCloudPlan(model, state) {
    if (!model) return null;

    const base = buildNextActivityPlanFromModel(model, {
      source: "cloud",
      maxWords: 6,
    });

    if (!base) return null;

    // If clicked WORD: ensure it is first in targets.words
    if (state.kind === "word") {
      const target = {
        word: String(state.id || "").trim(),
        avg: Number(state.avg) || null,
        count: Number(state.count) || null,
        days: Number(state.days) || null,
        priority: Number(state.priority) || null,
      };

      const rest = (base.targets?.words || []).filter(
        (w) => String(w?.word || "").toLowerCase() !== target.word.toLowerCase()
      );

      base.targets.words = [target, ...rest].slice(0, 6);
    }

    // If clicked PHONEME: override phoneme
    if (state.kind === "phoneme") {
      base.targets.phoneme = {
        ipa: String(state.id || "").trim(),
        avg: Number(state.avg) || null,
        count: Number(state.count) || null,
        days: Number(state.days) || null,
        priority: Number(state.priority) || null,
      };
    }

    return base;
  }

  // First render
  setModeStory();
  await loadAndDraw();

  // Auto refresh while on this page
  setInterval(() => {
    // only refresh if still on wordcloud page
    if (document.getElementById(ROOT_ID)) loadAndDraw();
  }, AUTO_REFRESH_MS);
}
