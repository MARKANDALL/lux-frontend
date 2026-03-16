// features/progress/wordcloud/action-sheet.js
// One-line: Word Cloud action sheet for favorites, pins, recents, and targeted practice actions.

import { K_WC_FAVS, K_WC_PINS, getJSON, setJSON } from '../../../app-core/lux-storage.js';
import { esc, getColorConfig } from "../progress-utils.js";
import { scoreClass as scoreClassCore } from "../../../core/scoring/index.js";

function readStore(key) {
  const obj = getJSON(key, null);
  const out = obj && typeof obj === "object" ? obj : {};
  out.words = Array.isArray(out.words) ? out.words : [];
  out.phonemes = Array.isArray(out.phonemes) ? out.phonemes : [];
  return out;
}

function writeStore(key, obj) {
  setJSON(key, obj);
}

function hasItem(kind, id, store) {
  const arr = kind === "phoneme" ? store.phonemes : store.words;
  return arr.some((x) => String(x).toLowerCase() === String(id).toLowerCase());
}

function toggleItem(kind, id, key) {
  const store = readStore(key);
  const arrKey = kind === "phoneme" ? "phonemes" : "words";
  const arr = store[arrKey] || [];
  const norm = String(id).trim();
  const next = arr.filter((x) => String(x).toLowerCase() !== norm.toLowerCase());
  if (next.length === arr.length) next.unshift(norm); // add
  store[arrKey] = next.slice(0, 50);
  writeStore(key, store);
  return hasItem(kind, id, store);
}

function labelFor(avg) {
  const n = Number(avg) || 0;
  const cls = scoreClassCore(n);
  if (cls === "score-good") return "Good";
  if (cls === "score-warn") return "Developing";
  return "Needs work";
}

function safePct(v) {
  if (!Number.isFinite(Number(v))) return "–";
  return `${Math.round(Number(v))}%`;
}

