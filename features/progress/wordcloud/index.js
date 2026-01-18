// features/progress/wordcloud/index.js
import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";
import { computeRollups } from "../rollups.js";
import { ensureWordCloudLibs } from "./libs.js";
import { renderWordCloudCanvas } from "./render-canvas.js";

import { createCloudActionSheet } from "./action-sheet.js";

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../../next-activity/next-activity.js";

import { openDetailsModal } from "../attempt-detail-modal.js";
import { pickTS, pickAzure, pickSummary, pickPassageKey } from "../attempt-pickers.js";
import { titleFromPassageKey } from "../render/format.js";

const ROOT_ID = "wordcloud-root";
const AUTO_REFRESH_MS = 10 * 60 * 1000;
const TOP_N = 20;

// Persist state
const STATE_KEY = "lux.cloud.state.v2";
const THEME_KEY = "lux.cloud.theme.v1";

function readState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function writeState(next) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(next || {}));
  } catch (_) {}
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function lower(s) {
  return String(s || "").trim().toLowerCase();
}

function rangeLabel(r) {
  if (r === "today") return "Today";
  if (r === "7d") return "7 days";
  if (r === "30d") return "30 days";
  return "All time";
}

function sortLabel(s) {
  if (s === "freq") return "Frequent";
  if (s === "diff") return "Difficult";
  if (s === "recent") return "Recent";
  if (s === "persist") return "Persistent";
  return "Priority";
}

function idFromItem(mode, x) {
  if (mode === "phonemes") return String(x?.ipa ?? x?.text ?? "").trim();
  return String(x?.word ?? x?.text ?? "").trim();
}

function filterAttemptsByRange(attempts, rangeKey) {
  const list = Array.isArray(attempts) ? attempts : [];
  if (rangeKey === "all") return list;

  const now = Date.now();

  if (rangeKey === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const start = +d;
    return list.filter((a) => +new Date(pickTS(a) || 0) >= start);
  }

  const days = rangeKey === "7d" ? 7 : 30;
  const start = now - days * 24 * 60 * 60 * 1000;

  return list.filter((a) => +new Date(pickTS(a) || 0) >= start);
}

function computeLastSeenMap(mode, attempts, idsWanted) {
  const want = new Set((idsWanted || []).map((x) => lower(x)));
  const seen = new Map();
  if (!want.size) return seen;

  const list = Array.isArray(attempts) ? attempts.slice() : [];
  list.sort((a, b) => +new Date(pickTS(b) || 0) - +new Date(pickTS(a) || 0));

  for (const a of list) {
    if (seen.size >= want.size) break;

    const ts = +new Date(pickTS(a) || 0);
    if (!ts) continue;

    const az = pickAzure(a);
    const W = az?.NBest?.[0]?.Words || [];
    if (!Array.isArray(W) || !W.length) continue;

    if (mode === "words") {
      for (const w of W) {
        const word = lower(w?.Word);
        if (!word || !want.has(word)) continue;
        if (!seen.has(word)) seen.set(word, ts);
      }
    } else {
      for (const w of W) {
        const P = Array.isArray(w?.Phonemes) ? w.Phonemes : [];
        if (!P.length) continue;

        for (const p of P) {
          const ipa = lower(p?.Phoneme);
          if (!ipa || !want.has(ipa)) continue;
          if (!seen.has(ipa)) seen.set(ipa, ts);
        }
      }
    }
  }

  return seen;
}

function persistentScore(x) {
  const days = Number(x?.days || 0);
  const count = Number(x?.count || 0);
  const avg = Number(x?.avg || 0);
  const bad = clamp((100 - avg) / 100, 0, 1);
  return Math.pow(days + 1, 1.2) * Math.pow(count + 1, 0.65) * (0.35 + bad);
}

// Recent matchers (Action Sheet)
function attemptOverallScore(a) {
  const sum = pickSummary(a) || {};
  if (sum.pron != null) return Number(sum.pron) || 0;
  const az = pickAzure(a);
  return Number(az?.NBest?.[0]?.PronScore) || 0;
}

