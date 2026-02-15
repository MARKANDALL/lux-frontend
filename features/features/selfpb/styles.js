// features/features/selfpb/styles.js
// Injected CSS for Self Playback mini drawer + Expanded float layout rules (waveform sizing, placeholders, etc.).

import { KARAOKE_CSS } from "./styles/karaoke.js";
import { FLOAT_CSS } from "./styles/float.js";
import { EXPANDED_CSS } from "./styles/expanded.js";

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

    /* ✅ Prevent waveform/canvas from forcing overflow */
    :is(#selfpb-lite, #spb-float) canvas,
    :is(#selfpb-lite, #spb-float) .spb-wave,
    :is(#selfpb-lite, #spb-float) #spb-wavebox{
      max-width: 100% !important;
    }

    #selfpb-lite .spb-wave{
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

    /* ✅ Expanded-only: make the scrubber handle visually distinct (not the generic blue knob) */
    #spb-float #spb-scrub::-webkit-slider-thumb{
      width: 22px;
      height: 22px;
      border-radius: 8px;
      background: radial-gradient(circle at 30% 30%, #ffffff 0%, #bfdbfe 32%, #2563eb 72%, #1e40af 100%);
      border: 2px solid rgba(255,255,255,0.95);
      margin-top: -6px;
      box-shadow:
        0 10px 22px rgba(37,99,235,0.28),
        0 2px 0 rgba(255,255,255,0.65) inset,
        0 0 0 3px rgba(37,99,235,0.10);
      cursor: grab;
    }
    #spb-float #spb-scrub::-webkit-slider-thumb:active{
      cursor: grabbing;
      transform: scale(1.06);
      filter: brightness(0.98);
    }
    #spb-float #spb-scrub::-moz-range-thumb{
      width: 22px;
      height: 22px;
      border-radius: 8px;
      background: radial-gradient(circle at 30% 30%, #ffffff 0%, #bfdbfe 32%, #2563eb 72%, #1e40af 100%);
      border: 2px solid rgba(255,255,255,0.95);
      box-shadow:
        0 10px 22px rgba(37,99,235,0.28),
        0 2px 0 rgba(255,255,255,0.65) inset,
        0 0 0 3px rgba(37,99,235,0.10);
      cursor: grab;
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
  ` + EXPANDED_CSS + FLOAT_CSS + KARAOKE_CSS;

  document.head.appendChild(s);
}
