// features/progress/wordcloud/index.js
import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";
import { computeRollups } from "../rollups.js";
import { ensureWordCloudLibs } from "./libs.js";

import { createCloudActionSheet } from "./action-sheet.js";

import {
  readState,
  writeState,
  savedListForMode,
  addManySaved,
  THEME_KEY,
  FAV_KEY,
  PIN_KEY,
} from "./state-store.js";

import { readUrlState, writeUrlState } from "./url-state.js";
import { rangeLabel, sortLabel, mixLabel } from "./labels.js";

import {
  lower,
  idFromItem,
  filterAttemptsByRange,
  computeLastSeenMap,
  persistentScore,
  smartTop3,
} from "./compute.js";

import {
  attemptOverallScore,
  attemptWhen,
  attemptTitle,
  findRecentAttemptsForWord,
  findRecentAttemptsForPhoneme,
} from "./attempt-utils.js";

import { wordcloudTemplateHtml } from "./template.js";

import { drawWordcloud } from "./render.js";

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../../next-activity/next-activity.js";

import { openDetailsModal } from "../attempt-detail-modal.js";

const ROOT_ID = "wordcloud-root";
const AUTO_REFRESH_MS = 10 * 60 * 1000;
const TOP_N = 20;

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
  const urlSt = readUrlState();

  let _mode = st.mode === "phonemes" ? "phonemes" : "words";
  let _sort = ["priority", "freq", "diff", "recent", "persist"].includes(st.sort)
    ? st.sort
    : "priority";
  let _range = ["all", "30d", "7d", "today", "timeline"].includes(st.range)
    ? st.range
    : "all";
  let _query = String(st.query || "");

  let _mix = st.mix === "view" ? "view" : "smart"; // Phase E default = smart
  let _clusterMode = !!st.clusterMode;

  // Phase F: Timeline scrub + replay
  let _timelineWin = Number(st.timelineWin || 14); // days in window
  let _timelinePos = Number(st.timelinePos || 0); // days ago the window ENDs (0 = now)
  let _isReplay = false;
  let _replayTimer = null;

  _timelineWin = Math.max(7, Math.min(60, _timelineWin || 14));
  _timelinePos = Math.max(0, Math.min(90, _timelinePos || 0));

  // URL overrides (Phase E)
  if (urlSt.mode === "phonemes" || urlSt.mode === "words") _mode = urlSt.mode;
  if (["priority", "freq", "diff", "recent", "persist"].includes(urlSt.sort))
    _sort = urlSt.sort;
  if (["all", "30d", "7d", "today", "timeline"].includes(urlSt.range))
    _range = urlSt.range;
  if (typeof urlSt.q === "string") _query = urlSt.q;
  if (urlSt.cluster === "1" || urlSt.cluster === "0")
    _clusterMode = urlSt.cluster === "1";
  if (urlSt.mix === "smart" || urlSt.mix === "view") _mix = urlSt.mix;

  if (urlSt.win != null)
    _timelineWin = Math.max(7, Math.min(60, Number(urlSt.win) || 14));
  if (urlSt.pos != null)
    _timelinePos = Math.max(0, Math.min(90, Number(urlSt.pos) || 0));

  let _theme = (localStorage.getItem(THEME_KEY) || "light").toLowerCase();
  if (_theme !== "night") _theme = "light";
  if (urlSt.theme === "night" || urlSt.theme === "light") _theme = urlSt.theme;

  let _attemptsAll = [];
  let _lastModel = null;

  let _lastItems = [];
  let _lastPool = [];

  root.innerHTML = wordcloudTemplateHtml();

  const shell = root.querySelector("#luxWcShell");
  const canvas = root.querySelector("#luxWcCanvas");
  const meta = root.querySelector("#luxWcMeta");
  const sub = root.querySelector("#luxWcSub");

  // Loading overlay (center canvas)
  const overlay = root.querySelector("#luxWcOverlay");
  const overlayTitle = root.querySelector("#luxWcOverlayTitle");
  const overlaySub = root.querySelector("#luxWcOverlaySub");

  // Render sequencing guard (prevents old async layouts hiding new overlay)
  const _renderSeq = { value: 0 };

  function setBusy(on, title = "Loading…", subText = "") {
    if (!overlay) return;
    overlay.hidden = !on;
    overlay.style.display = on ? "flex" : "none"; // ✅ override any CSS conflict
    overlay.setAttribute("aria-busy", on ? "true" : "false");

    if (overlayTitle) overlayTitle.textContent = title;
    if (overlaySub) overlaySub.textContent = subText || "";
  }

  // Ensures the overlay becomes visible BEFORE heavy work starts
  function waitTwoFrames() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

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

  const timelineRow = root.querySelector("#luxWcTimelineRow");
  const winSlider = root.querySelector("#luxWcWin");
  const posSlider = root.querySelector("#luxWcPos");
  const winVal = root.querySelector("#luxWcWinVal");
  const posVal = root.querySelector("#luxWcPosVal");
  const btnReplay = root.querySelector("#luxWcReplay");

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
      clusterMode: _clusterMode,
      mix: _mix,
      timelineWin: _timelineWin,
      timelinePos: _timelinePos,
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
      win: _timelineWin,
      pos: _timelinePos,
    });
  }

  function fmtDaysAgo(pos) {
    if (pos === 0) return "Now";
    return `${pos}d ago`;
  }

  function applyTimelineUI() {
    const show = _range === "timeline";
    if (timelineRow) timelineRow.style.display = show ? "flex" : "none";

    if (winSlider) winSlider.value = String(_timelineWin);
    if (posSlider) posSlider.value = String(_timelinePos);

    if (winVal) winVal.textContent = `${_timelineWin}d`;
    if (posVal) posVal.textContent = fmtDaysAgo(_timelinePos);
  }

  function stopReplay() {
    _isReplay = false;
    if (_replayTimer) {
      clearInterval(_replayTimer);
      _replayTimer = null;
    }
    if (btnReplay) btnReplay.textContent = "▶ Replay";
  }

  function startReplay() {
    stopReplay();
    _isReplay = true;
    if (btnReplay) btnReplay.textContent = "⏸ Pause";

    // start from oldest-to-newest within slider max
    let p = 90;
    _timelinePos = p;

    _replayTimer = setInterval(() => {
      if (!_isReplay) return;

      p -= 1;
      if (p < 0) {
        stopReplay();
        return;
      }

      _timelinePos = p;
      persist();
      syncUrl();
      applyTimelineUI();
      draw(false);
    }, 420);
  }

  function setModeStory() {
    sub.textContent =
      _mode === "phonemes"
        ? "Sounds that show up often + cause trouble (size = frequency, color = Lux difficulty)"
        : "Words you use often + struggle with most (size = frequency, color = Lux difficulty)";
  }

  function setActiveButtons() {
    pills.forEach((b) =>
      b.classList.toggle("is-active", b.dataset.mode === _mode)
    );
    sortBtns.forEach((b) =>
      b.classList.toggle("is-on", b.dataset.sort === _sort)
    );
    rangeBtns.forEach((b) =>
      b.classList.toggle("is-on", b.dataset.range === _range)
    );

    btnCluster.classList.toggle("is-on", _clusterMode);

    mixView.classList.toggle("is-on", _mix === "view");
    mixSmart.classList.toggle("is-on", _mix === "smart");

    applyTimelineUI();
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
        ${top
          .map((x) => {
            const id = idFromItem(_mode, x);
            const avg = Math.round(Number(x.avg || 0));
            return `<button class="lux-wc-chipTarget" data-open="${id}">
            <span class="lux-wc-chipTxt">${
              _mode === "phonemes" ? `/${id}/` : id
            }</span>
            <span class="lux-wc-chipPct">${avg}%</span>
          </button>`;
          })
          .join("")}
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
            ${arr
              .map(
                (id) => `
              <button class="lux-wc-chipSaved" data-open="${id}">
                ${_mode === "phonemes" ? `/${id}/` : id}
              </button>
            `
              )
              .join("")}
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
        ? _lastModel?.trouble?.phonemesAll || []
        : _lastModel?.trouble?.wordsAll || [];

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

    if (_sort === "freq")
      items.sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
    else if (_sort === "diff")
      items.sort((a, b) => Number(a.avg || 0) - Number(b.avg || 0));
    else if (_sort === "recent")
      items.sort(
        (a, b) => Number(b.lastSeenTS || 0) - Number(a.lastSeenTS || 0)
      );
    else if (_sort === "persist")
      items.sort((a, b) => persistentScore(b) - persistentScore(a));
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
      const dateStr = attemptWhen(attempt) || "—";
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
  root.addEventListener(
    "click",
    (e) => {
      const btn = e.target?.closest?.("[data-open]");
      if (!btn) return;

      const attemptsInRange = filterAttemptsByRange(
        _attemptsAll,
        _range,
        _timelineWin,
        _timelinePos
      );

      const id = String(btn.getAttribute("data-open") || "").trim();
      if (!id) return;

      const hitItem = (_lastPool || []).find(
        (x) => lower(idFromItem(_mode, x)) === lower(id)
      );

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
    },
    { passive: true }
  );

  // ---------- draw ----------
  async function draw(forceFetch = false) {
    await drawWordcloud({
      forceFetch,

      renderSeqRef: _renderSeq,

      setBusy,
      waitTwoFrames,

      metaEl: meta,
      canvas,

      mode: _mode,
      range: _range,
      timelineWin: _timelineWin,
      timelinePos: _timelinePos,
      query: _query,
      sort: _sort,
      mix: _mix,
      clusterMode: _clusterMode,

      attemptsAll: _attemptsAll,
      ensureWordCloudLibs,
      ensureData,
      filterAttemptsByRange,
      computeItemsForView,
      renderSavedStrip,
      renderTargetsStrip,
      pinnedSet: pinnedSetNow(),

      lower,
      rangeLabel,
      sortLabel,
      mixLabel,
      fmtDaysAgo,

      persist,
      syncUrl,
      setActiveButtons,
      setModeStory,

      setLastItems: (items) => {
        _lastItems = items || [];
      },

      onSelect: (hit) => {
        const attemptsRange = filterAttemptsByRange(
          _attemptsAll,
          _range,
          _timelineWin,
          _timelinePos
        );

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
  }

  // ---------- events ----------
  btnBack?.addEventListener("click", () =>
    window.location.assign("./progress.html")
  );

  btnTheme?.addEventListener("click", () => {
    _theme = _theme === "night" ? "light" : "night";
    applyTheme();
    persist();
    syncUrl();
  });

  btnRefresh?.addEventListener("click", () => draw(true));

  pills.forEach((b) =>
    b.addEventListener("click", () => {
      _mode = b.dataset.mode;
      persist();
      syncUrl();
      draw(false);
    })
  );

  sortBtns.forEach((b) =>
    b.addEventListener("click", () => {
      _sort = b.dataset.sort;
      persist();
      syncUrl();
      draw(false);
    })
  );

  rangeBtns.forEach((b) =>
    b.addEventListener("click", () => {
      _range = b.dataset.range;

      // safety: stop replay if user leaves timeline
      if (_range !== "timeline") stopReplay();

      persist();
      syncUrl();
      draw(false);
    })
  );

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
      const chosen = top
        .map((x) => ({
          word: String(x.word || "").trim(),
          avg: Number(x.avg || 0) || null,
          count: Number(x.count || 0) || null,
          days: Number(x.days || 0) || null,
          priority: Number(x.priority || 0) || null,
        }))
        .filter((x) => x.word);

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

  // Timeline controls
  winSlider?.addEventListener("input", () => {
    _timelineWin = Math.max(7, Math.min(60, Number(winSlider.value) || 14));
    persist();
    syncUrl();
    applyTimelineUI();
    draw(false);
  });

  posSlider?.addEventListener("input", () => {
    _timelinePos = Math.max(0, Math.min(90, Number(posSlider.value) || 0));
    persist();
    syncUrl();
    applyTimelineUI();
    draw(false);
  });

  btnReplay?.addEventListener("click", () => {
    if (_range !== "timeline") {
      _range = "timeline";
      setActiveButtons();
      applyTimelineUI();
    }
    if (_isReplay) stopReplay();
    else startReplay();
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
  applyTimelineUI();
  await draw(false);

  setInterval(() => {
    if (document.getElementById(ROOT_ID)) draw(false);
  }, AUTO_REFRESH_MS);
}
