// features/features/selfpb/styles/float.js
// CSS for Self Playback expanded floating window shell (#spb-float), including head/mount, responsive tweaks, and expanded-only sizing.

export const FLOAT_CSS = `
    /* ✅ Floating expanded window (non-modal) */
    #spb-float{
      position: fixed;
      z-index: 200000;
      display: none;

      width: min(1100px, calc(100vw - 40px));
      height: auto;

      max-height: min(86vh, 820px);

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
      position: relative;
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
      padding: 10px;
      height: auto;
      max-height: calc(86vh - 52px);
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
      max-width: 520px;
    }
`;