function attemptWhen(a) {
  const ts = pickTS(a);
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

function attemptTitle(a) {
  const pk = pickPassageKey(a);
  return titleFromPassageKey(pk);
}

function findRecentAttemptsForWord(attempts, word, limit = 6) {
  const needle = lower(word);
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
      found = W.some((w) => lower(w?.Word) === needle);
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

function buildCloudPlan(model, state) {
  const base = buildNextActivityPlanFromModel(model, {
    source: "cloud",
    maxWords: 6,
  });
  if (!base) return null;

  if (state.kind === "word") {
    const target = {
      word: String(state.id || "").trim(),
      avg: Number(state.avg) || null,
      count: Number(state.count) || null,
      days: Number(state.days) || null,
      priority: Number(state.priority) || null,
    };

    const rest = (base.targets?.words || []).filter(
      (w) => lower(w?.word) !== lower(target.word)
    );

    base.targets.words = [target, ...rest].slice(0, 6);
  }

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

export async function initWordCloudPage() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  const st = readState();

  let _mode = st.mode === "phonemes" ? "phonemes" : "words";
  let _sort = ["priority", "freq", "diff", "recent", "persist"].includes(st.sort)
    ? st.sort
    : "priority";
  let _range = ["all", "30d", "7d", "today"].includes(st.range) ? st.range : "all";
  let _query = String(st.query || "");

  let _theme = (localStorage.getItem(THEME_KEY) || "light").toLowerCase();
  if (_theme !== "night") _theme = "light";

  let _attemptsAll = [];
  let _lastModel = null;

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
            <button class="lux-wc-pill" data-mode="words">Words</button>
            <button class="lux-wc-pill" data-mode="phonemes">Phonemes</button>
          </div>

          <button class="lux-pbtn lux-pbtn--ghost" id="luxWcThemeToggle" title="Toggle theme">🌙</button>
          <button class="lux-pbtn" id="luxWcRefresh">Refresh</button>
          <button class="lux-pbtn lux-pbtn--ghost" id="luxWcBack">← Back</button>
        </div>
      </div>

      <div class="lux-wc-body">
        <div class="lux-wc-controls">
          <div class="lux-wc-search">
            <input id="luxWcSearch" type="search" placeholder="Search cloud…" autocomplete="off" />
            <button class="lux-wc-clear" id="luxWcClear" title="Clear">✕</button>
          </div>

          <div class="lux-wc-chipBar" aria-label="Sort">
            <button class="lux-wc-chipBtn" data-sort="priority">Priority</button>
            <button class="lux-wc-chipBtn" data-sort="freq">Frequent</button>
            <button class="lux-wc-chipBtn" data-sort="diff">Difficult</button>
            <button class="lux-wc-chipBtn" data-sort="recent">Recent</button>
            <button class="lux-wc-chipBtn" data-sort="persist">Persistent</button>
          </div>

          <div class="lux-wc-chipBar" aria-label="Time range">
            <button class="lux-wc-chipBtn" data-range="all">All time</button>
            <button class="lux-wc-chipBtn" data-range="30d">30d</button>
            <button class="lux-wc-chipBtn" data-range="7d">7d</button>
            <button class="lux-wc-chipBtn" data-range="today">Today</button>
          </div>
        </div>

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
  const sub = root.querySelector("#luxWcSub");

  const btnTheme = root.querySelector("#luxWcThemeToggle");
  const btnRefresh = root.querySelector("#luxWcRefresh");
  const btnBack = root.querySelector("#luxWcBack");

  const pills = Array.from(root.querySelectorAll(".lux-wc-pill"));
  const sortBtns = Array.from(root.querySelectorAll("[data-sort]"));
  const rangeBtns = Array.from(root.querySelectorAll("[data-range]"));
  const search = root.querySelector("#luxWcSearch");
  const clear = root.querySelector("#luxWcClear");

  function applyTheme() {
    const isNight = _theme === "night";
    shell.classList.toggle("lux-wc--night", isNight);
    btnTheme.textContent = isNight ? "☀️" : "🌙";
    btnTheme.title = isNight ? "Switch to light theme" : "Switch to night theme";
    try {
      localStorage.setItem(THEME_KEY, _theme);
    } catch (_) {}
  }

  function persist() {
    writeState({
      mode: _mode,
      sort: _sort,
      range: _range,
      query: _query,
    });
  }

  function setModeStory() {
    if (!sub) return;
    sub.textContent =
      _mode === "phonemes"
        ? "Sounds that show up often + cause trouble (size = frequency, color = Lux difficulty)"
        : "Words you use often + struggle with most (size = frequency, color = Lux difficulty)";
  }

  function setActiveButtons() {
    pills.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === _mode));
    sortBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.sort === _sort));
    rangeBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.range === _range));
  }

  btnBack?.addEventListener("click", () => {
    window.location.assign("./progress.html");
  });

  btnTheme?.addEventListener("click", () => {
    _theme = _theme === "night" ? "light" : "night";
    applyTheme();
  });

  // ✅ Phase A Action Sheet
  const sheet = createCloudActionSheet({
    onGenerate: (state) => {
      const plan = buildCloudPlan(_lastModel, state);
      if (!plan) return;
      saveNextActivityPlan(plan);
      window.location.assign("./convo.html#chat");
    },
    onOpenAttempt: (attempt) => {
      if (!attempt) return;
      const score = attemptOverallScore(attempt);
      const ts = pickTS(attempt);
      const dateStr = ts ? new Date(ts).toLocaleString() : "—";
      openDetailsModal(attempt, score, dateStr, {
        sid: "",
        list: [attempt],
        session: null,
      });
    },
  });

  async function ensureData(force = false) {
    if (_attemptsAll.length && !force) return;
    const uid = ensureUID();
    _attemptsAll = await fetchHistory(uid);
  }

  function computeItemsForView(attemptsInRange) {
    _lastModel = computeRollups(attemptsInRange);

    const raw =
      _mode === "phonemes"
        ? (_lastModel?.trouble?.phonemesAll || [])
        : (_lastModel?.trouble?.wordsAll || []);

    let items = raw.slice(0, 60);

    const ids = items.map((x) => idFromItem(_mode, x));
    const lastSeen = computeLastSeenMap(
      _mode === "phonemes" ? "phonemes" : "words",
      attemptsInRange,
      ids
    );

    items = items.map((x) => {
      const id = lower(idFromItem(_mode, x));
      return { ...x, lastSeenTS: lastSeen.get(id) || 0 };
    });

    if (_sort === "freq") {
      items.sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
    } else if (_sort === "diff") {
      items.sort((a, b) => Number(a.avg || 0) - Number(b.avg || 0));
    } else if (_sort === "recent") {
      items.sort((a, b) => Number(b.lastSeenTS || 0) - Number(a.lastSeenTS || 0));
    } else if (_sort === "persist") {
      items.sort((a, b) => persistentScore(b) - persistentScore(a));
    } else {
      items.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
    }

    // search ordering (matches float up)
    const q = lower(_query);
    if (q) {
      const match = (x) => lower(idFromItem(_mode, x)).includes(q);
      const hits = items.filter(match);
      const rest = items.filter((x) => !match(x));
      items = [...hits, ...rest];
    }

    return items.slice(0, TOP_N);
  }

  async function draw(forceFetch = false) {
    meta.textContent = "Loading…";

    const ok = await ensureWordCloudLibs();
    if (!ok) {
      meta.textContent =
        "Word Cloud libraries not found. Add /public/vendor/d3.v7.min.js + /public/vendor/d3.layout.cloud.js";
      return;
    }

    await ensureData(forceFetch);

    const attemptsInRange = filterAttemptsByRange(_attemptsAll, _range);
    const items = computeItemsForView(attemptsInRange);

    if (!items.length) {
      meta.textContent =
        _mode === "phonemes"
          ? "Not enough phoneme data yet — do a little more practice first."
          : "Not enough word data yet — do a little more practice first.";
      renderWordCloudCanvas(canvas, []);
      return;
    }

    const q = lower(_query);
    const focusTest = q ? (idLower) => String(idLower || "").includes(q) : null;

    renderWordCloudCanvas(canvas, items, {
      focusTest,
      onSelect: (hit) => {
        const metaObj = hit?.meta || {};
        const isPh = _mode === "phonemes" || metaObj.ipa != null;

        const kind = isPh ? "phoneme" : "word";
        const id = isPh
          ? String(metaObj.ipa || hit.text || "").trim()
          : String(metaObj.word || hit.text || "").trim();

        const title = kind === "phoneme" ? `/${id}/` : id;

        const recents =
          kind === "word"
            ? findRecentAttemptsForWord(attemptsInRange, id, 6)
            : findRecentAttemptsForPhoneme(attemptsInRange, id, 6);

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
    meta.textContent =
      `Updated ${new Date().toLocaleString()} · ${label} · ${rangeLabel(_range)} · Sort: ${sortLabel(_sort)}` +
      (q ? ` · Search: “${_query.trim()}”` : "");
  }

  // ---- Events ----
  btnRefresh?.addEventListener("click", () => draw(true));

  pills.forEach((b) => {
    b.addEventListener("click", () => {
      _mode = b.dataset.mode;
      setModeStory();
      setActiveButtons();
      persist();
      draw(false);
    });
  });

  sortBtns.forEach((b) => {
    b.addEventListener("click", () => {
      _sort = b.dataset.sort;
      setActiveButtons();
      persist();
      draw(false);
    });
  });

  rangeBtns.forEach((b) => {
    b.addEventListener("click", () => {
      _range = b.dataset.range;
      setActiveButtons();
      persist();
      draw(false);
    });
  });

  search.value = _query;
  search.addEventListener("input", () => {
    _query = search.value || "";
    persist();
    draw(false);
  });

  clear.addEventListener("click", () => {
    _query = "";
    search.value = "";
    persist();
    draw(false);
    search.focus();
  });

  // ---- Initial ----
  applyTheme();
  setModeStory();
  setActiveButtons();
  persist();
  await draw(false);

  setInterval(() => {
    if (document.getElementById(ROOT_ID)) draw(false);
  }, AUTO_REFRESH_MS);
}
