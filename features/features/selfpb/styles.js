// features/features/selfpb/styles.js

export function ensureStyles() {
  const STYLE_ID = "selfpb-lite-style";
  if (document.getElementById(STYLE_ID)) return;

  const s = document.createElement("style");
  s.id = STYLE_ID;

  s.textContent = `
    /* Light Theme + Layout Styles */

    /* ✅ OUTER bezel: always hugs inner width perfectly */
    #selfpb-lite{
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 9999;

      /* 🔒 lock inner width into a variable so outer can wrap it */
      --spbW: min(390px, calc(100vw - 48px));

      width: calc(var(--spbW) + 24px);  /* ✅ inner + bezel */
      max-width: calc(100vw - 24px);

      padding: 10px 14px 14px 10px;     /* bezel (extra right/bottom) */
      border-radius: 18px;

      /* ✅ make bezel visible */
      background: rgba(15,23,42,0.06);
      border: 1px solid rgba(15,23,42,0.10);
      box-shadow: 0 10px 26px rgba(0,0,0,0.22);

      box-sizing: border-box;
      overflow: visible; /* ✅ don’t clip the bezel */
    }

    #selfpb-lite *{ box-sizing:border-box; }

    /* ✅ INNER panel always matches spbW */
    #selfpb-lite .spb-body{
      width: var(--spbW);
      background: #fff;
      border-radius: 16px;
      padding: 12px;
      overflow: hidden;
    }

    #selfpb-lite .row{
      display:flex;
      align-items:center;
      gap:8px;
      min-width:0;
    }

    #selfpb-lite .scrubFull{
      width:100%;
      min-width:0;
    }

    #selfpb-lite .btn{
      padding:6px 10px;
      border-radius:8px;
      border:0;
      background:#2d6cdf;
      color:#fff;
      cursor:pointer;
      transition:background 0.15s, transform 0.1s;
    }

    #selfpb-lite .btn:hover{filter:brightness(1.1);}
    #selfpb-lite .btn:active{transform:scale(0.96);}
    #selfpb-lite .btn[disabled]{opacity:.5;cursor:not-allowed}

    #selfpb-lite .btn.icon{
      width:44px;
      padding:6px 0;
      display:grid;
      place-items:center;
    }

    #selfpb-lite .pill{border-radius:999px;padding:6px 10px}
    #selfpb-lite .meta{opacity:.85}

    :is(#selfpb-lite, #spb-float) input[type="range"]{accent-color:#2d6cdf}

    #selfpb-lite .ab{display:flex;gap:6px;position:relative;}
    #selfpb-lite .tiny{font-weight:700;opacity:.8}

    /* Layout Fixes */
    #selfpb-lite .spacer{flex:1}
    #spb-main { width: 110px; font-weight: 800; font-size: 1.05em; flex-shrink: 0; }
    #spb-loop-action { min-width: 100px; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    #spb-loop-action.active { background: #4338ca; color: #fff; border-color: #312e81; }

    /* Floating "Coach Mark" Bubble */
    .spb-bubble {
      position: absolute;
      top: -38px;
      left: 0;
      background: rgba(0,0,0,0.85);
      color: #fff;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.4s;
    }
    .spb-bubble.visible { opacity: 1; }
    .spb-bubble::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 16px;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid rgba(0,0,0,0.85);
    }

    /* ✅ In expanded mode, body fills floating card */
    #spb-float .spb-body{
      width: 100% !important;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        "top top"
        "self tts";
      gap: 14px;
      align-items: start;
    }

    /* ✅ Hide the TTS mount in the small drawer */
    #selfpb-lite .spb-controls--tts{
      display:none !important;
    }

    #spb-float .spb-top{ grid-area: top; width:100%; }
    #spb-float .spb-controls--self{ grid-area: self; width:100%; }
    #spb-float .spb-controls--tts{ grid-area: tts; width:100%; display:block; }

    /* ✅ Give the waveform area real space in expanded mode */
    #spb-float .spb-wave{
      height: 240px;
    }

    /* ✅ Karaoke (Word Sync) should stretch full width */
    #spb-float #spb-karaokeWrap,
    #spb-float #spb-karaokeLaneWrap{
      width: 100%;
    }

    /* ✅ TTS card should fill its half */
    #spb-float .spb-controls--tts #tts-wrap{
      width: 100%;
      max-width: 100%;
      margin-left: 0;
    }

    /* ✅ In expanded view, the TTS expand button is redundant */
    #spb-float #tts-expand{ display:none; }

    /* ✅ Mobile: stack sections */
    @media (max-width: 980px){
      #spb-float .spb-body{
        grid-template-columns: 1fr;
        grid-template-areas:
          "top"
          "self"
          "tts";
      }
    }

    /* ✅ Prevent waveform/canvas from forcing overflow */
    :is(#selfpb-lite, #spb-float) canvas,
    :is(#selfpb-lite, #spb-float) .spb-wave,
    :is(#selfpb-lite, #spb-float) #spb-wavebox{
      max-width: 100% !important;
    }

    :is(#selfpb-lite, #spb-float) .spb-wave{
      height:92px;
      border-radius:12px;
      background: rgba(15,23,42,0.04);
      border:1px solid rgba(15,23,42,0.10);
      overflow:hidden;
      display:flex;
      align-items:center;
      justify-content:center;
    }

    /* rows */
    :is(#selfpb-lite, #spb-float) .spb-row{
      display:flex;
      align-items:center;
      gap:10px;
      min-width:0;
      width:100%;
    }

    :is(#selfpb-lite, #spb-float) .spb-row + .spb-row{ margin-top:8px; }

    :is(#selfpb-lite, #spb-float) .spb-scrub{
      width:100%;
      min-width:0;
    }

    :is(#selfpb-lite, #spb-float) .spb-btn{
      border:0;
      border-radius:10px;
      padding:8px 12px;
      font-weight:800;
      cursor:pointer;
      background:#2f6fe4;
      color:#fff;
      box-shadow:0 6px 16px rgba(0,0,0,0.12);
      white-space:nowrap;
    }

    :is(#selfpb-lite, #spb-float) .spb-btn.secondary{
      background: rgba(15,23,42,0.08);
      color: rgba(15,23,42,0.85);
      box-shadow:none;
    }

    :is(#selfpb-lite, #spb-float) .spb-btn.icon{
      width:44px;
      display:grid;
      place-items:center;
      padding:8px 0;
    }

    /* ✅ Download arrow matches TTS (blue link-style) */
    #selfpb-lite #spb-dl{
      background: transparent !important;
      box-shadow: none !important;
      border: 0 !important;

      color: #0078d7 !important;   /* ✅ same as .tts-link */
      font-size: 1.8rem;
      line-height: 1;
      padding: 6px 10px;
    }

    #selfpb-lite #spb-dl:hover{
      filter: brightness(0.9);
    }

    /* ✅ Scrubber: looks like a real timeline */
    :is(#selfpb-lite, #spb-float) #spb-scrub{
      -webkit-appearance: none;
      appearance: none;
      height: 18px;
    }

    :is(#selfpb-lite, #spb-float) #spb-scrub::-webkit-slider-runnable-track{
      height: 10px;
      border-radius: 999px;
      background: rgba(15,23,42,0.14);
    }

    :is(#selfpb-lite, #spb-float) #spb-scrub::-webkit-slider-thumb{
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #2f6fe4;
      border: 2px solid #fff;
      margin-top: -4px;
      box-shadow: 0 6px 14px rgba(0,0,0,0.18);
    }

    /* ✅ Speed stays slimmer + quieter */
    :is(#selfpb-lite, #spb-float) #spb-rate::-webkit-slider-runnable-track{
      height: 6px;
      border-radius: 999px;
      background: rgba(15,23,42,0.10);
    }
    :is(#selfpb-lite, #spb-float) #spb-rate::-webkit-slider-thumb{
      -webkit-appearance:none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: rgba(15,23,42,0.60);
      margin-top: -4px;
    }

    /* bottom row: -2s ⬇ +2s */
    :is(#selfpb-lite, #spb-float) .spb-bottom{
      justify-content:space-between;
    }

    /* ✅ Expand button (header) */
    #selfpb-lite .spb-miniBtn{
      border: 0;
      border-radius: 999px;
      padding: 6px 10px;
      font-weight: 900;
      cursor: pointer;
      background: rgba(255,255,255,0.22);
      color: rgba(15,23,42,0.85);
      transition: transform .12s ease, filter .12s ease;
    }

    #selfpb-lite .spb-miniBtn:hover{
      transform: scale(1.10);  /* ✅ “big bulge” hover */
      filter: brightness(1.12);
    }

    /* ✅ Floating expanded window (non-modal) */
    #spb-float{
      position: fixed;
      z-index: 200000;
      display: none;

      width: min(1100px, calc(100vw - 40px));
      height: min(86vh, 820px);

      left: 50%;
      top: 90px;
      transform: translateX(-50%);

      border-radius: 22px;
      background: rgba(255,255,255,0.96);
      border: 1px solid rgba(15,23,42,0.12);
      box-shadow: 0 18px 52px rgba(0,0,0,0.30);
      overflow: hidden;
    }

    #spb-float.is-open{ display:block; }

    #spb-floatHead{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 10px 12px;
      font-weight: 900;
      cursor: grab;            /* ✅ draggable */
      user-select: none;
      background: rgba(15,23,42,0.04);
    }

    #spb-floatHead:active{ cursor: grabbing; }

    #spb-floatMount{
      padding: 12px;
      height: calc(100% - 52px);
      overflow: auto;
    }

    @media (max-width: 980px){
      #spb-floatGrid{ flex-direction: column; }
      #spb-floatRight{
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }
    }

    /* ✅ bigger waveform in expanded mode */
    #spb-float #spb-wavebox{
      height: 240px;
    }

    /* ✅ expanded mode: speed slider not absurdly wide */
    #spb-float #spb-rate{
      max-width: 320px;
    }

    /* ============================================================
       ✅ Expanded-only Karaoke Timeline
       ============================================================ */

    #spb-karaokeWrap{
      display:none; /* ✅ hidden in small drawer */
      margin-top: 10px;
    }

    #spb-karaokeWrap .spb-karaokeTitle{
      font-weight: 900;
      font-size: 12px;
      opacity: .70;
      margin: 2px 0 8px;
    }

    /* ✅ lane wrapper (timeline) */
    #spb-karaokeLaneWrap{
      position: relative;
      border-radius: 14px;
      background: rgba(15,23,42,0.04);
      border: 1px solid rgba(15,23,42,0.10);
      height: 76px;          /* JS can expand this if we need multiple rows */
      overflow: hidden;
      cursor: pointer;
    }

    /* subtle center “timeline rail” */
    #spb-karaokeLaneWrap::before{
      content:"";
      position:absolute;
      left:10px; right:10px;
      top: 38px;
      height: 2px;
      border-radius: 999px;
      background: rgba(15,23,42,0.10);
    }

    /* holds absolute-positioned words */
    #spb-karaokeLane{
      position:absolute;
      inset: 8px 8px 8px 8px;
    }

    /* playback cursor */
    #spb-karaokeCursor{
      position:absolute;
      top: 8px;
      bottom: 8px;
      width: 2px;
      left: 0%;
      transform: translateX(-1px);
      background: rgba(47,111,228,0.55);
      border-radius: 999px;
      pointer-events: none;
    }

    /* each word pill */
    #spb-karaokeLane .spbKWord{
      --p: 0;
      position:absolute;
      height: 24px;
      padding: 0 10px;
      border-radius: 999px;

      border: 1px solid rgba(15,23,42,0.12);
      background:
        linear-gradient(
          90deg,
          rgba(47,111,228,0.22) calc(var(--p) * 100%),
          rgba(255,255,255,0.72) 0
        );

      font-weight: 900;
      font-size: 12px;
      color: rgba(15,23,42,0.86);

      display:flex;
      align-items:center;
      justify-content:center;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      cursor: pointer;
      transition: transform .08s ease, filter .12s ease;
    }

    #spb-karaokeLane .spbKWord:hover{
      transform: scale(1.03);
      filter: brightness(1.04);
    }

    #spb-karaokeLane .spbKWord.is-active{
      z-index: 2;
      transform: scale(1.04);
      border-color: rgba(47,111,228,0.40);
      box-shadow: 0 10px 18px rgba(47,111,228,0.14);
    }

    #spb-karaokeLane .spbKWord.is-past{ opacity: .50; }
    #spb-karaokeLane .spbKWord.is-future{ opacity: .78; }

    /* ✅ error glow if word accuracy is low */
    #spb-karaokeLane .spbKWord.is-bad{
      border-color: rgba(220,38,38,0.35);
      box-shadow: 0 10px 20px rgba(220,38,38,0.14);
      background:
        linear-gradient(
          90deg,
          rgba(220,38,38,0.18) calc(var(--p) * 100%),
          rgba(255,255,255,0.72) 0
        );
    }

    /* ✅ great words get a soft “good glow” */
    #spb-karaokeLane .spbKWord.is-great{
      border-color: rgba(47,111,228,0.30);
      box-shadow: 0 10px 20px rgba(47,111,228,0.12);
    }

    /* ✅ show karaoke ONLY inside Expanded containers */
    #spb-modalCard #spb-karaokeWrap,
    #spb-float #spb-karaokeWrap{
      display:block;
    }
  `;

  document.head.appendChild(s);
}
