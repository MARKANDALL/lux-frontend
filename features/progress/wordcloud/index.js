// features/progress/wordcloud/index.js
import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";
import { computeRollups } from "../rollups.js";
import { renderWordCloudCanvas } from "./render-canvas.js";
import { ensureWordCloudLibs } from "./libs.js";
import { pickTS, pickAzure } from "../attempt-pickers.js";

const ROOT_ID = "wordcloud-root";
const AUTO_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
const TOP_N = 20;

// Phase B state persistence
const STATE_KEY = "lux.cloud.state.v1";

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

function lower(s) {
  return String(s || "").trim().toLowerCase();
}

function filterAttemptsByRange(attempts, rangeKey) {
  const list = Array.isArray(attempts) ? attempts : [];
  if (rangeKey === "all") return list;

  const now = Date.now();

  if (rangeKey === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const start = +d;
    return list.filter((a) => {
      const ts = +new Date(pickTS(a) || 0);
      return ts >= start;
    });
  }

  const days = rangeKey === "7d" ? 7 : 30;
  const start = now - days * 24 * 60 * 60 * 1000;

  return list.filter((a) => {
    const ts = +new Date(pickTS(a) || 0);
    return ts >= start;
  });
}

/**
 * Compute "last seen" timestamps for ONLY the top items in the cloud.
 * This makes "Recent" sorting real, without any backend changes.
 */
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
        if (!word) continue;
        if (!want.has(word)) continue;
        if (!seen.has(word)) seen.set(word, ts);
      }
    } else {
      for (const w of W) {
        const P = Array.isArray(w?.Phonemes) ? w.Phonemes : [];
        if (!P.length) continue;

        for (const p of P) {
          const ipa = lower(p?.Phoneme);
          if (!ipa) continue;
          if (!want.has(ipa)) continue;
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

export async function initWordCloudPage() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  const state = readState();

  // Restored state (Phase B)
  let _mode = state.mode === "phonemes" ? "phonemes" : "words";
  let _sort = ["priority", "freq", "diff", "recent", "persist"].includes(state.sort)
    ? state.sort
    : "priority";
  let _range = ["all", "30d", "7d", "today"].includes(state.range) ? state.range : "all";
  let _query = String(state.query || "");

  root.innerHTML = `
    <section class="lux-wc-shell">
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

          <div class="lux-wc-chipBar" id="luxWcSortBar" aria-label="Sort">
            <button class="lux-wc-chipBtn" data-sort="priority">Priority</button>
            <button class="lux-wc-chipBtn" data-sort="freq">Frequent</button>
            <button class="lux-wc-chipBtn" data-sort="diff">Difficult</button>
            <button class="lux-wc-chipBtn" data-sort="recent">Recent</button>
            <button class="lux-wc-chipBtn" data-sort="persist">Persistent</button>
          </div>

          <div class="lux-wc-chipBar" id="luxWcRangeBar" aria-label="Time range">
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

  const canvas = root.querySelector("#luxWcCanvas");
  const meta = root.querySelector("#luxWcMeta");
  const sub = root.querySelector("#luxWcSub");

  const btnRefresh = root.querySelector("#luxWcRefresh");
  const btnBack = root.querySelector("#luxWcBack");

  const pills = Array.from(root.querySelectorAll(".lux-wc-pill"));
  const sortBtns = Array.from(root.querySelectorAll("[data-sort]"));
  const rangeBtns = Array.from(root.querySelectorAll("[data-range]"));
  const search = root.querySelector("#luxWcSearch");
  const clear = root.querySelector("#luxWcClear");

  // Cached attempts for instant sorting/filtering
  let _attemptsAll = [];

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

  async function ensureData(force = false) {
    if (_attemptsAll.length && !force) return;
    const uid = ensureUID();
    _attemptsAll = await fetchHistory(uid);
  }

  function computeItemsForView(attemptsInRange) {
    const model = computeRollups(attemptsInRange);

    const raw =
      _mode === "phonemes"
        ? (model?.trouble?.phonemesAll || [])
        : (model?.trouble?.wordsAll || []);

    // Pull a slightly bigger pool so sorting + searching feels better
    let items = raw.slice(0, 60);

    // add lastSeenTS for "Recent" sort (top pool only)
    const ids = items.map((x) => idFromItem(_mode, x));
    const lastSeen = computeLastSeenMap(_mode === "phonemes" ? "phonemes" : "words", attemptsInRange, ids);

    items = items.map((x) => {
      const id = lower(idFromItem(_mode, x));
      return { ...x, lastSeenTS: lastSeen.get(id) || 0 };
    });

    // sort modes
    if (_sort === "freq") {
      items.sort((a, b) => (Number(b.count || 0) - Number(a.count || 0)));
    } else if (_sort === "diff") {
      items.sort((a, b) => (Number(a.avg || 0) - Number(b.avg || 0))); // lower avg = harder first
    } else if (_sort === "recent") {
      items.sort((a, b) => (Number(b.lastSeenTS || 0) - Number(a.lastSeenTS || 0)));
    } else if (_sort === "persist") {
      items.sort((a, b) => persistentScore(b) - persistentScore(a));
    } else {
      // priority
      items.sort((a, b) => (Number(b.priority || 0) - Number(a.priority || 0)));
    }

    // search (reorder matches first; dim non-matches in renderer)
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
    const focusTest =
      q.length >= 1
        ? (idLower) => String(idLower || "").includes(q)
        : null;

    renderWordCloudCanvas(canvas, items, {
      focusTest,
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

  // ---- Initial paint ----
  setModeStory();
  setActiveButtons();
  await draw(false);

  // Auto refresh while on this page
  setInterval(() => {
    if (document.getElementById(ROOT_ID)) draw(false);
  }, AUTO_REFRESH_MS);
}
