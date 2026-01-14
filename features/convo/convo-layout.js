// features/convo/convo-layout.js
// Builds the convo UI skeleton and returns DOM handles.
// No event wiring here — index.js remains the orchestrator.

export function buildConvoLayout({ root, el, mode, sessionId }) {
  // --- Layout (single stage) ---
  root.innerHTML = "";
  root.dataset.mode = mode || "intro";
  root.dataset.side = "left";

  const atmo = el("div", "lux-atmo");
  atmo.innerHTML = `
    <div class="lux-atmo-layer a"></div>
    <div class="lux-atmo-layer b"></div>

    <div class="lux-scene-cards" aria-hidden="true">
      <div class="lux-scene-card c1"></div>
      <div class="lux-scene-card c2"></div>
      <div class="lux-scene-card c3"></div>
      <div class="lux-scene-card c4"></div>
      <div class="lux-scene-card c5"></div>
      <div class="lux-scene-card c6"></div>
      <div class="lux-scene-card c7"></div>
      <div class="lux-scene-card c8"></div>
      <div class="lux-scene-card c9"></div>
      <div class="lux-scene-card c10"></div>
      <div class="lux-scene-card c11"></div>
    </div>

    <div class="lux-atmo-fog"></div>
  `;

  const ui = el("div", "lux-ui");

  // Intro overlay
  const intro = el("div", "lux-intro");
  const hero = el("div", "lux-heroCard");

  // NOTE: build hero sub as nodes so we can wrap underline spans
  const heroSub = el("div", "lux-heroSub");
  heroSub.append(
    "Pick a dialogue. Record your reply. We assess each turn silently and give you a ",
    el("span", "lux-uline u1", "session report"),
    " at the end. Then take your results to the ",
    el("span", "lux-uline u2", "Practice Skills"),
    " page to review them in detail."
  );

  hero.append(el("div", "lux-heroTitle", "AI Conversations"), heroSub);

  const heroNext = el("button", "lux-heroNext", "Next");
  hero.append(heroNext);
  intro.append(hero);

  // Picker overlay (Edge deck)
  const picker = el("div", "lux-picker");

  // Return link (ONLY appears in picker mode because it lives inside .lux-picker)
  const pickerToplinks = el("div", "lux-toplinks");
  const pickerHome = el("a", "lux-toplink lux-navpill", "Practice Skills");
  pickerHome.href = "./index.html";
  pickerHome.setAttribute("data-lux-ripple", "");
  pickerToplinks.append(pickerHome);

  const deck = el("div", "lux-deck");
  const deckActive = el("div", "lux-deck-card is-active");
  const deckPreview = el("div", "lux-deck-card is-preview");
  deck.append(deckActive, deckPreview);

  const thumbs = el("div", "lux-thumbs");

  /* NEW: picker knobs row */
  const pickerKnobsRow = el("div", "lux-pickerKnobsRow");
  const pickerKnobsBtn = el("button", "btn ghost", "Knobs");
  const pickerKnobsSummary = el("div", "lux-pickerKnobsSummary", "");
  pickerKnobsRow.append(pickerKnobsBtn, pickerKnobsSummary);

  const nav = el("div", "lux-deckNav");
  const backBtn = el("button", "lux-navArrow", "← Back");
  const nextBtn = el("button", "lux-navNext", "Next →");
  nav.append(backBtn, nextBtn);

  /* IMPORTANT: insert knobs row between thumbs and nav */
  picker.append(pickerToplinks, deck, thumbs, pickerKnobsRow, nav);

  // Chat panel (single centered)
  const chatWrap = el("div", "lux-chatwrap");
  const mid = el("div", "lux-panel lux-chat");

  const midHd = el("div", "lux-hd");
  const titleWrap = el("div");
  const title = el("div", "lux-title", "AI Conversation");
  const sub = el("div", "lux-sub", `Session: ${sessionId}`);
  titleWrap.append(title, sub);

  const actions = el("div", "lux-actions");

  // Return link (ONLY appears in chat mode because it lives inside the chat header)
  const chatHome = el("a", "btn ghost", "Practice Skills");
  chatHome.href = "./index.html";
  chatHome.setAttribute("data-lux-ripple", "");

  const scenBtn = el("button", "btn ghost", "Scenarios");
  const knobsBtn = el("button", "btn ghost", "Knobs");
  const endBtn = el("button", "btn danger", "End Session");
  actions.append(chatHome, scenBtn, knobsBtn, endBtn);

  midHd.append(titleWrap, actions);

  const msgs = el("div", "lux-msgs");
  const sugs = el("div", "lux-sugs");
  const sugsNote = el("div", "lux-sugsNote");
  const coachBar = el("div", "lux-coachbar");

  const compose = el("div", "lux-compose");
  const input = document.createElement("textarea");
  input.className = "lux-in";
  input.placeholder = "Type or click a suggestion, then record your reply…";

  const talkBtn = el("button", "btn primary", "🎙 Record");
  compose.append(input, talkBtn);

  mid.append(midHd, coachBar, msgs, sugsNote, sugs, compose);

  // =========================================================
  // Stage wrapper (anchors docked knobs + local scrim to the chat box)
  // =========================================================
  const stage = el("div", "lux-convoStage");
  stage.id = "convoStage";
  stage.append(mid);

  // Local scrim (dims ONLY the convo box area)
  const scrim = el("button", "lux-knobsScrim");
  scrim.type = "button";
  scrim.setAttribute("aria-label", "Close scene knobs");
  stage.append(scrim);

  // Dock host (lives to the RIGHT of the convo box)
  const knobsDock = el("div", "lux-knobsDock");
  knobsDock.id = "convoKnobsDock";
  stage.append(knobsDock);

  chatWrap.append(stage);

  // Knobs drawer
  const drawer = el("div", "lux-drawer");
  const drawerHd = el("div", "lux-drawerHd");
  drawerHd.append(el("div", "lux-title", "Scene knobs"));
  const closeDrawer = el("button", "btn ghost", "Close");
  drawerHd.append(closeDrawer);

  const drawerBody = el("div", "lux-body k");
  const toneSel = mkSelect(el, "Tone", ["friendly", "neutral", "playful", "formal", "flirty"]);
  const stressSel = mkSelect(el, "Stress", ["low", "medium", "high"]);
  const paceSel = mkSelect(el, "Pace", ["slow", "normal", "fast"]);
  drawerBody.append(toneSel.wrap, stressSel.wrap, paceSel.wrap);
  drawerBody.append(
    el(
      "div",
      "lux-sub",
      "Feedback stays hidden during the conversation. We log each spoken turn silently, then summarize at the end."
    )
  );

  drawer.append(drawerHd, drawerBody);

  // Dock the drawer to the convo box (not viewport)
  knobsDock.append(drawer);

  // Progress panel host (ONLY visible in chat mode via CSS)
  const convoProgress = el("div", "lux-convo-progress");
  convoProgress.id = "convoProgress";

  // =========================================================
  // AI Coach: always visible (no button), placed between chat + progress
  // Move existing #aiFeedbackSection (from convo.html) into this stack.
  // =========================================================
  const aiCoachSection = document.getElementById("aiFeedbackSection");
  if (aiCoachSection) {
    aiCoachSection.style.display = ""; // remove inline display:none if present
    aiCoachSection.style.marginTop = ""; // let CSS handle spacing
  }

  // IMPORTANT: append progress AFTER chatWrap so it sits under the chat panel
  if (aiCoachSection) ui.append(intro, picker, chatWrap, aiCoachSection, convoProgress);
  else ui.append(intro, picker, chatWrap, convoProgress);

  root.append(atmo, ui);

  return {
    atmo,
    ui,
    intro,
    heroNext,
    picker,
    deckActive,
    deckPreview,
    thumbs,
    pickerKnobsBtn,
    pickerKnobsSummary,
    backBtn,
    nextBtn,
    chatWrap,
    mid,
    stage,
    knobsDock,
    scenBtn,
    knobsBtn,
    endBtn,
    msgs,
    sugs,
    sugsNote,
    coachBar,
    input,
    talkBtn,
    drawer,
    closeDrawer,
    scrim,
    convoProgress,
    toneSel,
    stressSel,
    paceSel,
  };
}

function mkSelect(el, label, options) {
  const wrap = el("div");
  const lab = el("label", null, label);
  const sel = document.createElement("select");
  options.forEach((o) => {
    const opt = document.createElement("option");
    opt.value = o;
    opt.textContent = o;
    sel.append(opt);
  });
  wrap.append(lab, sel);
  return { wrap, sel };
}
