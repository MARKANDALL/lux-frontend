// features/interactions/ph-hover/dom.styles/tooltip-video.cssText.js
// One-line: CSS text chunk for tooltip video controls/tiles + expand button animations (injected by dom.styles.js).

export const TOOLTIP_VIDEO_CSS = `
    /* ---- Video block (bigger + clickable play system) ---- */
    #lux-global-ph-tooltip .lux-ph-vidBox{
      background:#000;
      padding: 6px;
    }

    #lux-global-ph-tooltip .lux-ph-vidControls{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:10px;
    }

    #lux-global-ph-tooltip .lux-ph-vidBtns,
    .lux-ph-modalCard .lux-ph-vidBtns{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      align-items:center;
    }

    #lux-global-ph-tooltip .lux-ph-miniBtn,
    .lux-ph-modalCard .lux-ph-miniBtn{
      border:0;
      background:rgba(255,255,255,0.10);
      color:#e2e8f0;
      border-radius:999px;
      padding:6px 10px;
      font-size:12px;
      font-weight:800;
      cursor:pointer;
    }

    #lux-global-ph-tooltip .lux-ph-miniBtn.is-primary,
    .lux-ph-modalCard .lux-ph-miniBtn.is-primary{
      background:rgba(96,165,250,0.35);
    }

    #lux-global-ph-tooltip .lux-ph-miniBtn:active,
    .lux-ph-modalCard .lux-ph-miniBtn:active{
      transform: translateY(1px);
    }

    /* ---- Expand button: visible breathe + stable bigger hover ---- */
    #lux-global-ph-tooltip #lux-ph-expand{
      position: relative;
      transform-origin: center;
      will-change: transform, filter, box-shadow;

      /* IMPORTANT: make hover “stay expanded” (no twitch) */
      transform: scale(1);
      transition:
        transform 180ms cubic-bezier(.2,.9,.2,1),
        filter 180ms ease,
        box-shadow 240ms ease;

      /* Always-on breathe (VISIBLE, but subtle) */
      animation: luxExpandBreathe 2400ms ease-in-out infinite;
    }

    /* Bigger bulge than other buttons — and it STAYS while hovered */
    #lux-global-ph-tooltip #lux-ph-expand:hover{
      transform: scale(1.22);                 /* hair bigger than before */
      filter: brightness(1.14);
      box-shadow: 0 0 18px rgba(96,165,250,0.38);
      animation-play-state: paused;           /* prevents “breathing jitter” while hovering */
    }

    /* The delayed 2s “attention nudge” — keep it non-transform to avoid fighting hover scale */
    #lux-global-ph-tooltip #lux-ph-expand.lux-expand-attn{
      animation: luxExpandAttention 560ms cubic-bezier(.2,.9,.2,1) both;
    }

    /* box-shadow/brightness pulse so it’s actually visible */
    @keyframes luxExpandBreathe{
      0%{
        filter: brightness(1.02);
        box-shadow: 0 0 0 rgba(96,165,250,0.00);
      }
      55%{
        filter: brightness(1.10);
        box-shadow: 0 0 16px rgba(96,165,250,0.22);
      }
      100%{
        filter: brightness(1.02);
        box-shadow: 0 0 0 rgba(96,165,250,0.00);
      }
    }

    /* Attention pulse (no transform = no hover twitch) */
    @keyframes luxExpandAttention{
      0%{
        filter: brightness(1.02);
        box-shadow: 0 0 0 rgba(96,165,250,0.00);
      }
      55%{
        filter: brightness(1.22);
        box-shadow: 0 0 22px rgba(96,165,250,0.42);
      }
      100%{
        filter: brightness(1.02);
        box-shadow: 0 0 0 rgba(96,165,250,0.00);
      }
    }

    #lux-global-ph-tooltip .lux-ph-speed,
    .lux-ph-modalCard .lux-ph-speed{
      background: rgba(255,255,255,0.10);
      color:#e2e8f0;
      border: 0;
      border-radius: 999px;
      padding: 6px 10px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
    }

    /* Fix: dropdown options were too light on white background */
    #lux-global-ph-tooltip .lux-ph-speed option,
    .lux-ph-modalCard .lux-ph-speed option{
      color:#111;
      background:#fff;
    }

    #lux-global-ph-tooltip .lux-ph-speed option:disabled,
    .lux-ph-modalCard .lux-ph-speed option:disabled{
      color:#777;
    }

    #lux-global-ph-tooltip .lux-ph-vidGrid{
      display:grid;
      gap: 6px;
    }

    #lux-global-ph-tooltip .lux-ph-vidGrid[data-cols="1"]{
      grid-template-columns:1fr;
    }

    #lux-global-ph-tooltip .lux-ph-vidGrid[data-cols="2"]{
      grid-template-columns:repeat(2, minmax(0, 1fr));
    }

    #lux-global-ph-tooltip .lux-ph-vidTile{
      position:relative;
      border-radius:12px;
      overflow:hidden;
      background:#05070f;
      aspect-ratio: 16 / 10;
      cursor:pointer;
    }

    #lux-global-ph-tooltip .lux-ph-vidTile video{
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      object-fit: cover;
      transform: scale(1.06);
    }

    #lux-global-ph-tooltip .lux-ph-vidOverlay{
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(0,0,0,0.25);
      font-size:34px;
      opacity:0.88;
      transition: opacity 140ms ease;
      pointer-events:none;
    }

    #lux-global-ph-tooltip .lux-ph-vidTile.is-playing .lux-ph-vidOverlay{
      opacity:0;
    }

    #lux-global-ph-tooltip .lux-ph-vidLabel{
      position:absolute;
      left:8px;
      bottom:8px;
      background:rgba(0,0,0,0.55);
      color:#e2e8f0;
      font-size:11px;
      padding:4px 8px;
      border-radius:999px;
      font-weight:800;
    }

`;
