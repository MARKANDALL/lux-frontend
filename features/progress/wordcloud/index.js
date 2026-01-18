// features/progress/wordcloud/index.js
import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";
import { computeRollups } from "../rollups.js";
import { renderWordCloudCanvas } from "./render-canvas.js";
import { ensureWordCloudLibs } from "./libs.js";

const ROOT_ID = "wordcloud-root";

// Reasonable refresh interval (only while on this page)
const AUTO_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
const TOP_N = 20;

export async function initWordCloudPage() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  // ✅ Header + toggle pills (Words / Phonemes)
  root.innerHTML = `
    <section class="lux-wc-shell">
      <div class="lux-wc-head">
        <div>
          <div class="lux-wc-title">☁️ Cloud Visuals</div>
          <div class="lux-wc-sub">
            Size = frequency · Color = difficulty (Lux scoring)
          </div>
        </div>

        <div class="lux-wc-actions">
          <div class="lux-wc-toggle" role="tablist" aria-label="Cloud mode">
            <button class="lux-wc-pill is-active" data-mode="words">Words</button>
            <button class="lux-wc-pill" data-mode="phonemes">Phonemes</button>
          </div>

          <button class="lux-pbtn" id="luxWcRefresh">Refresh</button>
          <button class="lux-pbtn lux-pbtn--ghost" id="luxWcBack">← Back</button>
        </div>
      </div>

      <div class="lux-wc-body">
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

  const btnRefresh = root.querySelector("#luxWcRefresh");
  const btnBack = root.querySelector("#luxWcBack");

  // ✅ Toggle state
  let _mode = "words"; // "words" | "phonemes"

  btnBack?.addEventListener("click", () => {
    window.location.assign("./progress.html");
  });

  async function loadAndDraw() {
    meta.textContent = "Loading…";

    // ✅ Lazy-load D3 + cloud layout ONLY on this page
    const ok = await ensureWordCloudLibs();
    if (!ok) {
      meta.textContent =
        "Word Cloud libraries not found. Add /public/vendor/d3.v7.min.js + /public/vendor/d3.layout.cloud.js";
      return;
    }

    const uid = ensureUID();
    const attempts = await fetchHistory(uid);

    // ✅ Use existing rollups model (same data + same scoring)
    const model = computeRollups(attempts);

    // ✅ Pick items based on current mode
    const items =
      _mode === "phonemes"
        ? (model?.trouble?.phonemesAll || []).slice(0, TOP_N)
        : (model?.trouble?.wordsAll || []).slice(0, TOP_N);

    if (!items.length) {
      meta.textContent =
        _mode === "phonemes"
          ? "Not enough phoneme data yet — do a little more practice first."
          : "Not enough word data yet — do a little more practice first.";
      renderWordCloudCanvas(canvas, []); // clears
      return;
    }

    renderWordCloudCanvas(canvas, items);

    const label = _mode === "phonemes" ? "Phonemes" : "Words";
    meta.textContent = `Updated ${new Date().toLocaleString()} · ${label} · Showing top ${items.length}`;
  }

  btnRefresh?.addEventListener("click", loadAndDraw);

  // ✅ Wire pills (right under the button hooks)
  const pills = Array.from(root.querySelectorAll(".lux-wc-pill"));

  function setMode(next) {
    _mode = next;
    pills.forEach((b) => b.classList.toggle("is-active", b.dataset.mode === next));
    loadAndDraw();
  }

  pills.forEach((b) => {
    b.addEventListener("click", () => setMode(b.dataset.mode));
  });

  // First render
  await loadAndDraw();

  // Auto refresh while on this page
  setInterval(() => {
    // only refresh if still on wordcloud page
    if (document.getElementById(ROOT_ID)) loadAndDraw();
  }, AUTO_REFRESH_MS);
}
