// features/features/selfpb/styles/widgets.js
// Shared Self Playback widget/control CSS used in both mini drawer and expanded float (rows, buttons, scrubbers, sliders, canvas overflow safety, wave container styling).

export const WIDGETS_CSS = `
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
`;
