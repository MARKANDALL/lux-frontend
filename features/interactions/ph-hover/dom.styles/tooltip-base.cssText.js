// features/interactions/ph-hover/dom.styles/tooltip-base.cssText.js
// One-line: CSS text chunk for tooltip topbar + panel text styling (injected by dom.styles.js).

export const TOOLTIP_BASE_CSS = `
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

`;
