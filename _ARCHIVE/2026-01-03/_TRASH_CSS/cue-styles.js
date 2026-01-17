// ui/interactions/cue-styles.js
export function installLegendCueStyles() {
  if (document.getElementById("legendCueStyles")) return;
  const css = `
      .results-flex{position:relative;display:flex;align-items:flex-start;justify-content:center;gap:0;isolation:isolate;}
      .results-flex.legend-open{gap:12px;}
      #prosodyLegend{overflow:hidden;width:0!important;min-width:0!important;flex:0 0 0!important;padding:0!important;margin:0!important;border:0!important;opacity:0;transform:translateX(-10px);
        transition:width .28s ease,flex-basis .28s ease,opacity .28s ease,transform .28s ease,padding .28s ease,margin .28s ease;}
      .results-flex.legend-open #prosodyLegend{width:280px!important;min-width:280px!important;flex:0 0 280px!important;padding-right:10px!important;margin-right:0!important;border-left:0!important;opacity:1;transform:translateX(0);}
      #prosodyLegendToggle{position:relative;isolation:isolate;cursor:pointer;}
      #prosodyLegendToggle.cue-legend::after{content:"";position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2px solid rgba(0,120,215,.55);animation:legendPing 1.6s ease-out infinite;pointer-events:none;}
      @keyframes legendPing{0%{transform:scale(.7);opacity:.9}70%,100%{transform:scale(1.9);opacity:0}}
      #legendPeek{position:absolute;top:44px;width:12px;height:40px;border-radius:8px 0 0 8px;background:linear-gradient(180deg,#9fd2ff,#0078d7);box-shadow:0 3px 10px rgba(0,0,0,.22);opacity:0;transform:translateX(10px);
        transition:opacity .24s ease,transform .24s ease;pointer-events:auto;cursor:pointer;z-index:6;}
      #legendPeek::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.95),rgba(255,255,255,0));background-size:220% 100%;animation:legendLine 1.3s linear infinite;opacity:.5;}
      @keyframes legendLine{from{background-position:200% 0}to{background-position:0% 0}}
      .results-flex.show-peek #legendPeek{opacity:.95;transform:translateX(0)}
      .results-flex.legend-open #legendPeek{display:none}
      .tip-ProsodyBars .tooltiptext{padding-bottom:14px;}
      .tip-ProsodyBars .tooltiptext::before{content:"";position:absolute;left:10px;right:10px;bottom:6px;height:2px;background:#ffffff66;border-radius:2px;}
      .tip-ProsodyBars .tooltiptext::after{content:"";position:absolute;bottom:2px;width:0;height:0;border-right:10px solid #fff;border-top:6px solid transparent;border-bottom:6px solid transparent;right:-18px;opacity:.9;animation:legendArrow 1.7s linear infinite;}
      @keyframes legendArrow{from{right:-18px}to{right:calc(100% + 18px)}}
      
      /* REMOVED: .lux-cta styles (Moved to lux-popover.css) */

      /* chip tap feedback */
      #resultBody .phoneme-chip.tap-flash{animation:chipTap .22s ease-out 1;}
      @keyframes chipTap{
        0%{transform:scale(1); box-shadow:0 0 0 0 rgba(64,156,255,0)}
        50%{transform:scale(.965); box-shadow:0 0 0 6px rgba(64,156,255,.28)}
        100%{transform:scale(1); box-shadow:0 0 0 0 rgba(64,156,255,0)}
      }`;
  const style = document.createElement("style");
  style.id = "legendCueStyles";
  style.textContent = css;
  document.head.appendChild(style);
} 