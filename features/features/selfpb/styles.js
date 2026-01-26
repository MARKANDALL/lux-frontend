// features/features/selfpb/styles.js
// ✅ VERBATIM extraction of ensureStyles() from features/features/selfpb/ui.GOLD
// Only change: export added at bottom

function ensureStyles() {
  const STYLE_ID = "selfpb-lite-style";
  if (document.getElementById(STYLE_ID)) return;

  const s = document.createElement("style");
  s.id = STYLE_ID;

  s.textContent = `
    /* Light Theme + Layout Styles */

    #selfpb-lite{
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
      width: 100%;
      max-width: 700px;
      margin: 10px auto;
      padding: 12px;
      border-radius: 14px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 8px 28px rgba(0,0,0,0.08);
    }

    #selfpb-lite .row{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }

    #selfpb-lite .col{
      display:flex;
      flex-direction:column;
      gap:8px;
      width:100%;
    }

    #selfpb-lite .pill{
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:6px 10px;
      border-radius:999px;
      font-size:12px;
      line-height:1;
      background: rgba(0,0,0,0.06);
      color:#111;
    }

    #selfpb-lite .pill.tiny{
      font-size:11px;
      padding:5px 9px;
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

    #selfpb-lite .btn.ic{
      width:34px;
      height:34px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      border-radius:10px;
      padding:0;
      background: rgba(45,108,223,0.12);
      color:#2d6cdf;
    }

    #selfpb-lite .btn.ic:hover{
      background: rgba(45,108,223,0.18);
    }

    #selfpb-lite .btn.ic svg{
      width:18px;height:18px;
    }

    #selfpb-lite .btn.gray{
      background: rgba(0,0,0,0.08);
      color:#111;
    }

    #selfpb-lite .btn.gray:hover{
      background: rgba(0,0,0,0.11);
    }

    #selfpb-lite .btn.red{
      background:#ef4444;
    }

    #selfpb-lite .btn.red:hover{
      filter:brightness(1.08);
    }

    #selfpb-lite .wave-wrap{
      display:flex;
      flex-direction:column;
      gap:8px;
      padding:10px;
      border-radius:12px;
      background: rgba(0,0,0,0.03);
      border: 1px solid rgba(0,0,0,0.06);
    }

    #selfpb-lite .wave-title{
      font-size:12px;
      font-weight:600;
      opacity:0.85;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }

    #selfpb-lite .wave{
      width:100%;
      height:56px;
      border-radius:10px;
      background: rgba(255,255,255,0.85);
      border: 1px solid rgba(0,0,0,0.06);
      overflow:hidden;
      position:relative;
    }

    #selfpb-lite .wave canvas{
      width:100%;
      height:100%;
      display:block;
    }

    #selfpb-lite .timebar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      font-size:12px;
      opacity:0.9;
      margin-top:4px;
    }

    #selfpb-lite .scrub{
      width:100%;
      height:10px;
      appearance:none;
      background: rgba(0,0,0,0.08);
      border-radius:999px;
      outline:none;
      cursor:pointer;
    }

    #selfpb-lite .scrub::-webkit-slider-thumb{
      appearance:none;
      width:18px;height:18px;
      border-radius:50%;
      background:#2d6cdf;
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 4px 12px rgba(45,108,223,0.3);
    }

    #selfpb-lite .mini-label{
      font-size:11px;
      opacity:0.7;
    }

    #selfpb-lite .section{
      margin-top:10px;
      padding-top:10px;
      border-top:1px solid rgba(0,0,0,0.06);
    }

    #selfpb-lite .split{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }

    #selfpb-lite .split > *{
      flex:1;
      min-width: 240px;
    }

    #selfpb-lite .ghost-note{
      font-size:11px;
      opacity:0.65;
    }

    /* Expanded overlay */
    #spb-expandedOverlay{
      position: fixed;
      inset: 0;
      display:none;
      align-items:center;
      justify-content:center;
      background: rgba(0,0,0,0.42);
      z-index: 9999;
      padding: 18px;
    }

    #spb-expandedOverlay.is-open{
      display:flex;
    }

    #spb-expandedCard{
      width: min(980px, 96vw);
      max-height: 92vh;
      overflow:auto;
      border-radius: 18px;
      background: rgba(255,255,255,0.96);
      border: 1px solid rgba(255,255,255,0.35);
      box-shadow: 0 24px 80px rgba(0,0,0,0.35);
      padding: 14px 14px 16px;
    }

    #spb-expandedCard .topRow{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:10px;
    }

    #spb-expandedCard .topRow .title{
      font-size:13px;
      font-weight:700;
      opacity:0.85;
    }

    #spb-expandedCard .closeBtn{
      width:34px;
      height:34px;
      border-radius:12px;
      border:0;
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      background: rgba(0,0,0,0.06);
    }

    #spb-expandedCard .closeBtn:hover{
      background: rgba(0,0,0,0.09);
    }

    /* Karaoke line (expanded only) */
    #spb-karaokeWrap{
      display:none;
      margin-top: 10px;
      padding: 10px;
      border-radius: 12px;
      background: rgba(0,0,0,0.03);
      border: 1px solid rgba(0,0,0,0.06);
    }

    #spb-expandedCard #spb-karaokeWrap{
      display:block;
    }

    #spb-karaokeWrap .spb-karaokeTitle{
      font-size: 12px;
      font-weight: 700;
      opacity: 0.8;
      margin-bottom: 6px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }

    #spb-karaoke{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      align-items:center;
    }

    .spb-kword{
      font-size: 12px;
      padding: 5px 8px;
      border-radius: 999px;
      background: rgba(0,0,0,0.06);
      border: 1px solid rgba(0,0,0,0.06);
      opacity: 0.85;
      transition: transform 0.12s, background 0.12s, opacity 0.12s;
      user-select:none;
    }

    .spb-kword.is-active{
      background: rgba(45,108,223,0.18);
      border-color: rgba(45,108,223,0.25);
      opacity: 1;
      transform: translateY(-1px);
    }

    /* Center karaoke line (expanded) */
    #spb-karaokeCenter{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      align-items:center;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(0,0,0,0.06);
    }

    .spb-ckword{
      font-size: 12px;
      padding: 5px 8px;
      border-radius: 999px;
      background: rgba(0,0,0,0.06);
      border: 1px solid rgba(0,0,0,0.06);
      opacity: 0.85;
      transition: transform 0.12s, background 0.12s, opacity 0.12s;
      user-select:none;
    }

    .spb-ckword.is-active{
      background: rgba(45,108,223,0.18);
      border-color: rgba(45,108,223,0.25);
      opacity: 1;
      transform: translateY(-1px);
    }

    /* ✅ (from GOLD) show karaoke in expanded float too */
    #spb-float #spb-karaokeWrap{
      display:block;
    }
  `;

  document.head.appendChild(s);
}

export { ensureStyles };
