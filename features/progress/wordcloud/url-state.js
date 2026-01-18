// features/progress/wordcloud/url-state.js

export function readUrlState() {
  const p = new URLSearchParams(window.location.search);
  const out = {};

  if (p.has("mode")) out.mode = p.get("mode");
  if (p.has("sort")) out.sort = p.get("sort");
  if (p.has("range")) out.range = p.get("range");
  if (p.has("q")) out.q = p.get("q") || "";
  if (p.has("theme")) out.theme = p.get("theme");
  if (p.has("cluster")) out.cluster = p.get("cluster");
  if (p.has("mix")) out.mix = p.get("mix");
  if (p.has("win")) out.win = p.get("win");
  if (p.has("pos")) out.pos = p.get("pos");

  return out;
}

export function writeUrlState({
  mode,
  sort,
  range,
  q,
  theme,
  clusterMode,
  mix,
  win,
  pos,
}) {
  const p = new URLSearchParams();

  p.set("mode", mode);
  p.set("sort", sort);
  p.set("range", range);
  if (q) p.set("q", q);

  p.set("theme", theme);
  p.set("cluster", clusterMode ? "1" : "0");
  p.set("mix", mix);

  if (range === "timeline") {
    p.set("win", String(win || 14));
    p.set("pos", String(pos || 0));
  }

  const next = `${window.location.pathname}?${p.toString()}`;
  window.history.replaceState(null, "", next);
}
