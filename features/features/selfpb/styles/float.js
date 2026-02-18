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

    /* ✅ Drag handle hint */
    #spb-floatHeadLabel {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    /* ✅ Drag handle — animated hand */
    #spb-floatDragHint {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      font-size: 17px;
      line-height: 1;
      cursor: grab;
      user-select: none;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.18));
      animation: spb-hand-loop 2.8s ease-in-out infinite;
      transform-origin: center center;
    }

    #spb-floatHead:active #spb-floatDragHint {
      animation-play-state: paused;
      content: "✊";
    }

    @keyframes spb-hand-loop {
      0%   { transform: translate(0px, 0px)   rotate(-8deg)  scale(1);    }
      18%  { transform: translate(3px, -3px)  rotate(4deg)   scale(1.08); }
      36%  { transform: translate(4px, 2px)   rotate(10deg)  scale(1.05); }
      54%  { transform: translate(-2px, 4px)  rotate(2deg)   scale(1.08); }
      72%  { transform: translate(-4px, -2px) rotate(-10deg) scale(1.05); }
      88%  { transform: translate(-2px, -3px) rotate(-6deg)  scale(1.02); }
      100% { transform: translate(0px, 0px)   rotate(-8deg)  scale(1);    }
    }

    /* ✅ Wiggle + red flash + shadow bloom for close button */
    @keyframes spb-wiggle {
      0%   { transform: rotate(0deg)   scale(1);    box-shadow: none;                              background: transparent; }
      10%  { transform: rotate(-22deg) scale(1.25); box-shadow: 0 0 0 4px rgba(239,68,68,0.25);   background: rgba(239,68,68,0.15); }
      25%  { transform: rotate(20deg)  scale(1.28); box-shadow: 0 0 14px 6px rgba(239,68,68,0.4); background: rgba(239,68,68,0.22); }
      40%  { transform: rotate(-16deg) scale(1.2);  box-shadow: 0 0 10px 4px rgba(239,68,68,0.3); background: rgba(239,68,68,0.18); }
      55%  { transform: rotate(12deg)  scale(1.15); box-shadow: 0 0 8px 3px rgba(239,68,68,0.22); background: rgba(239,68,68,0.12); }
      70%  { transform: rotate(-7deg)  scale(1.08); box-shadow: 0 0 4px 2px rgba(239,68,68,0.12); background: rgba(239,68,68,0.07); }
      85%  { transform: rotate(4deg)   scale(1.03); box-shadow: none;                              background: transparent; }
      100% { transform: rotate(0deg)   scale(1);    box-shadow: none;                              background: transparent; }
    }

    #spb-floatClose.wiggle {
      animation: spb-wiggle 0.65s ease forwards;
      border-radius: 50%;
    }

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
