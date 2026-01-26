// features/features/selfpb/dom.js
// ✅ VERBATIM extraction of buildUI() from features/features/selfpb/ui.GOLD
// Only change: export added at bottom

function buildUI() {
  const host = document.createElement("div");
  host.id = "selfpb-lite";

  host.innerHTML = `
    <div class="row" style="margin-bottom:6px; position:relative;">
      <span
        id="spb-toast"
        class="pill tiny"
        style="display:none; position:absolute; right:0; top:0; ...color:#fff; z-index:10; box-shadow: 0 2px 10px rgba(0,0,0,0.5);"
      ></span>

      <button id="spb-expand" class="spb-miniBtn" title="Expand Self Playback">
        Expand
      </button>

      <div class="spacer"></div>
      <span class="pill tiny" id="spb-ref">Ref: —</span>
      <span class="pill tiny" id="spb-time">0:00 / 0:00</span>
    </div>

    <div class="spb-body">

      <!-- wave -->
      <div id="spb-wavebox" class="spb-wavebox">
        <div id="spb-waveform-container">
          <div id="spb-wave-learner"></div>
        </div>
      </div>

      <!-- karaoke -->
      <div id="spb-karaokeWrap">
        <div class="spb-karaokeTitle">Words</div>

        <div id="spb-karaokeLaneWrap">
          <div id="spb-karaokeCursor"></div>
          <div id="spb-karaokeLane"></div>
        </div>

        <div id="spb-kCenterWrap">
          <div id="spb-kCenterTrack"></div>
        </div>
      </div>

      <!-- scrub -->
      <div class="row spb-row" style="margin-top:10px;">
        <input id="spb-scrub" class="spb-scrub" type="range" min="0" max="1000" value="0" />
      </div>

      <!-- controls -->
      <div class="row spb-row" style="margin-top:10px; justify-content:space-between;">
        <div class="row" style="gap:8px;">
          <button class="btn" id="spb-main" disabled>Play</button>
          <button class="btn gray" id="spb-back">-2s</button>
          <button class="btn gray" id="spb-fwd">+2s</button>
        </div>

        <div class="row" style="gap:8px;">
          <span class="mini-label">Rate</span>
          <input id="spb-rate" type="range" min="0.5" max="1.25" step="0.05" value="1" style="width:120px;" />
          <span class="mini-label" id="spb-rate-val">1.00×</span>
        </div>
      </div>

      <!-- loop -->
      <div class="row spb-row" id="spb-loop-row" style="margin-top:10px; justify-content:space-between;">
        <div class="row" style="gap:8px;">
          <button class="btn gray" id="spb-loop-action">Set Loop A</button>
          <span class="ghost-note" id="spb-loop-tip">Tip: highlight a word to loop</span>
        </div>

        <div class="row" style="gap:8px;">
          <span class="mini-label" id="spb-loop-slot"></span>
          <span class="mini-label" id="spb-ab-label">Loop: Off</span>
        </div>
      </div>

      <!-- ref wave -->
      <div id="spb-wave-ref" style="margin-top:10px;"></div>

      <!-- download + trash -->
      <div class="row spb-row" style="margin-top:10px; justify-content:flex-end; gap:8px;">
        <button class="btn ic" id="spb-dl" disabled title="Download latest recording">⬇</button>
        <button class="btn ic red" id="spb-trash" disabled title="Delete recording">🗑</button>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  // ✅ Expanded floating window (create once)
  let float = document.getElementById("spb-float");
  if (!float) {
    float = document.createElement("div");
    float.id = "spb-float";
    float.innerHTML = `
      <div id="spb-floatCard">
        <div id="spb-floatTop">
          <div id="spb-floatTitle">Self Playback — Expanded</div>
          <button id="spb-floatClose" type="button">✕</button>
        </div>
        <div id="spb-floatMount"></div>
      </div>
    `;
    document.body.appendChild(float);
  }

  // expanded wiring
  const floatHead = float.querySelector("#spb-floatTop");
  const floatClose = float.querySelector("#spb-floatClose");
  const floatMount = float.querySelector("#spb-floatMount");

  const expandBtn = host.querySelector("#spb-expand");
  const body = host.querySelector(".spb-body");
  const bodyHome = body.parentElement;
  let bodyNext = body.nextSibling;

  const loopLabel = host.querySelector("#spb-ab-label");
  const loopRow = host.querySelector("#spb-loop-row");
  const loopSlot = host.querySelector("#spb-loop-slot");

  function openExpanded() {
    bodyNext = body.nextSibling; // ✅ re-capture in case DOM changes
    float.classList.add("is-open");
    floatMount.appendChild(body);

    // move Loop label into speed row slot (expanded only)
    if (loopSlot && loopLabel) loopSlot.appendChild(loopLabel);

    // show karaoke block in expanded only
    const kw = host.querySelector("#spb-karaokeWrap");
    if (kw) kw.style.display = "block";

    window.dispatchEvent(new CustomEvent("lux:selfpbExpandedOpen"));
  }

  function closeExpanded() {
    float.classList.remove("is-open");
    if (bodyNext) bodyHome.insertBefore(body, bodyNext);
    else bodyHome.appendChild(body);

    // move Loop label back where it lives in compact
    if (loopRow && loopLabel) loopRow.appendChild(loopLabel);

    const kw = host.querySelector("#spb-karaokeWrap");
    if (kw) kw.style.display = "none";
  }

  expandBtn.addEventListener("click", () => {
    if (float.classList.contains("is-open")) closeExpanded();
    else openExpanded();
  });

  floatClose?.addEventListener("click", closeExpanded);

  // ✅ Drag floating expanded window
  let dragOn = false;
  let dragOffX = 0;
  let dragOffY = 0;

  floatHead.addEventListener("pointerdown", (e) => {
    // prevent dragging when clicking the close button
    if (e.target && e.target.id === "spb-floatClose") return;

    dragOn = true;
    const r = float.getBoundingClientRect();

    // convert from centered transform layout -> absolute
    float.style.alignItems = "flex-start";
    float.style.justifyContent = "flex-start";
    float.style.padding = "0";
    float.style.background = "rgba(0,0,0,0.42)";

    // card becomes absolute
    const card = float.querySelector("#spb-floatCard");
    card.style.position = "absolute";
    card.style.left = `${r.left}px`;
    card.style.top = `${r.top}px`;

    dragOffX = e.clientX - r.left;
    dragOffY = e.clientY - r.top;

    float.setPointerCapture(e.pointerId);
  });

  float.addEventListener("pointermove", (e) => {
    if (!dragOn) return;
    const card = float.querySelector("#spb-floatCard");

    let x = e.clientX - dragOffX;
    let y = e.clientY - dragOffY;

    // clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cr = card.getBoundingClientRect();

    x = Math.max(0, Math.min(vw - cr.width, x));
    y = Math.max(0, Math.min(vh - cr.height, y));

    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
  });

  float.addEventListener("pointerup", (e) => {
    dragOn = false;
    try { float.releasePointerCapture(e.pointerId); } catch(e) {}
  });

  return {
    host,
    toast: host.querySelector("#spb-toast"),
    mainBtn: host.querySelector("#spb-main"),
    dlBtn: host.querySelector("#spb-dl"),
    backBtn: host.querySelector("#spb-back"),
    fwdBtn: host.querySelector("#spb-fwd"),
    scrub: host.querySelector("#spb-scrub"),
    rate: host.querySelector("#spb-rate"),
    rateVal: host.querySelector("#spb-rate-val"),
    timeLab: host.querySelector("#spb-time"),
    loopAction: host.querySelector("#spb-loop-action"),
    loopTip: host.querySelector("#spb-loop-tip"),
    abLabel: host.querySelector("#spb-ab-label"),
    refLabel: host.querySelector("#spb-ref"),
    waveLearner: host.querySelector("#spb-wave-learner"),
    waveRef: host.querySelector("#spb-wave-ref"),
    karaokeWrap: host.querySelector("#spb-karaokeWrap"),
    karaokeLaneWrap: host.querySelector("#spb-karaokeLaneWrap"),
    karaokeLane: host.querySelector("#spb-karaokeLane"),
    karaokeCursor: host.querySelector("#spb-karaokeCursor"),
    kCenterWrap: host.querySelector("#spb-kCenterWrap"),
    kCenterTrack: host.querySelector("#spb-kCenterTrack"),
  };
}

export { buildUI };
