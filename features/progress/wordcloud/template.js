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
      </div>

      <div class="lux-wc-body">
        <div class="wcDock" data-wc-dock>

          <!-- =========================
               LEFT DRAWER (Explore)
          ========================== -->
          <aside class="wcDrawer wcDrawer--left" data-wc-drawer="left">
            <button
              class="wcDrawerTab"
              data-wc-drawer-toggle="left"
              data-tip="Show/hide filters"
              title="Show/hide filters"
              aria-expanded="true"
            >
              ◀
            </button>

            <div class="wcDrawerPanel">
              <div class="wcDrawerHeader">Explore</div>
              <div class="wcDrawerBody">

                <!-- Search -->
                <div class="lux-wc-search">
                  <input
                    id="luxWcSearch"
                    type="search"
                    placeholder="Search cloud…"
                    autocomplete="off"
                    data-tip="Filter targets by typing part of a word/phoneme."
                    title="Filter targets by typing part of a word/phoneme."
                  />
                  <button
                    class="lux-wc-clear"
                    id="luxWcClear"
                    data-tip="Clear search filter."
                    title="Clear search filter."
                  >✕</button>
                </div>

                <!-- Sort -->
                <div class="lux-wc-chipBar" aria-label="Sort">
                  <button
                    id="luxWcSortPriority"
                    class="lux-wc-chipBtn"
                    data-sort="priority"
                    data-tip="Best overall targets (difficulty + frequency + persistence)."
                    title="Best overall targets (difficulty + frequency + persistence)."
                  >Priority</button>

                  <button
                    id="luxWcSortFrequent"
                    class="lux-wc-chipBtn"
                    data-sort="freq"
                    data-tip="Most used targets (highest frequency)."
                    title="Most used targets (highest frequency)."
                  >Frequent</button>

                  <button
                    id="luxWcSortDifficult"
                    class="lux-wc-chipBtn"
                    data-sort="diff"
                    data-tip="Hardest targets (lowest score)."
                    title="Hardest targets (lowest score)."
                  >Difficult</button>

                  <button
                    id="luxWcSortRecent"
                    class="lux-wc-chipBtn"
                    data-sort="recent"
                    data-tip="Targets you struggled with most recently."
                    title="Targets you struggled with most recently."
                  >Recent</button>

                  <button
                    id="luxWcSortPersistent"
                    class="lux-wc-chipBtn"
                    data-sort="persist"
                    data-tip="Targets you keep missing over time."
                    title="Targets you keep missing over time."
                  >Persistent</button>
                </div>

                <!-- Range -->
                <div class="lux-wc-chipBar" aria-label="Time range">
                  <button
                    id="luxWcRangeAll"
                    class="lux-wc-chipBtn"
                    data-range="all"
                    data-tip="Use your full history."
                    title="Use your full history."
                  >All time</button>

                  <button
                    id="luxWcRange30d"
                    class="lux-wc-chipBtn"
                    data-range="30d"
                    data-tip="Only include the last 30 days."
                    title="Only include the last 30 days."
                  >30d</button>

                  <button
                    id="luxWcRange7d"
                    class="lux-wc-chipBtn"
                    data-range="7d"
                    data-tip="Only include the last 7 days."
                    title="Only include the last 7 days."
                  >7d</button>

                  <button
                    id="luxWcRangeToday"
                    class="lux-wc-chipBtn"
                    data-range="today"
                    data-tip="Only include today’s attempts."
                    title="Only include today’s attempts."
                  >Today</button>

                  <button
                    id="luxWcRangeTimeline"
                    class="lux-wc-chipBtn"
                    data-range="timeline"
                    data-tip="Replay your targets through time."
                    title="Replay your targets through time."
                  >Timeline</button>
                </div>

                <!-- Timeline controls -->
                <div class="lux-wc-timelineRow" id="luxWcTimelineRow">
                  <div class="lux-wc-timelineLabel"
                    data-tip="Timeline replay settings."
                    title="Timeline replay settings."
                  >Timeline</div>

                  <div class="lux-wc-timelineGroup">
                    <div class="lux-wc-tlineMini">Window</div>
                    <input id="luxWcWin" type="range" min="7" max="60" step="1"
                      data-tip="How many days to include in the replay window."
                      title="How many days to include in the replay window."
                    />
                    <div class="lux-wc-tlineVal" id="luxWcWinVal"></div>
                  </div>

                  <div class="lux-wc-timelineGroup">
                    <div class="lux-wc-tlineMini">Ends</div>
                    <input id="luxWcPos" type="range" min="0" max="90" step="1"
                      data-tip="How many days ago the replay window ends."
                      title="How many days ago the replay window ends."
                    />
                    <div class="lux-wc-tlineVal" id="luxWcPosVal"></div>
                  </div>

                  <button class="lux-pbtn lux-pbtn--ghost" id="luxWcReplay"
                    data-tip="Play/stop timeline replay."
                    title="Play/stop timeline replay."
                  >▶ Replay</button>
                </div>

              </div>
            </div>
          </aside>


          <!-- =========================
               CENTER STAGE (Square Cloud)
          ========================== -->
          <main class="wcStage">
            <div class="wcStageCard">
              <div class="lux-wc-canvasWrap wcStageSquare" id="luxWcCanvasWrap">
                <canvas id="luxWcCanvas" class="lux-wc-canvas wcCanvas"></canvas>

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

              <div class="wcStageFooter">
                <div class="lux-wc-legend">
                  <span><span class="lux-wc-dot" style="background:#2563eb;"></span>80+ (Good)</span>
                  <span><span class="lux-wc-dot" style="background:#d97706;"></span>60–79 (Warn)</span>
                  <span><span class="lux-wc-dot" style="background:#dc2626;"></span>&lt;60 (Needs work)</span>
                </div>

                <div id="luxWcMeta" style="margin-top:10px; color:#94a3b8; font-weight:900;"></div>
              </div>
            </div>
          </main>


          <!-- =========================
               RIGHT DRAWER (Actions)
          ========================== -->
          <aside class="wcDrawer wcDrawer--right" data-wc-drawer="right">
            <button
              class="wcDrawerTab"
              data-wc-drawer-toggle="right"
              data-tip="Show/hide actions"
              title="Show/hide actions"
              aria-expanded="true"
            >
              ▶
            </button>

            <div class="wcDrawerPanel">
              <div class="wcDrawerHeader">Actions</div>
              <div class="wcDrawerBody">

                <!-- Mode -->
                <div class="lux-wc-toggle" role="tablist" aria-label="Cloud mode">
                  <button
                    id="luxWcModeWords"
                    class="lux-wc-pill"
                    data-mode="words"
                    data-tip-pos="down"
                    data-tip="Show word targets (size = frequency, color = difficulty)."
                    title="Show word targets (size = frequency, color = difficulty)."
                  >Words</button>

                  <button
                    id="luxWcModePhonemes"
                    class="lux-wc-pill"
                    data-mode="phonemes"
                    data-tip-pos="down"
                    data-tip="Show sound targets (phonemes) instead of words."
                    title="Show sound targets (phonemes) instead of words."
                  >Phonemes</button>
                </div>

                <!-- Top actions -->
                <div class="lux-wc-actions">
                  <button class="lux-pbtn lux-pbtn--ghost" id="luxWcThemeToggle"
                    data-tip="Toggle theme."
                    title="Toggle theme."
                  >🌙</button>

                  <button class="lux-pbtn" id="luxWcRefresh"
                    data-tip="Reload history and redraw the cloud."
                    title="Reload history and redraw the cloud."
                  >Refresh</button>

                <!-- Power row -->
                <div class="lux-wc-powerRow">
                  <button class="lux-pbtn lux-wc-genTop" id="luxWcGenTop"
                    data-tip="Start a drill from your top 3 targets."
                    title="Start a drill from your top 3 targets."
                  >✨ Generate from Top 3</button>

                  <button class="lux-pbtn lux-pbtn--ghost lux-wc-powerBtn" id="luxWcCluster"
                    data-tip="Group targets into clusters."
                    title="Group targets into clusters."
                  >🧩 Cluster</button>

                  <button class="lux-pbtn lux-pbtn--ghost lux-wc-powerBtn" id="luxWcSnapshot"
                    data-tip="Save an image of the current cloud."
                    title="Save an image of the current cloud."
                  >📷 Snapshot</button>
                </div>

                <!-- Mix -->
                <div class="lux-wc-mixRow" aria-label="Top target mix">
                  <span class="lux-wc-mixLabel"
                    data-tip="How Top 3 is chosen."
                    title="How Top 3 is chosen."
                  >Top 3:</span>

                  <button class="lux-wc-chipBtn" id="luxWcMixView" data-mix="view"
                    data-tip="Pick Top 3 from what’s currently visible."
                    title="Pick Top 3 from what’s currently visible."
                  >View-based</button>

                  <button class="lux-wc-chipBtn" id="luxWcMixSmart" data-mix="smart"
                    data-tip="Pick Top 3 using your priority formula."
                    title="Pick Top 3 using your priority formula."
                  >Smart Mix</button>
                </div>

                <!-- Strips -->
                <div class="lux-wc-targetStrip" id="luxWcTargets"
                  data-tip="Your Top 3 targets (click one to open details)."
                  title="Your Top 3 targets (click one to open details)."
                ></div>

                <div class="lux-wc-savedStrip" id="luxWcSaved"
                  data-tip="Pinned targets you’ve saved for focus."
                  title="Pinned targets you’ve saved for focus."
                ></div>

                <!-- Coach lane -->
                <div class="lux-wc-coachLane" id="luxWcCoach">
                  <div class="lux-wc-coachTitle"
                    data-tip="Quick actions for targeted practice."
                    title="Quick actions for targeted practice."
                  >Coach Lane</div>

                  <div class="lux-wc-coachBtns">
                    <button class="lux-pbtn" id="luxWcCoachQuick"
                      data-tip="Generate a fast drill using pinned/top targets."
                      title="Generate a fast drill using pinned/top targets."
                    >⚡ Quick drill</button>

                    <button class="lux-pbtn lux-pbtn--ghost" id="luxWcCoachPinTop"
                      data-tip="Pin the current Top 3 targets."
                      title="Pin the current Top 3 targets."
                    >📌 Pin Top 3</button>
                  </div>

                  <div class="lux-wc-coachHint" id="luxWcCoachHint"></div>
                </div>

              </div>
            </div>
          </aside>

        </div>
      </div>
    </section>
  `;
}
