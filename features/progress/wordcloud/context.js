// features/progress/wordcloud/context.js
import { readState, writeState } from "./state-store.js";
import { readUrlState, writeUrlState } from "./url-state.js";

export function createWordcloudContext() {
  const st = readState();
  const urlSt = readUrlState();

  // ✅ Your existing defaults here (keep same behavior)
  let state = {
    mode: String(st.mode || "words"),
    sort: String(st.sort || "priority"),
    range: String(st.range || "all"),
    q: String(st.q || ""),
    theme: String(st.theme || "light"),

    mix: String(st.mix || "smart"),
    clusterMode: String(st.clusterMode || "1") === "1",

    timelineWin: Number(st.timelineWin || 14),
    timelinePos: Number(st.timelinePos || 0),
  };

  // ✅ Apply URL overrides (same precedence you already had)
  if (urlSt.mode != null) state.mode = urlSt.mode;
  if (urlSt.sort != null) state.sort = urlSt.sort;
  if (urlSt.range != null) state.range = urlSt.range;
  if (urlSt.q != null) state.q = urlSt.q;
  if (urlSt.theme != null) state.theme = urlSt.theme;
  if (urlSt.mix != null) state.mix = urlSt.mix;
  if (urlSt.cluster != null) state.clusterMode = urlSt.cluster === "1";

  if (urlSt.win != null) state.timelineWin = Number(urlSt.win || 14);
  if (urlSt.pos != null) state.timelinePos = Number(urlSt.pos || 0);

  // ✅ Clamp timeline values (same as before)
  state.timelineWin = Math.max(7, Math.min(60, state.timelineWin || 14));
  state.timelinePos = Math.max(0, Math.min(90, state.timelinePos || 0));

  let _onChange = null;

  function get() {
    return { ...state };
  }

  function set(patch) {
    state = { ...state, ...patch };

    // re-clamp timeline
    state.timelineWin = Math.max(7, Math.min(60, Number(state.timelineWin || 14)));
    state.timelinePos = Math.max(0, Math.min(90, Number(state.timelinePos || 0)));

    // persist
    writeState(state);

    // url
    writeUrlState({
      mode: state.mode,
      sort: state.sort,
      range: state.range,
      q: state.q,
      theme: state.theme,
      clusterMode: state.clusterMode,
      mix: state.mix,
      win: state.timelineWin,
      pos: state.timelinePos,
    });

    if (_onChange) _onChange(get());
  }

  function onChange(fn) {
    _onChange = fn;
  }

  return { get, set, onChange };
}
