// features/features/selfpb/styles/mini.js
// CSS for Self Playback mini drawer base styling (#selfpb-lite), including bezel/body layout, buttons/pills, mini-empty placeholder behavior, loop/timing layout fixes, and coach-mark bubble.

export const MINI_CSS = `
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

    /* ✅ Hide the TTS mount in the small drawer */
    #selfpb-lite .spb-controls--tts{
      display:none !important;
    }

    /* Mini drawer: the loop-slot reserves width and crushes the speed slider.
       Hide it in the mini drawer so #spb-rate can stretch normally. */
    #selfpb-lite #spb-loop-slot{
      display:none;
    }

    /* Expanded open: make the mini drawer read as ONE card (no bezel + inner-card stack) */
    #selfpb-lite.spb-mini-empty{
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      width: var(--spbW) !important;
      border-radius: 18px !important;
    }

    /* The blank placeholder becomes the single visible card */
    #selfpb-lite.spb-mini-empty .spb-miniPlaceholder{
      width: 100% !important;
      min-height: 260px;
      background:#fff;
      border-radius: 18px;
      border: 1px solid rgba(15,23,42,0.10);
      box-shadow: 0 10px 26px rgba(0,0,0,0.12);
      padding: 0;
    }

    /* ✅ When expanded is open, mini drawer becomes a blank placeholder card */
    #selfpb-lite .spb-miniPlaceholder{ display:none; }

    /* Hide the top mini header strip (Expand/Ref/Time row) */
    #selfpb-lite.spb-mini-empty > .row{
      display:none !important;
    }

    /* Show a blank inner card so the mini drawer doesn’t collapse */
    #selfpb-lite.spb-mini-empty .spb-miniPlaceholder{
      display:block !important;
      min-height: 260px;
      padding: 0;
    }
`;
