// features/interactions/ph-hover/dom.styles.js

export function injectTooltipCSS() {
  if (document.getElementById("lux-global-ph-tooltip-style")) return;

  const style = document.createElement("style");
  style.id = "lux-global-ph-tooltip-style";

  style.textContent = `
    #lux-global-ph-tooltip video::-webkit-media-controls { display:none !important; }
    #lux-global-ph-tooltip video::-webkit-media-controls-enclosure { display:none !important; }
    #lux-global-ph-tooltip video::-webkit-media-controls-panel { display:none !important; }

    /* ---- Topbar (IPA + mode nav + close) ---- */
    #lux-global-ph-tooltip .lux-ph-topbar{
      background:#0f172a;
      padding: 8px 10px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }

    #lux-global-ph-tooltip .lux-ph-ipaBlock{
      min-width: 0;
      display:flex;
      align-items:baseline;
      gap:8px;
      flex: 1;
    }

    #lux-global-ph-tooltip .lux-ph-ipa{
      font-weight:900;
      font-size: 1.1em;
      color:#fff;
      white-space:nowrap;
    }

    #lux-global-ph-tooltip .lux-ph-examples{
      color:#94a3b8;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    #lux-global-ph-tooltip .lux-ph-modeNav{
      display:flex;
      align-items:center;
      gap:8px;
      flex: 0 0 auto;
    }

    #lux-global-ph-tooltip .lux-ph-nav-btn{
      width:28px;
      height:28px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color:#e2e8f0;
      cursor:pointer;
      line-height: 1;
      display:flex;
      align-items:center;
      justify-content:center;
      user-select:none;
    }

    #lux-global-ph-tooltip .lux-ph-nav-btn:disabled{
      opacity:0.35;
      cursor:default;
    }

    #lux-global-ph-tooltip .lux-ph-modeTitle{
      font-size:12px;
      letter-spacing:0.02em;
      color:#cbd5e1;
      font-weight:900;
      white-space:nowrap;
    }

    #lux-global-ph-tooltip .lux-ph-closeBtn{
      border:0;
      background:rgba(255,255,255,0.08);
      color:#e2e8f0;
      border-radius:10px;
      width:30px;
      height:30px;
      cursor:pointer;
      font-size:16px;
      line-height:30px;
      flex: 0 0 auto;
    }

    /* Center the ✕ perfectly inside its button */
    #lux-global-ph-tooltip #lux-ph-close{
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      line-height: 1;
    }

    /* Single source of truth for the panel text (no duplicates) */
    #lux-global-ph-tooltip .lux-ph-panelText{
      background:#0f172a;
      color:#e2e8f0;
      font-size:13px;
      padding: 10px 12px 12px;
      border-bottom:1px solid #334155;
      white-space: normal;
    }

    #lux-global-ph-tooltip .lux-ph-panelText.is-empty{
      color:#94a3b8;
      font-style:italic;
    }

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

    /* ---- Video Focus Modal ---- */
    .lux-ph-modalBack{
      position: fixed;
      inset: 0;
      background: rgba(2,6,23,0.62);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .lux-ph-modalCard{
      width: min(1100px, 97vw);
      height: min(720px, 90vh);
      background: #0b1020;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      box-shadow: 0 22px 70px rgba(0,0,0,0.55);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* ---- Modal: Phoneme info + rotating descriptions (mirrors tooltip) ---- */
    .lux-ph-modalCard .lux-ph-modalInfo{
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      overflow: hidden;
      background: #0f172a;
    }

    .lux-ph-modalCard .lux-ph-topbar{
      background:#0f172a;
      padding: 8px 10px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      flex-wrap: wrap;
    }

    .lux-ph-modalCard .lux-ph-ipaBlock{
      min-width: 0;
      display:flex;
      align-items:baseline;
      gap:8px;
      flex: 1;
      flex-wrap: wrap;
    }

    .lux-ph-modalCard .lux-ph-ipa{
      color:#e2e8f0;
      font-weight: 900;
      letter-spacing: 0.2px;
    }

    .lux-ph-modalCard .lux-ph-code{
      color:#93c5fd;
      font-weight: 800;
      font-size: 12px;
      opacity: 0.95;
    }

    .lux-ph-modalCard .lux-ph-examples{
      color:#cbd5e1;
      font-weight: 700;
      font-size: 12px;
      opacity: 0.9;
    }

    .lux-ph-modalCard .lux-ph-modeNav{
      display:flex;
      align-items:center;
      gap:8px;
      flex: 0 0 auto;
    }

    .lux-ph-modalCard .lux-ph-modeTitle{
      color:#e2e8f0;
      font-weight: 900;
      font-size: 12px;
      letter-spacing: 0.2px;
      min-width: 110px;
      text-align:center;
    }

    .lux-ph-modalCard .lux-ph-nav-btn{
      border: 0;
      background: rgba(255,255,255,0.08);
      color:#e2e8f0;
      border-radius: 10px;
      padding: 6px 10px;
      font-weight: 900;
      cursor: pointer;
    }

    .lux-ph-modalCard .lux-ph-panelText{
      background:#0f172a;
      color:#e2e8f0;
      font-size:13px;
      padding: 10px 12px 12px;
      border-top: 1px solid rgba(255,255,255,0.06);
      white-space: normal;
      max-height: 140px;
      overflow: auto;
    }

    .lux-ph-modalCard .lux-ph-panelText.is-empty{
      color:#94a3b8;
      font-style:italic;
    }

    .lux-ph-modalTop{
      display: flex;
      align-items: center;
      justify-content: flex-start; /* title + controls, not shoved right */
      gap: 12px;
      flex-wrap: wrap;            /* still behaves on small widths */
    }

    .lux-ph-modalTitle{
      color: #e2e8f0;
      font-weight: 900;
      font-size: 13px;
      opacity: 0.9;
      white-space: nowrap;
      margin-right: 10px;
    }

    /* ---- Modal controls: occupy space + feel bigger ---- */
    .lux-ph-modalCard .lux-ph-vidBtns{
      flex: 1;                    /* take remaining row width */
      justify-content: center;    /* visually balances the top bar */
      gap: 10px;
    }

    .lux-ph-modalCard .lux-ph-miniBtn{
      padding: 7px 12px;
      font-size: 13px;
      min-height: 34px;
    }

    .lux-ph-modalCard .lux-ph-speed{
      padding: 7px 12px;
      font-size: 13px;
      min-height: 34px;
    }

    .lux-ph-modalGrid{
      flex: 1;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      min-height: 0;
    }

    /* Modal needs the same video tile rules (not scoped to tooltip id) */
    .lux-ph-modalCard .lux-ph-vidTile{
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: #05070f;
      cursor: pointer;
      height: 100%;
      aspect-ratio: auto; /* override */
    }

    .lux-ph-modalCard .lux-ph-vidTile video{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1.06);
    }

    .lux-ph-modalCard .lux-ph-vidOverlay{
      position: absolute;
      inset: 0;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(0,0,0,0.25);
      font-size:34px;
      opacity:0.88;
      transition: opacity 140ms ease;
      pointer-events:none;
    }

    .lux-ph-modalCard .lux-ph-vidTile.is-playing .lux-ph-vidOverlay{
      opacity:0;
    }

    .lux-ph-modalCard .lux-ph-vidLabel{
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

  document.head.appendChild(style);
}
