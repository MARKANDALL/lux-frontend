// features/progress/wordcloud/template.js
// ✅ Wordcloud HTML template extracted from index.js

export function wordcloudTemplateHtml() {
  return `
    <section class="lux-wc-shell" id="luxWcShell">
      <div class="lux-wc-head">
        <div>
          <div class="lux-wc-title">☁️ Cloud Visuals</div>
          <div class="lux-wc-sub" id="luxWcSub">
            Size = frequency · Color = difficulty (Lux scoring)
          </div>
        </div>

        <div class="lux-wc-actions">
          <div class="lux-wc-toggle" role="tablist" aria-label="Cloud mode">
            <button class="lux-wc-pill" data-mode="words">Words</button>
            <button class="lux-wc-pill" data-mode="phonemes">Phonemes</button>
          </div>

          <button class="lux-pbtn lux-pbtn--ghost" id="luxWcThemeToggle" title="Toggle theme">🌙</button>
          <button class="lux-pbtn" id="luxWcRefresh">Refresh</button>
          <button class="lux-pbtn lux-pbtn--ghost" id="luxWcBack">← Back</button>
        </div>
      </div>

      <div class="lux-wc-body">
        <div class="lux-wc-controls">
          <div class="lux-wc-search">
            <input id="luxWcSearch" type="search" placeholder="Search cloud…" autocomplete="off" />
            <button class="lux-wc-clear" id="luxWcClear" title="Clear">✕</button>
          </div>

          <div class="lux-wc-chipBar" aria-label="Sort">
            <button class="lux-wc-chipBtn" data-sort="priority">Priority</button>
            <button class="lux-wc-chipBtn" data-sort="freq">Frequent</button>
            <button class="lux-wc-chipBtn" data-sort="diff">Difficult</button>
            <button class="lux-wc-chipBtn" data-sort="recent">Recent</button>
            <button class="lux-wc-chipBtn" data-sort="persist">Persistent</button>
          </div>

          <div class="lux-wc-chipBar" aria-label="Time range">
            <button class="lux-wc-chipBtn" data-range="all">All time</button>
            <button class="lux-wc-chipBtn" data-range="30d">30d</button>
            <button class="lux-wc-chipBtn" data-range="7d">7d</button>
            <button class="lux-wc-chipBtn" data-range="today">Today</button>
            <button class="lux-wc-chipBtn" data-range="timeline">Timeline</button>
          </div>

          <div class="lux-wc-timelineRow" id="luxWcTimelineRow">
            <div class="lux-wc-timelineLabel">Timeline</div>

            <div class="lux-wc-timelineGroup">
              <div class="lux-wc-tlineMini">Window</div>
              <input id="luxWcWin" type="range" min="7" max="60" step="1" />
              <div class="lux-wc-tlineVal" id="luxWcWinVal"></div>
            </div>

            <div class="lux-wc-timelineGroup">
              <div class="lux-wc-tlineMini">Ends</div>
              <input id="luxWcPos" type="range" min="0" max="90" step="1" />
              <div class="lux-wc-tlineVal" id="luxWcPosVal"></div>
            </div>

            <button class="lux-pbtn lux-pbtn--ghost" id="luxWcReplay">▶ Replay</button>
          </div>

          <!-- Phase D power row -->
          <div class="lux-wc-powerRow">
            <button class="lux-pbtn lux-wc-genTop" id="luxWcGenTop">
              ✨ Generate from Top 3
            </button>

            <button class="lux-pbtn lux-pbtn--ghost lux-wc-powerBtn" id="luxWcCluster">
              🧩 Cluster
            </button>

            <button class="lux-pbtn lux-pbtn--ghost lux-wc-powerBtn" id="luxWcSnapshot">
              📷 Snapshot
            </button>
          </div>

          <!-- Phase E mix toggle -->
          <div class="lux-wc-mixRow" aria-label="Top target mix">
            <span class="lux-wc-mixLabel">Top 3:</span>
            <button class="lux-wc-chipBtn" id="luxWcMixView" data-mix="view">View-based</button>
            <button class="lux-wc-chipBtn" id="luxWcMixSmart" data-mix="smart">Smart Mix</button>
          </div>

          <div class="lux-wc-targetStrip" id="luxWcTargets"></div>
          <div class="lux-wc-savedStrip" id="luxWcSaved"></div>

          <!-- Phase E Coach Lane -->
          <div class="lux-wc-coachLane" id="luxWcCoach">
            <div class="lux-wc-coachTitle">Coach Lane</div>
            <div class="lux-wc-coachBtns">
              <button class="lux-pbtn" id="luxWcCoachQuick">⚡ Quick drill</button>
              <button class="lux-pbtn lux-pbtn--ghost" id="luxWcCoachPinTop">📌 Pin Top 3</button>
            </div>
            <div class="lux-wc-coachHint" id="luxWcCoachHint"></div>
          </div>
        </div>

        <div class="lux-wc-canvasWrap" id="luxWcCanvasWrap">
          <canvas id="luxWcCanvas" class="lux-wc-canvas"></canvas>

          <!-- Loading overlay (shows during layout + redraw) -->
          <div class="lux-wc-overlay" id="luxWcOverlay" aria-live="polite" aria-busy="true" hidden>
            <div class="lux-wc-overlayCard">
              <div class="lux-wc-spinner" aria-hidden="true"></div>
              <div class="lux-wc-overlayText">
                <div class="lux-wc-overlayTitle" id="luxWcOverlayTitle">Loading…</div>
                <div class="lux-wc-overlaySub" id="luxWcOverlaySub">Building your cloud</div>
              </div>
            </div>
          </div>
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
}
