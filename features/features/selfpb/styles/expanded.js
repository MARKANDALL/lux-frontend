// features/features/selfpb/styles/expanded.js
// CSS for Self Playback expanded view content layout inside #spb-float (grid areas, TTS panel visibility, waveform sizing, karaoke width helpers, and responsive stacking).

export const EXPANDED_CSS = `
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
`;
