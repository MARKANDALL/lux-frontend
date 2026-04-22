// features/features/selfpb/styles/expanded.js
// CSS for Self Playback expanded view content layout inside #spb-float (grid areas, TTS panel visibility, waveform sizing, karaoke width helpers, and responsive stacking).

export const EXPANDED_CSS = `
    /* ✅ In expanded mode, body fills floating card (three-column layout) */
    #spb-float .spb-body{
      width: 100% !important;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-areas:
        "top  top  top"
        "self tts  vm";
      gap: 14px;
      align-items: start;
    }

    #spb-float .spb-top{ grid-area: top; width:100%; }
    #spb-float .spb-controls--self{ grid-area: self; width:100%; min-width:0; }
    #spb-float .spb-controls--tts{ grid-area: tts; width:100%; min-width:0; display:block; }
    #spb-float .spb-controls--vm{ grid-area: vm; width:100%; min-width:0; display:block; }

    /* ✅ Hide the VM column in the mini drawer (only visible in expanded float) */
    #selfpb-lite .spb-controls--vm{
      display:none !important;
    }

    /* ✅ Give the waveform area real space in expanded mode */
    #spb-float .spb-wave{
      height: 240px;
    }

    /* ✅ Karaoke (Word Sync) should stretch full width */
    #spb-float #spb-karaokeWrap,
    #spb-float #spb-karaokeLaneWrap{
      width: 100%;
    }

    /* ✅ TTS card should fill its column */
    #spb-float .spb-controls--tts #tts-wrap{
      width: 100%;
      max-width: 100%;
      margin-left: 0;
    }

    /* ✅ Voice Mirror tile fills its column without the inherited top margin */
    #spb-float .spb-controls--vm #tts-voice-mirror-slot{
      margin-top: 0 !important;
      width: 100%;
    }
    #spb-float .spb-controls--vm .lux-vm-shell{
      margin-top: 0 !important;
      width: 100%;
    }

    /* ✅ In expanded view, the TTS expand button is redundant */
    #spb-float #tts-expand{ display:none; }

    /* ✅ Compact controls — keep rows tight so three columns fit without scroll */
    #spb-float .spb-controls .spb-row{
      gap: 6px;
    }
    #spb-float #spb-main,
    #spb-float #spb-loop-action{
      min-width: 0;
      padding: 8px 6px;
      font-size: 0.95em;
    }

    /* ✅ Mobile: stack sections */
    @media (max-width: 980px){
      #spb-float .spb-body{
        grid-template-columns: 1fr;
        grid-template-areas:
          "top"
          "self"
          "tts"
          "vm";
      }
    }
`;