export function createCloudActionSheet({
  onGenerate = null,
  onOpenAttempt = null,
  onStoreChange = null,
} = {}) {
  let overlay = null;
  let sheet = null;

  let state = null; // { kind, id, title, avg, count, days, priority, examples, recents[] }

  function positionSheetMidRight() {
    if (!overlay) return;

    const shell = document.getElementById("luxWcShell");
    const r = shell?.getBoundingClientRect?.();

    // fallback: center in viewport
    const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
    const clampedY = Math.max(18, Math.min(window.innerHeight - 18, y));

    overlay.style.position = "fixed";
    overlay.style.top = `${Math.round(clampedY)}px`;
    overlay.style.right = "18px";
    overlay.style.left = "auto";
    overlay.style.transform = "translateY(-50%)";
  }

  function ensureMounted() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "lux-wc-sheetOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="lux-wc-sheetCard" role="dialog" aria-modal="true">
        <div class="lux-wc-sheetHead">
          <div class="lux-wc-sheetHeadMain">
            <div class="lux-wc-sheetTitle" id="luxWcSheetTitle">—</div>
            <div class="lux-wc-sheetMeta" id="luxWcSheetMeta">—</div>
          </div>

          <div class="lux-wc-sheetHeadBtns">
            <button class="lux-wc-iconBtn" data-act="fav" title="Favorite">⭐</button>
            <button class="lux-wc-iconBtn" data-act="pin" title="Pin">📌</button>
            <button class="lux-wc-iconBtn" data-act="close" title="Close">✕</button>
          </div>
        </div>

        <div class="lux-wc-sheetBody">
          <div class="lux-wc-sheetPrimary">
            <button class="lux-pbtn lux-wc-primaryBtn" data-act="generate">
              ✨ Generate my next practice
            </button>
            <div class="lux-wc-primaryHint" id="luxWcPrimaryHint">
              Uses your selection as the focus target inside an AI conversation.
            </div>
          </div>

          <div class="lux-wc-sheetGrid">
            <div class="lux-wc-miniStat">
              <div class="lux-wc-miniLabel">Avg</div>
              <div class="lux-wc-miniVal" id="luxWcStatAvg">—</div>
            </div>
            <div class="lux-wc-miniStat">
              <div class="lux-wc-miniLabel">Seen</div>
              <div class="lux-wc-miniVal" id="luxWcStatSeen">—</div>
            </div>
            <div class="lux-wc-miniStat">
              <div class="lux-wc-miniLabel">Level</div>
              <div class="lux-wc-miniVal" id="luxWcStatLevel">—</div>
            </div>
          </div>

          <div class="lux-wc-sec" id="luxWcExamplesBlock" style="display:none;">
            <div class="lux-wc-secTitle">Examples</div>
            <div class="lux-wc-chipRow" id="luxWcExamplesRow"></div>
          </div>

          <div class="lux-wc-sec" id="luxWcRecentsBlock">
            <div class="lux-wc-secTitle">Recent attempts</div>
            <div class="lux-wc-recents" id="luxWcRecentsList"></div>
          </div>

          <details class="lux-wc-details">
            <summary>Details</summary>
            <div class="lux-wc-detailsInner" id="luxWcDetailsInner"></div>
          </details>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    sheet = overlay.querySelector(".lux-wc-sheetCard");

    // close when clicking dark overlay (not inside card)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // esc closes
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay?.getAttribute("aria-hidden") === "false")
        close();
    });

    const reflow = () => {
      if (overlay?.classList.contains("is-open")) positionSheetMidRight();
    };

    window.addEventListener("resize", reflow);
    window.addEventListener("scroll", reflow, { passive: true });

    overlay.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-act]");
      if (!btn) return;

      const act = btn.getAttribute("data-act");
      if (act === "close") close();

      if (!state) return;

      if (act === "generate") {
        onGenerate?.(state);
      }

      if (act === "fav") {
        const isNowFav = toggleItem(state.kind, state.id, K_WC_FAVS);
        btn.classList.toggle("is-on", isNowFav);
        onStoreChange?.();
      }

      if (act === "pin") {
        const isNowPinned = toggleItem(state.kind, state.id, K_WC_PINS);
        btn.classList.toggle("is-on", isNowPinned);
        onStoreChange?.();
      }
    });

    overlay.addEventListener("click", (e) => {
      const row = e.target?.closest?.("[data-open-attempt]");
      if (!row) return;
      const idx = Number(row.getAttribute("data-open-attempt") || -1);
      const rec = state?.recents?.[idx];
      if (!rec?.attempt) return;
      onOpenAttempt?.(rec.attempt);
    });
  }

  function open(nextState) {
    ensureMounted();
    state = nextState || null;
    if (!state) return;

    // ✅ Position the sheet next to the Word Cloud, centered vertically
    positionSheetMidRight();

    // ✅ Match night mode if active on the shell
    const shell = document.getElementById("luxWcShell");
    overlay.classList.toggle(
      "lux-wc--night",
      !!shell?.classList.contains("lux-wc--night")
    );

    const col = getColorConfig(state.avg || 0);
    const titleEl = overlay.querySelector("#luxWcSheetTitle");
    const metaEl = overlay.querySelector("#luxWcSheetMeta");

    titleEl.textContent = state.title || state.id || "—";
    metaEl.innerHTML = `
      <span class="lux-wc-pillTag" style="background:${col.bg}; color:${col.color}">
        ${esc(labelFor(state.avg))}
      </span>
      <span class="lux-wc-sheetMetaSep">·</span>
      <span>${safePct(state.avg)}</span>
      <span class="lux-wc-sheetMetaSep">·</span>
      <span>seen ${Number(state.count || 0)}×</span>
    `;

    overlay.querySelector("#luxWcStatAvg").textContent = safePct(state.avg);
    overlay.querySelector("#luxWcStatSeen").textContent = `${Number(
      state.count || 0
    )}×`;
    overlay.querySelector("#luxWcStatLevel").textContent = labelFor(state.avg);

    // Fav/pin button state
    const fav = readStore(K_WC_FAVS);
    const pin = readStore(K_WC_PINS);

    overlay
      .querySelector('[data-act="fav"]')
      ?.classList.toggle("is-on", hasItem(state.kind, state.id, fav));
    overlay
      .querySelector('[data-act="pin"]')
      ?.classList.toggle("is-on", hasItem(state.kind, state.id, pin));

    // Examples (phonemes only)
    const exBlock = overlay.querySelector("#luxWcExamplesBlock");
    const exRow = overlay.querySelector("#luxWcExamplesRow");

    const examples = Array.isArray(state.examples) ? state.examples : [];
    if (examples.length) {
      exBlock.style.display = "";
      exRow.innerHTML = examples
        .slice(0, 6)
        .map((t) => `<span class="lux-wc-chip">${esc(t)}</span>`)
        .join("");
    } else {
      exBlock.style.display = "none";
      exRow.innerHTML = "";
    }

    // Recents list
    const recList = overlay.querySelector("#luxWcRecentsList");
    const recents = Array.isArray(state.recents) ? state.recents : [];
    if (!recents.length) {
      recList.innerHTML = `<div class="lux-wc-empty">No recent attempts found for this item yet.</div>`;
    } else {
      recList.innerHTML = recents
        .slice(0, 6)
        .map(
          (r, i) => `
          <button class="lux-wc-recentRow" data-open-attempt="${i}">
            <div class="lux-wc-recentTop">
              <span class="lux-wc-recentTitle">${esc(r.title || "Attempt")}</span>
              <span class="lux-wc-recentScore">${safePct(r.score)}</span>
            </div>
            <div class="lux-wc-recentSub">${esc(r.when || "")}</div>
          </button>
        `
        )
        .join("");
    }

    // Details
    const det = overlay.querySelector("#luxWcDetailsInner");
    det.innerHTML = `
      <div class="lux-wc-kv"><b>Kind:</b> ${esc(state.kind)}</div>
      <div class="lux-wc-kv"><b>ID:</b> ${esc(state.id)}</div>
      ${
        state.days != null
          ? `<div class="lux-wc-kv"><b>Days seen:</b> ${esc(state.days)}</div>`
          : ``
      }
      ${
        state.priority != null
          ? `<div class="lux-wc-kv"><b>Priority:</b> ${esc(state.priority)}</div>`
          : ``
      }
    `;

    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-open");
  }

  function close() {
    if (!overlay) return;
    overlay.setAttribute("aria-hidden", "true");
    overlay.classList.remove("is-open");
    state = null;
  }

  return { open, close };
}