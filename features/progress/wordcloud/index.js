// features/progress/wordcloud/index.js
import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";
import { computeRollups } from "../rollups.js";
import { ensureWordCloudLibs } from "./libs.js";

import { createCloudActionSheet } from "./action-sheet.js";

import {
  savedListForMode,
  addManySaved,
  THEME_KEY,
  FAV_KEY,
  PIN_KEY,
} from "./state-store.js";

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
import { bindWordcloudEvents } from "./events.js";

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../../next-activity/next-activity.js";

import { openDetailsModal } from "../attempt-detail-modal.js";

import { createWordcloudContext } from "./context.js";

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

  // ✅ NEW: single state source
  const ctx = createWordcloudContext();

  // Phase F: Timeline scrub + replay
  let _isReplay = false;
  let _replayTimer = null;

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

  const pills = Array.from(root.querySelectorAll(".lux-wc-pill"));
  const sortBtns = Array.from(root.querySelectorAll("[data-sort]"));
  const rangeBtns = Array.from(root.querySelectorAll("[data-range]"));

  const btnCluster = root.querySelector("#luxWcCluster");
  const mixView = root.querySelector("#luxWcMixView");
  const mixSmart = root.querySelector("#luxWcMixSmart");

  const targetsStrip = root.querySelector("#luxWcTargets");
  const savedStrip = root.querySelector("#luxWcSaved");

  const coachHint = root.querySelector("#luxWcCoachHint");

  const timelineRow = root.querySelector("#luxWcTimelineRow");
  const winSlider = root.querySelector("#luxWcWin");
  const posSlider = root.querySelector("#luxWcPos");
  const winVal = root.querySelector("#luxWcWinVal");
  const posVal = root.querySelector("#luxWcPosVal");
  const btnReplay = root.querySelector("#luxWcReplay");

  function applyTheme() {
    const S = ctx.get();
    const isNight = S.theme === "night";
    shell.classList.toggle("lux-wc--night", isNight);
    if (btnTheme) btnTheme.textContent = isNight ? "☀️" : "🌙";
    if (btnTheme)
      btnTheme.title = isNight ? "Switch to light theme" : "Switch to night theme";
    try {
      localStorage.setItem(THEME_KEY, S.theme);
    } catch (_) {}
  }

  function fmtDaysAgo(pos) {
    if (pos === 0) return "Now";
    return `${pos}d ago`;
  }

  function applyTimelineUI() {
    const S = ctx.get();
    const show = S.range === "timeline";
    if (timelineRow) timelineRow.style.display = show ? "flex" : "none";

    if (winSlider) winSlider.value = String(S.timelineWin);
    if (posSlider) posSlider.value = String(S.timelinePos);

    if (winVal) winVal.textContent = `${S.timelineWin}d`;
    if (posVal) posVal.textContent = fmtDaysAgo(S.timelinePos);
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
    ctx.set({ timelinePos: p });

    _replayTimer = setInterval(() => {
      if (!_isReplay) return;

      p -= 1;
      if (p < 0) {
        stopReplay();
        return;
      }

      ctx.set({ timelinePos: p });
      applyTimelineUI();
      draw(false);
    }, 420);
  }

  function setModeStory() {
    const S = ctx.get();
    sub.textContent =
      S.mode === "phonemes"
        ? "Sounds that show up often + cause trouble (size = frequency, color = Lux difficulty)"
        : "Words you use often + struggle with most (size = frequency, color = Lux difficulty)";
  }

  function setActiveButtons() {
    const S = ctx.get();

    pills.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === S.mode));
    sortBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.sort === S.sort));
    rangeBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.range === S.range));

    if (btnCluster) btnCluster.classList.toggle("is-on", !!S.clusterMode);

    if (mixView) mixView.classList.toggle("is-on", S.mix === "view");
    if (mixSmart) mixSmart.classList.toggle("is-on", S.mix === "smart");

    applyTimelineUI();
  }

  function top3FromView(items) {
    const S = ctx.get();
    const out = [];
    const seen = new Set();
    for (const x of items || []) {
      const id = lower(idFromItem(S.mode, x));
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(x);
      if (out.length >= 3) break;
    }
    return out;
  }

  function getTop3() {
    const S = ctx.get();
    if (S.mix === "smart") {
      return smartTop3(S.mode, _lastPool);
    }
    return top3FromView(_lastItems);
  }

  function updateCoachHint() {
    const S = ctx.get();
    const top = getTop3();
    if (!top.length) {
      coachHint.textContent = "";
      return;
    }
    const names = top.map((x) => idFromItem(S.mode, x)).slice(0, 3);
    coachHint.textContent =
      S.mode === "phonemes"
        ? `Targets: /${names.join("/, /")}/`
        : `Targets: ${names.join(", ")}`;
  }

  function renderTargetsStrip(attemptsInRange) {
    const S = ctx.get();
    const top = getTop3();

    if (!top.length) {
      targetsStrip.innerHTML = "";
      return;
    }

    targetsStrip.innerHTML = `
      <div class="lux-wc-stripLabel">Top targets (${mixLabel(S.mix)})</div>
      <div class="lux-wc-stripRow">
        ${top
          .map((x) => {
            const id = idFromItem(S.mode, x);
            const avg = Math.round(Number(x.avg || 0));
            return `<button class="lux-wc-chipTarget" data-open="${id}">
            <span class="lux-wc-chipTxt">${
              S.mode === "phonemes" ? `/${id}/` : id
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
    const S = ctx.get();

    const pins = savedListForMode(PIN_KEY, S.mode).slice(0, 10);
    const favs = savedListForMode(FAV_KEY, S.mode).slice(0, 10);

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
                ${S.mode === "phonemes" ? `/${id}/` : id}
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
    const S = ctx.get();
    const pins = savedListForMode(PIN_KEY, S.mode);
    return new Set(pins.map(lower));
  }

  async function ensureData(force = false) {
    if (_attemptsAll.length && !force) return;
    const uid = ensureUID();
    _attemptsAll = await fetchHistory(uid);

    // ✅ LOG A — right after history is fetched
    console.log("[wc] history attempts:", _attemptsAll?.length, _attemptsAll?.[0]);
  }

  function computeItemsForView(attemptsInRange) {
    const S = ctx.get();
    _lastModel = computeRollups(attemptsInRange);

    const raw =
      S.mode === "phonemes"
        ? _lastModel?.trouble?.phonemesAll || []
        : _lastModel?.trouble?.wordsAll || [];

    // pool for smartMix + better candidate recall
    let pool = raw.slice(0, 60);

    const ids = pool.map((x) => idFromItem(S.mode, x));
    const lastSeen = computeLastSeenMap(
      S.mode === "phonemes" ? "phonemes" : "words",
      attemptsInRange,
      ids
    );

    pool = pool.map((x) => {
      const id = lower(idFromItem(S.mode, x));
      return { ...x, lastSeenTS: lastSeen.get(id) || 0 };
    });

    // view sort rules shape cloud
    let items = pool.slice();

    if (S.sort === "freq")
      items.sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
    else if (S.sort === "diff")
      items.sort((a, b) => Number(a.avg || 0) - Number(b.avg || 0));
    else if (S.sort === "recent")
      items.sort((a, b) => Number(b.lastSeenTS || 0) - Number(a.lastSeenTS || 0));
    else if (S.sort === "persist")
      items.sort((a, b) => persistentScore(b) - persistentScore(a));
    else items.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

    // search ordering
    const q = lower(S.query);
    if (q) {
      const match = (x) => lower(idFromItem(S.mode, x)).includes(q);
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

  function openSheetForId(id) {
    const S = ctx.get();

    // ✅ CORRECT ORDER: (allAttempts, range, timelineWin, timelinePos)
    const attemptsInRange = filterAttemptsByRange(
      _attemptsAll,
      S.range,
      S.timelineWin,
      S.timelinePos
    );

    const hitItem = (_lastPool || []).find(
      (x) => lower(idFromItem(S.mode, x)) === lower(id)
    );

    const kind = S.mode === "phonemes" ? "phoneme" : "word";
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
  }

  // ---------- draw ----------
  async function draw(forceFetch = false) {
    // Wrap the two choke points so logs occur in index.js (even though work is in render.js)

    const filterAttemptsByRangeLogged = (allAttempts, range, win, pos) => {
      const attemptsInRange = filterAttemptsByRange(allAttempts, range, win, pos);

      const S = ctx.get();

      // ✅ LOG B — right after range filter
      console.log(
        "[wc] attempts in range:",
        attemptsInRange?.length,
        "range=",
        S.range,
        "win=",
        S.timelineWin,
        "pos=",
        S.timelinePos
      );

      return attemptsInRange;
    };

    const computeItemsForViewLogged = (attemptsInRange) => {
      const items = computeItemsForView(attemptsInRange);

      const S = ctx.get();

      // ✅ LOG C — right after items computed
      console.log("[wc] items:", items?.length, "mode=", S.mode, "sort=", S.sort);

      return items;
    };

    const S = ctx.get();

    await drawWordcloud({
      forceFetch,

      renderSeqRef: _renderSeq,

      setBusy,
      waitTwoFrames,

      metaEl: meta,
      canvas,

      mode: S.mode,
      range: S.range,
      timelineWin: S.timelineWin,
      timelinePos: S.timelinePos,
      query: S.query,
      sort: S.sort,
      mix: S.mix,
      clusterMode: S.clusterMode,

      attemptsAll: _attemptsAll,
      ensureWordCloudLibs,
      ensureData,

      // ✅ pass wrappers (this is how we guarantee logs happen in index.js)
      filterAttemptsByRange: filterAttemptsByRangeLogged,
      computeItemsForView: computeItemsForViewLogged,

      renderSavedStrip,
      renderTargetsStrip,
      pinnedSet: pinnedSetNow(),

      lower,
      rangeLabel,
      sortLabel,
      mixLabel,
      fmtDaysAgo,

      persist: () => {}, // ctx owns persistence now
      syncUrl: () => {}, // ctx owns URL sync now

      setActiveButtons,
      setModeStory,

      setLastItems: (items) => {
        _lastItems = items || [];
      },

      onSelect: (hit) => {
        const S2 = ctx.get();

        // ✅ CORRECT ORDER: (allAttempts, range, timelineWin, timelinePos)
        const attemptsRange = filterAttemptsByRange(
          _attemptsAll,
          S2.range,
          S2.timelineWin,
          S2.timelinePos
        );

        const metaObj = hit?.meta || {};
        const isPh = S2.mode === "phonemes" || metaObj.ipa != null;

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

  // ✅ events.js refactor: pass ctx directly
  const redraw = (forceFetch = false) => {
    applyTheme();
    setActiveButtons();
    setModeStory();
    applyTimelineUI();
    return draw(!!forceFetch);
  };

  bindWordcloudEvents(root, { ctx, redraw });

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
