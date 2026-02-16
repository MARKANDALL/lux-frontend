// features/interactions/ph-hover/dom.styles/tooltip-modal.cssText.js
// One-line: CSS text chunk for the video focus modal layout + modal card internals (injected by dom.styles.js).

export const TOOLTIP_MODAL_CSS = `
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
