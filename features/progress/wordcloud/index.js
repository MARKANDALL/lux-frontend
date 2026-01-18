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

// Persist
const STATE_KEY = "lux.cloud.state.v3";
const THEME_KEY = "lux.cloud.theme.v1";

const FAV_KEY = "lux.cloud.favs.v1";
const PIN_KEY = "lux.cloud.pins.v1";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function lower(s) {
  return String(s || "").trim().toLowerCase();
}
function log1p(n) {
  return Math.log(1 + Math.max(0, Number(n || 0)));
}

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

function readSaved(key) {
  try {
    const raw = localStorage.getItem(key);
    const obj = raw ? JSON.parse(raw) : {};
    return {
      words: Array.isArray(obj.words) ? obj.words : [],
      phonemes: Array.isArray(obj.phonemes) ? obj.phonemes : [],
    };
  } catch (_) {
    return { words: [], phonemes: [] };
  }
}
function writeSaved(key, next) {
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch (_) {}
}

function savedListForMode(key, mode) {
  const s = readSaved(key);
  return mode === "phonemes" ? s.phonemes : s.words;
}

function addManySaved(key, mode, ids) {
  const s = readSaved(key);
  const list = mode === "phonemes" ? s.phonemes : s.words;

  const add = [];
  const seen = new Set(list.map(lower));
  for (const id of ids) {
    const v = String(id || "").trim();
    if (!v) continue;
    const k = lower(v);
    if (seen.has(k)) continue;
    seen.add(k);
    add.push(v);
  }

  const merged = [...add, ...list].slice(0, 30);
  if (mode === "phonemes") s.phonemes = merged;
  else s.words = merged;
  writeSaved(key, s);
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
function mixLabel(m) {
  return m === "smart" ? "Smart Mix" : "View-based";
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

// ---------- URL STATE (Phase E) ----------
function readUrlState() {
  const p = new URLSearchParams(window.location.search);
  const out = {};
  if (p.has("mode")) out.mode = p.get("mode");
  if (p.has("sort")) out.sort = p.get("sort");
  if (p.has("range")) out.range = p.get("range");
  if (p.has("q")) out.q = p.get("q") || "";
  if (p.has("theme")) out.theme = p.get("theme");
  if (p.has("cluster")) out.cluster = p.get("cluster");
  if (p.has("mix")) out.mix = p.get("mix");
  return out;
}

function writeUrlState({ mode, sort, range, q, theme, clusterMode, mix }) {
  const p = new URLSearchParams();

  p.set("mode", mode);
  p.set("sort", sort);
  p.set("range", range);
  if (q) p.set("q", q);

  p.set("theme", theme);
  p.set("cluster", clusterMode ? "1" : "0");
  p.set("mix", mix);

  const next = `${window.location.pathname}?${p.toString()}`;
  window.history.replaceState(null, "", next);
}

// ---------- Action Sheet helpers ----------
function attemptOverallScore(a) {
  const sum = pickSummary(a) || {};
  if (sum.pron != null) return Number(sum.pron) || 0;
  const az = pickAzure(a);
  return Number(az?.NBest?.[0]?.PronScore) || 0;
}
function attemptWhen(a) {
  const ts = pickTS(a);
  return ts ? new Date(ts).toLocaleString() : "";
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
    if (!Array.isArray(W) || !W.length) continue;

    const found = W.some((w) => lower(w?.Word) === needle);
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
    if (!Array.isArray(W) || !W.length) continue;

    let found = false;
    for (const w of W) {
      const P = Array.isArray(w?.Phonemes) ? w.Phonemes : [];
      if (P.some((p) => String(p?.Phoneme || "").trim() === needle)) {
        found = true;
        break;
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

// ---------- Smart Mix (Phase E) ----------
function smartTop3(mode, pool) {
  const items = Array.isArray(pool) ? pool.slice() : [];
  if (!items.length) return [];

  // thresholds to avoid noise
  const minCount = mode === "phonemes" ? 3 : 2;

  const candidates = items.filter((x) => Number(x.count || 0) >= minCount);

  if (!candidates.length) return items.slice(0, 3);

  // normalize stats
  const counts = candidates.map((x) => log1p(x.count || 0));
  const days = candidates.map((x) => log1p(x.days || 0));
  const recs = candidates.map((x) => Number(x.lastSeenTS || 0));
  const maxC = Math.max(1e-6, ...counts);
  const maxD = Math.max(1e-6, ...days);
  const maxR = Math.max(1, ...recs);

  const score = (x) => {
    const diff = clamp((100 - Number(x.avg || 0)) / 100, 0, 1);
    const freq = clamp(log1p(x.count || 0) / maxC, 0, 1);
    const pers = clamp(log1p(x.days || 0) / maxD, 0, 1);
    const rec = clamp((Number(x.lastSeenTS || 0)) / maxR, 0, 1);

    // Lux-friendly, stable weights
    return 0.45 * diff + 0.25 * pers + 0.20 * freq + 0.10 * rec;
  };

  candidates.sort((a, b) => score(b) - score(a));

  // Pick 3 distinct, stable
  const out = [];
  const seen = new Set();
  for (const x of candidates) {
    const id = lower(idFromItem(mode, x));
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(x);
    if (out.length >= 3) break;
  }

  return out;
}

export async function initWordCloudPage() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  const st = readState();
  const urlSt = readUrlState();

  let _mode = st.mode === "phonemes" ? "phonemes" : "words";
  let _sort = ["priority", "freq", "diff", "recent", "persist"].includes(st.sort)
    ? st.sort
    : "priority";
  let _range = ["all", "30d", "7d", "today"].includes(st.range) ? st.range : "all";
  let _query = String(st.query || "");

  let _mix = st.mix === "view" ? "view" : "smart"; // Phase E default = smart
  let _clusterMode = !!st.clusterMode;

  // URL overrides (Phase E)
  if (urlSt.mode === "phonemes" || urlSt.mode === "words") _mode = urlSt.mode;
  if (["priority", "freq", "diff", "recent", "persist"].includes(urlSt.sort)) _sort = urlSt.sort;
  if (["all", "30d", "7d", "today"].includes(urlSt.range)) _range = urlSt.range;
  if (typeof urlSt.q === "string") _query = urlSt.q;
  if (urlSt.cluster === "1" || urlSt.cluster === "0") _clusterMode = urlSt.cluster === "1";
  if (urlSt.mix === "smart" || urlSt.mix === "view") _mix = urlSt.mix;

  let _theme = (localStorage.getItem(THEME_KEY) || "light").toLowerCase();
  if (_theme !== "night") _theme = "light";
  if (urlSt.theme === "night" || urlSt.theme === "light") _theme = urlSt.theme;

  let _attemptsAll = [];
  let _lastModel = null;

  let _lastItems = [];
  let _lastPool = [];

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

          <!-- Phase D power row -->
          <div class="lux-wc-powerRow">
            <button class="lux-pbtn lux-wc-genTop" id="luxWcGenTop">
              ✨ Generate from Top 3
            </button>

            <button class="lux-pbtn lux-pbtn--ghost lux-wc-powerBtn" id="luxWcCluster">
              🧩 Cluster
            </button>

            <button class="lux-pbtn lux-pbtn--ghost lux-wc-powerBtn" id="luxWcSnapshot">
              📷 Snapshot
            </button>
          </div>

          <!-- Phase E mix toggle -->
          <div class="lux-wc-mixRow" aria-label="Top target mix">
            <span class="lux-wc-mixLabel">Top 3:</span>
            <button class="lux-wc-chipBtn" id="luxWcMixView" data-mix="view">View-based</button>
            <button class="lux-wc-chipBtn" id="luxWcMixSmart" data-mix="smart">Smart Mix</button>
          </div>

          <div class="lux-wc-targetStrip" id="luxWcTargets"></div>
          <div class="lux-wc-savedStrip" id="luxWcSaved"></div>

          <!-- Phase E Coach Lane -->
          <div class="lux-wc-coachLane" id="luxWcCoach">
            <div class="lux-wc-coachTitle">Coach Lane</div>
            <div class="lux-wc-coachBtns">
              <button class="lux-pbtn" id="luxWcCoachQuick">⚡ Quick drill</button>
              <button class="lux-pbtn lux-pbtn--ghost" id="luxWcCoachPinTop">📌 Pin Top 3</button>
            </div>
            <div class="lux-wc-coachHint" id="luxWcCoachHint"></div>
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

  const btnGenTop = root.querySelector("#luxWcGenTop");
  const btnCluster = root.querySelector("#luxWcCluster");
  const btnSnap = root.querySelector("#luxWcSnapshot");

  const mixView = root.querySelector("#luxWcMixView");
  const mixSmart = root.querySelector("#luxWcMixSmart");

  const targetsStrip = root.querySelector("#luxWcTargets");
  const savedStrip = root.querySelector("#luxWcSaved");

  const coachHint = root.querySelector("#luxWcCoachHint");
  const coachQuick = root.querySelector("#luxWcCoachQuick");
  const coachPinTop = root.querySelector("#luxWcCoachPinTop");

  function applyTheme() {
    const isNight = _theme === "night";
    shell.classList.toggle("lux-wc--night", isNight);
    btnTheme.textContent = isNight ? "☀️" : "🌙";
    btnTheme.title = isNight ? "Switch to light theme" : "Switch to night theme";
    try { localStorage.setItem(THEME_KEY, _theme); } catch (_) {}
  }

  function persist() {
    writeState({
      mode: _mode,
      sort: _sort,
      range: _range,
      query: _query,
      clusterMode: _clusterMode,
      mix: _mix,
    });
  }

  function syncUrl() {
    writeUrlState({
      mode: _mode,
      sort: _sort,
      range: _range,
      q: _query?.trim() || "",
      theme: _theme,
      clusterMode: _clusterMode,
      mix: _mix,
    });
  }

  function setModeStory() {
    sub.textContent =
      _mode === "phonemes"
        ? "Sounds that show up often + cause trouble (size = frequency, color = Lux difficulty)"
        : "Words you use often + struggle with most (size = frequency, color = Lux difficulty)";
  }

  function setActiveButtons() {
    pills.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === _mode));
    sortBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.sort === _sort));
    rangeBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.range === _range));

    btnCluster.classList.toggle("is-on", _clusterMode);

    mixView.classList.toggle("is-on", _mix === "view");
    mixSmart.classList.toggle("is-on", _mix === "smart");
  }

  function top3FromView(items) {
    const out = [];
    const seen = new Set();
    for (const x of items || []) {
      const id = lower(idFromItem(_mode, x));
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(x);
      if (out.length >= 3) break;
    }
    return out;
  }

  function getTop3() {
    if (_mix === "smart") {
      return smartTop3(_mode, _lastPool);
    }
    return top3FromView(_lastItems);
  }

  function updateCoachHint() {
    const top = getTop3();
    if (!top.length) {
      coachHint.textContent = "";
      return;
    }
    const names = top.map((x) => idFromItem(_mode, x)).slice(0, 3);
    coachHint.textContent =
      _mode === "phonemes"
        ? `Targets: /${names.join("/, /")}/`
        : `Targets: ${names.join(", ")}`;
  }

  function renderTargetsStrip(attemptsInRange) {
    const top = getTop3();

    if (!top.length) {
      targetsStrip.innerHTML = "";
      return;
    }

    targetsStrip.innerHTML = `
      <div class="lux-wc-stripLabel">Top targets (${mixLabel(_mix)})</div>
      <div class="lux-wc-stripRow">
        ${top.map((x) => {
          const id = idFromItem(_mode, x);
          const avg = Math.round(Number(x.avg || 0));
          return `<button class="lux-wc-chipTarget" data-open="${id}">
            <span class="lux-wc-chipTxt">${_mode === "phonemes" ? `/${id}/` : id}</span>
            <span class="lux-wc-chipPct">${avg}%</span>
          </button>`;
        }).join("")}
      </div>
    `;

    updateCoachHint();
  }

  function renderSavedStrip() {
    const pins = savedListForMode(PIN_KEY, _mode).slice(0, 10);
    const favs = savedListForMode(FAV_KEY, _mode).slice(0, 10);

    const mkRow = (title, arr, icon) => {
      if (!arr.length) return "";
      return `
        <div class="lux-wc-savedRow">
          <div class="lux-wc-stripLabel">${icon} ${title}</div>
          <div class="lux-wc-stripRow">
            ${arr.map((id) => `
              <button class="lux-wc-chipSaved" data-open="${id}">
                ${_mode === "phonemes" ? `/${id}/` : id}
              </button>
            `).join("")}
          </div>
        </div>
      `;
    };

    const html = mkRow("Pinned", pins, "📌") + mkRow("Favorites", favs, "⭐");
    savedStrip.innerHTML = html || "";
  }

  function pinnedSetNow() {
    const pins = savedListForMode(PIN_KEY, _mode);
    return new Set(pins.map(lower));
  }

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

    // pool for smartMix + better candidate recall
    let pool = raw.slice(0, 60);

    const ids = pool.map((x) => idFromItem(_mode, x));
    const lastSeen = computeLastSeenMap(
      _mode === "phonemes" ? "phonemes" : "words",
      attemptsInRange,
      ids
    );

    pool = pool.map((x) => {
      const id = lower(idFromItem(_mode, x));
      return { ...x, lastSeenTS: lastSeen.get(id) || 0 };
    });

    // view sort rules shape cloud
    let items = pool.slice();

    if (_sort === "freq") items.sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
    else if (_sort === "diff") items.sort((a, b) => Number(a.avg || 0) - Number(b.avg || 0));
    else if (_sort === "recent") items.sort((a, b) => Number(b.lastSeenTS || 0) - Number(a.lastSeenTS || 0));
    else if (_sort === "persist") items.sort((a, b) => persistentScore(b) - persistentScore(a));
    else items.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

    // search ordering
    const q = lower(_query);
    if (q) {
      const match = (x) => lower(idFromItem(_mode, x)).includes(q);
      const hits = items.filter(match);
      const rest = items.filter((x) => !match(x));
      items = [...hits, ...rest];
    }

    _lastPool = pool;
    return items.slice(0, TOP_N);
  }

  // ---------- Action Sheet ----------
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
    onStoreChange: () => {
      renderSavedStrip();
      draw(false);
    },
  });

  // delegated opener for target/saved chips
  root.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-open]");
    if (!btn) return;

    const attemptsInRange = filterAttemptsByRange(_attemptsAll, _range);

    const id = String(btn.getAttribute("data-open") || "").trim();
    if (!id) return;

    const hitItem = (_lastPool || []).find((x) => lower(idFromItem(_mode, x)) === lower(id));

    const kind = _mode === "phonemes" ? "phoneme" : "word";
    const title = kind === "phoneme" ? `/${id}/` : id;

    const avg = hitItem ? Number(hitItem.avg || 0) : 0;
    const count = hitItem ? Number(hitItem.count || 0) : 0;

    const recents =
      kind === "word"
        ? findRecentAttemptsForWord(attemptsInRange, id, 6)
        : findRecentAttemptsForPhoneme(attemptsInRange, id, 6);

    sheet.open({
      kind,
      id,
      title,
      avg,
      count,
      days: hitItem?.days ?? null,
      priority: hitItem?.priority ?? null,
      examples: Array.isArray(hitItem?.examples) ? hitItem.examples : [],
      recents,
    });
  }, { passive: true });

  // ---------- draw ----------
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

    _lastItems = items;

    renderSavedStrip();
    renderTargetsStrip(attemptsInRange);

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
      clusterMode: _clusterMode,
      pinnedSet: pinnedSetNow(),
      onSelect: (hit) => {
        const attemptsRange = filterAttemptsByRange(_attemptsAll, _range);

        const metaObj = hit?.meta || {};
        const isPh = _mode === "phonemes" || metaObj.ipa != null;

        const kind = isPh ? "phoneme" : "word";
        const id = isPh
          ? String(metaObj.ipa || hit.text || "").trim()
          : String(metaObj.word || hit.text || "").trim();

        const title = kind === "phoneme" ? `/${id}/` : id;

        const recents =
          kind === "word"
            ? findRecentAttemptsForWord(attemptsRange, id, 6)
            : findRecentAttemptsForPhoneme(attemptsRange, id, 6);

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
      `Updated ${new Date().toLocaleString()} · ${label} · ${rangeLabel(_range)} · Sort: ${sortLabel(_sort)} · Mix: ${mixLabel(_mix)}` +
      (q ? ` · Search: “${_query.trim()}”` : "");

    persist();
    syncUrl();
    setActiveButtons();
    setModeStory();
  }

  // ---------- events ----------
  btnBack?.addEventListener("click", () => window.location.assign("./progress.html"));

  btnTheme?.addEventListener("click", () => {
    _theme = _theme === "night" ? "light" : "night";
    applyTheme();
    persist();
    syncUrl();
  });

  btnRefresh?.addEventListener("click", () => draw(true));

  pills.forEach((b) => b.addEventListener("click", () => {
    _mode = b.dataset.mode;
    persist();
    syncUrl();
    draw(false);
  }));

  sortBtns.forEach((b) => b.addEventListener("click", () => {
    _sort = b.dataset.sort;
    persist();
    syncUrl();
    draw(false);
  }));

  rangeBtns.forEach((b) => b.addEventListener("click", () => {
    _range = b.dataset.range;
    persist();
    syncUrl();
    draw(false);
  }));

  search.value = _query;
  search.addEventListener("input", () => {
    _query = search.value || "";
    persist();
    syncUrl();
    draw(false);
  });

  clear.addEventListener("click", () => {
    _query = "";
    search.value = "";
    persist();
    syncUrl();
    draw(false);
    search.focus();
  });

  btnCluster?.addEventListener("click", () => {
    _clusterMode = !_clusterMode;
    persist();
    syncUrl();
    draw(false);
  });

  btnSnap?.addEventListener("click", () => {
    try {
      const a = document.createElement("a");
      a.download = `lux-cloud-${_mode}-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch (_) {}
  });

  mixView?.addEventListener("click", () => {
    _mix = "view";
    persist();
    syncUrl();
    draw(false);
  });

  mixSmart?.addEventListener("click", () => {
    _mix = "smart";
    persist();
    syncUrl();
    draw(false);
  });

  btnGenTop?.addEventListener("click", () => {
    if (!_lastModel) return;

    const top = getTop3();
    if (!top.length) return;

    const base = buildNextActivityPlanFromModel(_lastModel, {
      source: "cloud-top3",
      maxWords: 6,
    });
    if (!base) return;

    if (_mode === "words") {
      const chosen = top.map((x) => ({
        word: String(x.word || "").trim(),
        avg: Number(x.avg || 0) || null,
        count: Number(x.count || 0) || null,
        days: Number(x.days || 0) || null,
        priority: Number(x.priority || 0) || null,
      })).filter((x) => x.word);

      const rest = (base.targets?.words || []).filter(
        (w) => !chosen.some((c) => lower(c.word) === lower(w?.word))
      );

      base.targets.words = [...chosen, ...rest].slice(0, 6);
    } else {
      const best = top[0];
      base.targets.phoneme = {
        ipa: String(best.ipa || "").trim(),
        avg: Number(best.avg || 0) || null,
        count: Number(best.count || 0) || null,
        days: Number(best.days || 0) || null,
        priority: Number(best.priority || 0) || null,
      };
    }

    saveNextActivityPlan(base);
    window.location.assign("./convo.html#chat");
  });

  // Coach Lane
  coachQuick?.addEventListener("click", () => {
    if (!_lastModel) return;
    // Quick = generate from top3 (same engine, just “intent” metadata)
    btnGenTop.click();
  });

  coachPinTop?.addEventListener("click", () => {
    const top = getTop3();
    const ids = top.map((x) => idFromItem(_mode, x)).filter(Boolean);
    if (!ids.length) return;
    addManySaved(PIN_KEY, _mode, ids);
    renderSavedStrip();
    draw(false);
  });

  // initial
  applyTheme();
  setActiveButtons();
  setModeStory();
  await draw(false);

  setInterval(() => {
    if (document.getElementById(ROOT_ID)) draw(false);
  }, AUTO_REFRESH_MS);
}
