// features/progress/wordcloud/context.js
import {
  readState,
  writeState,
  THEME_KEY,
} from "./state-store.js";

import { readUrlState, writeUrlState } from "./url-state.js";

/**
 * COMMIT 12A — Real shared context for the WordCloud feature
 * Owns:
 * - All state vars (mode/sort/range/query/mix/clusterMode/timelineWin/timelinePos/theme)
 * - persistence (state-store + url-state)
 * - theme application (DOM + localStorage)
 * - stable refs (attemptsAll, lastModel, lastItems, lastPool)
 * - get()/set() + onChange()
 */
export function createWordcloudContext() {
  const st = readState();
  const urlSt = readUrlState();

  // ✅ All primary state lives here
  let state = {
    mode: st.mode === "phonemes" ? "phonemes" : "words",

    sort: ["priority", "freq", "diff", "recent", "persist"].includes(st.sort)
      ? st.sort
      : "priority",

    range: ["all", "30d", "7d", "today", "timeline"].includes(st.range)
      ? st.range
      : "all",

    query: String(st.query || ""),

    mix: st.mix === "view" ? "view" : "smart",

    clusterMode: !!st.clusterMode,

    timelineWin: Number(st.timelineWin || 14),
    timelinePos: Number(st.timelinePos || 0),

    // Theme: stored in localStorage, but state owns it too
    theme: String(localStorage.getItem(THEME_KEY) || "light").toLowerCase(),
  };

  // ✅ normalize theme to only light/night
  if (state.theme !== "night") state.theme = "light";

  // ✅ URL overrides (same precedence as index.js previously had)
  if (urlSt.mode === "phonemes" || urlSt.mode === "words") state.mode = urlSt.mode;

  if (["priority", "freq", "diff", "recent", "persist"].includes(urlSt.sort))
    state.sort = urlSt.sort;

  if (["all", "30d", "7d", "today", "timeline"].includes(urlSt.range))
    state.range = urlSt.range;

  if (typeof urlSt.q === "string") state.query = urlSt.q;

  if (urlSt.cluster === "1" || urlSt.cluster === "0")
    state.clusterMode = urlSt.cluster === "1";

  if (urlSt.mix === "smart" || urlSt.mix === "view") state.mix = urlSt.mix;

  if (urlSt.win != null) state.timelineWin = Number(urlSt.win || 14);
  if (urlSt.pos != null) state.timelinePos = Number(urlSt.pos || 0);

  if (urlSt.theme === "night" || urlSt.theme === "light") state.theme = urlSt.theme;

  // ✅ clamp timeline values (same as before)
  state.timelineWin = Math.max(7, Math.min(60, Number(state.timelineWin || 14)));
  state.timelinePos = Math.max(0, Math.min(90, Number(state.timelinePos || 0)));

  // ✅ Stable refs (these are NOT re-assigned)
  const refs = {
    attemptsAll: [],   // stable array ref used by render.js
    lastModel: null,
    lastItems: [],
    lastPool: [],
  };

  let _onChange = null;

  function get() {
    return { ...state };
  }

  function normalizePatch(patch = {}) {
    const next = { ...patch };

    if (next.mode != null) {
      next.mode = next.mode === "phonemes" ? "phonemes" : "words";
    }

    if (next.sort != null) {
      next.sort = ["priority", "freq", "diff", "recent", "persist"].includes(next.sort)
        ? next.sort
        : state.sort;
    }

    if (next.range != null) {
      next.range = ["all", "30d", "7d", "today", "timeline"].includes(next.range)
        ? next.range
        : state.range;
    }

    if (next.query != null) {
      next.query = String(next.query || "");
    }

    if (next.mix != null) {
      next.mix = next.mix === "view" ? "view" : "smart";
    }

    if (next.clusterMode != null) {
      next.clusterMode = !!next.clusterMode;
    }

    if (next.timelineWin != null) {
      next.timelineWin = Math.max(7, Math.min(60, Number(next.timelineWin || 14)));
    }

    if (next.timelinePos != null) {
      next.timelinePos = Math.max(0, Math.min(90, Number(next.timelinePos || 0)));
    }

    if (next.theme != null) {
      const t = String(next.theme || "").toLowerCase();
      next.theme = t === "night" ? "night" : "light";
    }

    return next;
  }

  function persist() {
    writeState({
      mode: state.mode,
      sort: state.sort,
      range: state.range,
      query: state.query,
      clusterMode: state.clusterMode,
      mix: state.mix,
      timelineWin: state.timelineWin,
      timelinePos: state.timelinePos,
    });

    // theme is stored separately (but state owns it)
    try {
      localStorage.setItem(THEME_KEY, state.theme);
    } catch (_) {}
  }

  function syncUrl() {
    writeUrlState({
      mode: state.mode,
      sort: state.sort,
      range: state.range,
      q: state.query?.trim() || "",
      theme: state.theme,
      clusterMode: state.clusterMode,
      mix: state.mix,
      win: state.timelineWin,
      pos: state.timelinePos,
    });
  }

  function set(patch) {
    const clean = normalizePatch(patch);

    state = { ...state, ...clean };

    // re-clamp timeline (defensive)
    state.timelineWin = Math.max(7, Math.min(60, Number(state.timelineWin || 14)));
    state.timelinePos = Math.max(0, Math.min(90, Number(state.timelinePos || 0)));

    persist();
    syncUrl();

    if (_onChange) _onChange(get());
  }

  function onChange(fn) {
    _onChange = fn;
  }

  // ✅ Theme belongs to context (DOM application lives here too)
  function applyTheme(dom) {
    const isNight = state.theme === "night";
    if (dom?.shell) dom.shell.classList.toggle("lux-wc--night", isNight);

    if (dom?.btnTheme) dom.btnTheme.textContent = isNight ? "☀️" : "🌙";
    if (dom?.btnTheme) {
      dom.btnTheme.title = isNight
        ? "Switch to light theme"
        : "Switch to night theme";
    }

    try {
      localStorage.setItem(THEME_KEY, state.theme);
    } catch (_) {}
  }

  function toggleTheme(dom) {
    set({ theme: state.theme === "night" ? "light" : "night" });
    applyTheme(dom);
  }

  // ✅ Stable ref setters (no reassignment)
  function setLastModel(model) {
    refs.lastModel = model || null;
  }

  function setLastItems(items) {
    refs.lastItems = items || [];
  }

  function setLastPool(pool) {
    refs.lastPool = pool || [];
  }

  return {
    get,
    set,
    onChange,

    // state side-effects
    persist,
    syncUrl,
    applyTheme,
    toggleTheme,

    // stable refs
    refs,
    setLastModel,
    setLastItems,
    setLastPool,
  };
}
