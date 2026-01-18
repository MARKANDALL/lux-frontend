// features/progress/wordcloud/index.js
import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";
import { computeRollups } from "../rollups.js";
import { ensureWordCloudLibs } from "./libs.js";

import { createCloudActionSheet } from "./action-sheet.js";

import {
  savedListForMode,
  addManySaved,
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

// ✅ COMMIT 10: extract DOM querying into dom.js
import { getWordcloudDom } from "./dom.js";

// ✅ COMMIT 11: replay/timeline controller extracted
import { createTimelineController } from "./timeline.js";

// ✅ COMMIT 12A: real shared context object
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

  // ✅ COMMIT 12A — shared context owns all state + persistence + URL + theme
  const ctx = createWordcloudContext();

  // Snapshot of state for easy reads (updated via onChange)
  let S = ctx.get();
  ctx.onChange((next) => {
    S = next;
  });

  // Stable refs are owned by ctx (NOT by index.js)
  const attemptsAll = ctx.refs.attemptsAll;

  // ✅ mount template, then grab all DOM in one call
  root.innerHTML = wordcloudTemplateHtml();
  const dom = getWordcloudDom(root);

  // Render sequencing guard (prevents old async layouts hiding new overlay)
  const _renderSeq = { value: 0 };

  function setBusy(on, title = "Loading…", subText = "") {
    if (!dom.overlay) return;

    dom.overlay.hidden = !on;
    dom.overlay.style.display = on ? "flex" : "none"; // ✅ override any CSS conflict
    dom.overlay.setAttribute("aria-busy", on ? "true" : "false");

    if (dom.overlayTitle) dom.overlayTitle.textContent = title;
    if (dom.overlaySub) dom.overlaySub.textContent = subText || "";
  }

  // Ensures the overlay becomes visible BEFORE heavy work starts
  function waitTwoFrames() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  function fmtDaysAgo(pos) {
    if (pos === 0) return "Now";
    return `${pos}d ago`;
  }

  function applyTimelineUI() {
    const show = S.range === "timeline";
    if (dom.timelineRow) dom.timelineRow.style.display = show ? "flex" : "none";

    if (dom.winSlider) dom.winSlider.value = String(S.timelineWin);
    if (dom.posSlider) dom.posSlider.value = String(S.timelinePos);

    if (dom.winVal) dom.winVal.textContent = `${S.timelineWin}d`;
    if (dom.posVal) dom.posVal.textContent = fmtDaysAgo(S.timelinePos);
  }

  function setModeStory() {
    if (!dom.sub) return;
    dom.sub.textContent =
      S.mode === "phonemes"
        ? "Sounds that show up often + cause trouble (size = frequency, color = Lux difficulty)"
        : "Words you use often + struggle with most (size = frequency, color = Lux difficulty)";
  }

  function setActiveButtons() {
    (dom.pills || []).forEach((b) =>
      b.classList.toggle("is-active", b.dataset.mode === S.mode)
    );
    (dom.sortBtns || []).forEach((b) =>
      b.classList.toggle("is-on", b.dataset.sort === S.sort)
    );
    (dom.rangeBtns || []).forEach((b) =>
      b.classList.toggle("is-on", b.dataset.range === S.range)
    );

    if (dom.btnCluster) dom.btnCluster.classList.toggle("is-on", S.clusterMode);

    if (dom.mixView) dom.mixView.classList.toggle("is-on", S.mix === "view");
    if (dom.mixSmart) dom.mixSmart.classList.toggle("is-on", S.mix === "smart");

    applyTimelineUI();
  }

  function top3FromView(items) {
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
    if (S.mix === "smart") return smartTop3(S.mode, ctx.refs.lastPool);
    return top3FromView(ctx.refs.lastItems);
  }

  function updateCoachHint() {
    if (!dom.coachHint) return;

    const top = getTop3();
    if (!top.length) {
      dom.coachHint.textContent = "";
      return;
    }

    const names = top.map((x) => idFromItem(S.mode, x)).slice(0, 3);
    dom.coachHint.textContent =
      S.mode === "phonemes"
        ? `Targets: /${names.join("/, /")}/`
        : `Targets: ${names.join(", ")}`;
  }

  function renderTargetsStrip() {
    if (!dom.targetsStrip) return;

    const top = getTop3();
    if (!top.length) {
      dom.targetsStrip.innerHTML = "";
      updateCoachHint();
      return;
    }

    dom.targetsStrip.innerHTML = `
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
    if (!dom.savedStrip) return;

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
    dom.savedStrip.innerHTML = html || "";
  }

  function pinnedSetNow() {
    const pins = savedListForMode(PIN_KEY, S.mode);
    return new Set(pins.map(lower));
  }

  // ✅ MINIMAL FIX (ONLY HERE)
  // Mutate the existing attemptsAll array so render.js always sees the same reference.
  async function ensureData(force = false) {
    if (attemptsAll.length && !force) return;

    const uid = ensureUID();
    const next = await fetchHistory(uid);

    attemptsAll.length = 0;
    attemptsAll.push(...(next || []));

    console.log(
      "[wc] history attempts:",
      attemptsAll?.length,
      attemptsAll?.[0]
    );
  }

  function computeItemsForView(attemptsInRange) {
    const model = computeRollups(attemptsInRange);
    ctx.setLastModel(model);

    const raw =
      S.mode === "phonemes"
        ? model?.trouble?.phonemesAll || []
        : model?.trouble?.wordsAll || [];

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
      items.sort(
        (a, b) => Number(b.lastSeenTS || 0) - Number(a.lastSeenTS || 0)
      );
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

    ctx.setLastPool(pool);
    return items.slice(0, TOP_N);
  }

  // ---------- Action Sheet ----------
  const sheet = createCloudActionSheet({
    onGenerate: (state) => {
      const plan = buildCloudPlan(ctx.refs.lastModel, state);
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
    // ✅ CORRECT ORDER: (allAttempts, range, timelineWin, timelinePos)
    const attemptsInRange = filterAttemptsByRange(
      attemptsAll,
      S.range,
      S.timelineWin,
      S.timelinePos
    );

    const hitItem = (ctx.refs.lastPool || []).find(
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

      // ✅ LOG C — right after items computed
      console.log("[wc] items:", items?.length, "mode=", S.mode, "sort=", S.sort);

      return items;
    };

    await drawWordcloud({
      forceFetch,

      renderSeqRef: _renderSeq,

      setBusy,
      waitTwoFrames,

      metaEl: dom.meta,
      canvas: dom.canvas,

      mode: S.mode,
      range: S.range,
      timelineWin: S.timelineWin,
      timelinePos: S.timelinePos,
      query: S.query,
      sort: S.sort,
      mix: S.mix,
      clusterMode: S.clusterMode,

      attemptsAll,
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

      // ✅ context owns persistence+url now (keep keys identical)
      persist: () => ctx.persist(),
      syncUrl: () => ctx.syncUrl(),

      setActiveButtons,
      setModeStory,

      setLastItems: (items) => {
        ctx.setLastItems(items || []);
      },

      onSelect: (hit) => {
        // ✅ CORRECT ORDER: (allAttempts, range, timelineWin, timelinePos)
        const attemptsRange = filterAttemptsByRange(
          attemptsAll,
          S.range,
          S.timelineWin,
          S.timelinePos
        );

        const metaObj = hit?.meta || {};
        const isPh = S.mode === "phonemes" || metaObj.ipa != null;

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

  // ✅ COMMIT 11: timeline controller owns replay timer + button state
  // (index.js only holds win/pos + range, and delegates replay concerns)
  const timeline = createTimelineController({
    dom,

    getRange: () => S.range,
    setRange: (nextRange) => {
      ctx.set({ range: nextRange });
      setActiveButtons();
      applyTimelineUI();
    },

    getWin: () => S.timelineWin,
    setWin: (val) => {
      ctx.set({ timelineWin: val });
      applyTimelineUI();
      draw(false);
    },

    getPos: () => S.timelinePos,
    setPos: (val) => {
      ctx.set({ timelinePos: val });
      applyTimelineUI();
      draw(false);
    },

    // UI helpers
    fmtDaysAgo,
    applyTimelineUI,

    // redraw hook (controller calls when replay ticks)
    requestDraw: () => draw(false),
  });

  // ---------- bind events ----------
  bindWordcloudEvents(root, {
    goBack: () => window.location.assign("./progress.html"),

    toggleTheme: () => {
      ctx.toggleTheme(dom);
    },

    redraw: (forceFetch = false) => draw(!!forceFetch),

    setMode: (mode) => {
      ctx.set({ mode });
      setModeStory();
      draw(false);
    },

    setSort: (sort) => {
      ctx.set({ sort });
      draw(false);
    },

    setRange: (range) => {
      const next = ["all", "30d", "7d", "today", "timeline"].includes(range)
        ? range
        : S.range;

      // ✅ COMMIT 11: stop replay when leaving timeline
      if (next !== "timeline") timeline.stop?.();

      ctx.set({ range: next });
      setActiveButtons();
      draw(false);
    },

    setQuery: (q) => {
      ctx.set({ query: String(q || "") });
      draw(false);
    },

    clearQuery: () => {
      ctx.set({ query: "" });
      draw(false);
    },

    toggleCluster: () => {
      ctx.set({ clusterMode: !S.clusterMode });
      draw(false);
    },

    snapshot: () => {
      try {
        if (!dom.canvas) return;
        const a = document.createElement("a");
        a.download = `lux-cloud-${S.mode}-${Date.now()}.png`;
        a.href = dom.canvas.toDataURL("image/png");
        a.click();
      } catch (_) {}
    },

    setMix: (mix) => {
      ctx.set({ mix });
      draw(false);
    },

    generateTop3: () => {
      if (!ctx.refs.lastModel) return;

      const top = getTop3();
      if (!top.length) return;

      const base = buildNextActivityPlanFromModel(ctx.refs.lastModel, {
        source: "cloud-top3",
        maxWords: 6,
      });
      if (!base) return;

      if (S.mode === "words") {
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
    },

    // ✅ timeline scrub inputs still flow through index.js,
    // but we delegate to controller so it can keep replay consistent
    setTimelineWin: (val) => timeline.setWin?.(val),
    setTimelinePos: (val) => timeline.setPos?.(val),

    // ✅ Replay button path (events.js can call api.timeline.toggle())
    timeline,

    // ✅ Backward compatibility if anything still calls api.toggleReplay()
    toggleReplay: () => timeline.toggle?.(),

    coachQuick: () => {
      if (!ctx.refs.lastModel) return;

      const top = getTop3();
      if (!top.length) return;

      const base = buildNextActivityPlanFromModel(ctx.refs.lastModel, {
        source: "cloud-top3",
        maxWords: 6,
      });
      if (!base) return;

      saveNextActivityPlan(base);
      window.location.assign("./convo.html#chat");
    },

    coachPinTop: () => {
      const top = getTop3();
      const ids = top.map((x) => idFromItem(S.mode, x)).filter(Boolean);
      if (!ids.length) return;

      addManySaved(PIN_KEY, S.mode, ids);
      renderSavedStrip();
      draw(false);
    },

    openSheetForId,
  });

  // initial
  ctx.applyTheme(dom);
  setActiveButtons();
  setModeStory();
  applyTimelineUI();
  timeline.syncButton?.(); // optional (controller can update replay button text on load)
  await draw(false);

  setInterval(() => {
    if (document.getElementById(ROOT_ID)) draw(false);
  }, AUTO_REFRESH_MS);
}
