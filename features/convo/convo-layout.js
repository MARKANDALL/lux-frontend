// features/convo/convo-layout.js
// Builds the convo UI skeleton and returns DOM handles.
// No event wiring here — index.js remains the orchestrator.

import { attachClickRipple } from "../../ui/ui-click-ripple.js";

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

  // --- Mode chooser (hub) ---
  const heroModes = el("div", "lux-heroModes");

  const guidedBtn = el("button", "lux-heroNext", "Guided (Decks)");
  guidedBtn.type = "button";
  guidedBtn.setAttribute("data-lux-ripple", "");

  const streamLink = el("a", "lux-heroNext lux-heroNext--ghost", "Streaming (Real-time)");
  streamLink.href = "./stream-setup.html";
  streamLink.setAttribute("data-lux-ripple", "");

  const lifeLink = el("a", "lux-heroNext lux-heroNext--ghost", "Life Journey (Game)");
  lifeLink.href = "./life.html";
  lifeLink.setAttribute("data-lux-ripple", "");

  heroModes.append(guidedBtn, streamLink, lifeLink);
  hero.append(heroModes);
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

  /* Summary badge — centered ABOVE the deck cards */
  const pickerKnobsSummary = el("div", "lux-pickerKnobsSummary", "");

  /* Single bottom row: Characters | ← Back | Next → | Scene Settings */
  const pickerNavRow = el("div", "lux-pickerNavRow");
  const pickerCharsBtn = el("button", "btn ghost lux-pickerNavSide", "🎭 Characters");
  const backBtn = el("button", "lux-navArrow", "← Back");
  const nextBtn = el("button", "lux-navNext", "Next →");
  const pickerKnobsBtn = el("button", "btn ghost lux-pickerNavSide", "⚙️ Scene Settings");
  pickerNavRow.append(pickerCharsBtn, backBtn, nextBtn, pickerKnobsBtn);

  /* Summary above deck, single button row below thumbs */
  picker.append(pickerToplinks, pickerKnobsSummary, deck, thumbs, pickerNavRow);

  // Chat panel (single centered)
  const chatWrap = el("div", "lux-chatwrap");

  // NEW: Chat mode top links (pill ABOVE the convo panel)
  const chatToplinks = el("div", "lux-toplinks lux-toplinks-chat");
  const chatHomePill = el("a", "lux-toplink lux-navpill", "Practice Skills");
  chatHomePill.href = "./index.html";
  chatHomePill.setAttribute("data-lux-ripple", "");
  chatHomePill.setAttribute("data-lux-ripple", "");
  chatToplinks.append(chatHomePill);

  const mid = el("div", "lux-panel lux-chat");

  const midHd = el("div", "lux-hd");
  const titleWrap = el("div");
  const title = el("div", "lux-title", "AI Conversation");
  const sub = el("div", "lux-sub", `Session: ${sessionId}`);
  titleWrap.append(title, sub);

  const actions = el("div", "lux-actions");

  const scenBtn = el("button", "btn ghost", "Scenarios");
  const knobsBtn = el("button", "btn ghost", "⚙️ Settings");
  const endBtn = el("button", "btn danger", "End Session");
  attachClickRipple(endBtn);
  actions.append(scenBtn, knobsBtn, endBtn);

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

  // Floating portraits (NOT drawers)
  const portraits = el("div", "lux-convoPortraits");

  const meChip = el("div", "lux-portraitChip lux-portraitChip--me");
  const meImg = document.createElement("img");
  meImg.className = "lux-portraitImg";
  meImg.alt = "You";
  meImg.loading = "lazy";
  meImg.decoding = "async";
  const meBadge = el("div", "lux-portraitBadge", "YOU");
  meChip.append(meImg, meBadge);

  const aiChip = el("div", "lux-portraitChip lux-portraitChip--ai");
  const aiImg = document.createElement("img");
  aiImg.className = "lux-portraitImg";
  aiImg.alt = "AI";
  aiImg.loading = "lazy";
  aiImg.decoding = "async";

  // thinking dots overlay
  const aiDots = el("div", "lux-portraitDots");
  aiDots.innerHTML = `<span></span><span></span><span></span>`;

  const aiBadge = el("div", "lux-portraitBadge", "AI");
  aiChip.append(aiImg, aiDots, aiBadge);

  portraits.append(meChip, aiChip);
  stage.append(portraits);

  // Local scrim (dims ONLY the convo box area)
  const scrim = el("button", "lux-knobsScrim");
  scrim.type = "button";
  scrim.setAttribute("aria-label", "Close scene knobs");
  stage.append(scrim);

  // Dock host (lives to the RIGHT of the convo box)
  const knobsDock = el("div", "lux-knobsDock");
  knobsDock.id = "convoKnobsDock";
  stage.append(knobsDock);

  // NEW: include chatToplinks ABOVE the stage (outside the panel)
  chatWrap.append(chatToplinks, stage);

  // Knobs drawer
  const drawer = el("div", "lux-drawer");
  const drawerHd = el("div", "lux-drawerHd");
  drawerHd.append(el("div", "lux-title", "Scene Settings"));
  const closeDrawer = el("button", "btn ghost", "Close");
  drawerHd.append(closeDrawer);

  const drawerBody = el("div", "lux-body k");
  const levelSel = mkSelect(el, "Level", ["A1", "A2", "B1", "B2", "C1", "C2"]);
  const toneSel = mkSelect(el, "Tone", [
    "neutral", "formal", "friendly", "enthusiastic", "encouraging",
    "playful", "flirty", "sarcastic",
    "tired", "distracted", "cold", "blunt",
    "impatient", "irritable", "angry", "emotional",
  ]);
  const lengthSel = mkSelect(el, "Length", ["terse", "short", "medium", "long", "extended"]);
  drawerBody.append(levelSel.wrap, toneSel.wrap, lengthSel.wrap);
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
  // Move existing #aiCoachDrawer (from convo.html) into this stack.
  // Fallback: move #aiFeedbackSection if drawer not present (older markup).
  // =========================================================
  const aiCoachDrawer = document.getElementById("aiCoachDrawer");
  const aiCoachSection = document.getElementById("aiFeedbackSection");
  const aiCoachEl = aiCoachDrawer || aiCoachSection;

  if (aiCoachEl) {
    aiCoachEl.style.display = ""; // remove inline display:none if present
    aiCoachEl.style.marginTop = ""; // let CSS handle spacing
  }

  // IMPORTANT: append progress AFTER chatWrap so it sits under the chat panel
  if (aiCoachEl) ui.append(intro, picker, chatWrap, aiCoachEl, convoProgress);
  else ui.append(intro, picker, chatWrap, convoProgress);

  root.append(atmo, ui);

  return {
    atmo,
    ui,
    intro,
    guidedBtn,
    streamLink,
    lifeLink,
    picker,
    deckActive,
    deckPreview,
    thumbs,
    pickerCharsBtn,
    pickerKnobsBtn,
    pickerKnobsSummary,
    backBtn,
    nextBtn,
    chatWrap,
    mid,
    stage,
    portraits,
    meImg,
    aiImg,
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
    levelSel,
    toneSel,
    lengthSel,
  };
}

function mkSelect(el, label, options) {
  const wrap = el("div");
  const lab = el("label", null, label);
  const sel = document.createElement("select");
  options.forEach((o) => {
    const opt = document.createElement("option");
    opt.value = o;
    opt.textContent = o.charAt(0).toUpperCase() + o.slice(1);
    sel.append(opt);
  });
  wrap.append(lab, sel);
  return { wrap, sel };
}