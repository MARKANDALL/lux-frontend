// features/progress/wordcloud/strips.js

/**
 * COMMIT 12B — Extract strips + coach lane UI out of index.js
 * Owns:
 * - getTop3
 * - updateCoachHint
 * - renderTargetsStrip
 * - renderSavedStrip
 * - pinnedSetNow
 */

export function createWordcloudStrips({
  ctx,
  dom,
  getState, // () => current S snapshot
  mixLabel,
  smartTop3,
  idFromItem,
  lower,
  savedListForMode,
  PIN_KEY,
  FAV_KEY,
}) {
  function top3FromView(items) {
    const S = getState();
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
    const S = getState();
    if (S.mix === "smart") return smartTop3(S.mode, ctx.refs.lastPool);
    return top3FromView(ctx.refs.lastItems);
  }

  function updateCoachHint() {
    if (!dom.coachHint) return;

    const S = getState();
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

    const S = getState();
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

    const S = getState();

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
    const S = getState();
    const pins = savedListForMode(PIN_KEY, S.mode);
    return new Set(pins.map(lower));
  }

  return {
    getTop3,
    updateCoachHint,
    renderTargetsStrip,
    renderSavedStrip,
    pinnedSetNow,
  };
}
