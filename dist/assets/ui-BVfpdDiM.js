import{i as h}from"./index-B4IlvQTO.js";var x;if((x=window.LuxSelfPB)!=null&&x.__mounted)throw console.warn("[self-pb] already mounted, aborting second mount"),new Error("self-pb double mount");window.LuxSelfPB=Object.assign(window.LuxSelfPB||{},{__mounted:!0});const m="selfpb_rate_v1",b=(e,t,s)=>Math.max(t,Math.min(s,e)),k=e=>{(!isFinite(e)||e<0)&&(e=0);const t=Math.floor(e/60),s=Math.floor(e%60).toString().padStart(2,"0");return`${t}:${s}`};function R(){let e=document.getElementById("playbackAudio");return e||(e=document.createElement("audio"),e.id="playbackAudio",e.hidden=!0,document.body.appendChild(e)),e}function B(){const e=R(),t=new Audio;t.preload="auto";let s=null;const a={a:null,b:null,looping:!1,playing:!1,scrubbing:!1},n=Number(localStorage.getItem(m)||"1")||1;e.playbackRate=b(n,.5,1.5);function d(){a.looping&&a.a!=null&&a.b!=null&&a.b>a.a&&e.currentTime>=a.b&&(e.currentTime=Math.max(a.a,a.a+.01),e.paused&&e.play().catch(()=>{}))}e.addEventListener("timeupdate",d);const u={_setScrubbingOn(){a.scrubbing=!0},_setScrubbingOff(){a.scrubbing=!1},getState(){return a},getAudio(){return e},getRefAudio(){return t},getRefMeta(){return s},setAB(o,l){a.a=o,a.b=l},clearAB(){a.a=a.b=null,a.looping=!1},setRate(o){e.playbackRate=b(o,.5,1.5),localStorage.setItem(m,String(e.playbackRate))},setRefRate(o){t.playbackRate=b(Number(o)||1,.5,1.5),window.LuxSelfPB_REF&&(window.LuxSelfPB_REF.playbackRate=t.playbackRate)},setReference({url:o,audioEl:l,meta:r}={}){try{l instanceof HTMLAudioElement?(t.srcObject=null,t.src=l.src||"",t.playbackRate=l.playbackRate||1):typeof o=="string"&&o&&(t.srcObject=null,t.src=o),s=r||null,window.LuxSelfPB_REF={url:t.src||null,meta:s,playbackRate:t.playbackRate||1}}catch(c){console.warn("[selfpb] setReference failed:",c)}},async setLearnerArrayBuffer(o){var l;try{if(window.LuxSelfPB_LastUrl&&URL.revokeObjectURL(window.LuxSelfPB_LastUrl),console.log("[selfpb] Learner buffer received (Loop guarded)."),!e.src){const r=new Blob([o],{type:"audio/mpeg"}),c=URL.createObjectURL(r);window.LuxSelfPB_LastUrl=c,e.src=c,await((l=e.load)==null?void 0:l.call(e))}}catch(r){console.warn("[selfpb] setLearnerArrayBuffer failed:",r)}},async play(){try{await e.play()}catch{}a.playing=!e.paused},pause(){try{e.pause()}catch{}a.playing=!1},fmt:k,clamp:b,persistRate(o){localStorage.setItem(m,String(b(o,.5,1.5)))}};return window.LuxSelfPB=Object.assign(window.LuxSelfPB||{},u),{api:u,audio:e,refAudio:t,st:a}}function A(){const e="selfpb-lite-style";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e,t.textContent=`
    /* Light Theme + Layout Styles */
    #selfpb-lite{position:fixed;top:12px;left:12px;z-index:9999;border-radius:14px;padding:10px 12px;font:600 14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25)}
    #selfpb-lite .row{display:flex;align-items:center;gap:8px}
    #selfpb-lite .btn{padding:6px 10px;border-radius:8px;border:0;background:#2d6cdf;color:#fff;cursor:pointer;transition:background 0.15s, transform 0.1s;}
    #selfpb-lite .btn:hover{filter:brightness(1.1);}
    #selfpb-lite .btn:active{transform:scale(0.96);}
    #selfpb-lite .btn[disabled]{opacity:.5;cursor:not-allowed}
    #selfpb-lite .pill{border-radius:999px;padding:6px 10px}
    #selfpb-lite .meta{opacity:.85}
    #selfpb-lite input[type="range"]{accent-color:#2d6cdf}
    #selfpb-lite .ab{display:flex;gap:6px;position:relative;} 
    #selfpb-lite .tiny{font-weight:700;opacity:.8}
    
    /* Layout Fixes */
    #selfpb-lite .scrub{flex:1;min-width:150px} 
    #selfpb-lite .spacer{flex:1}
    #spb-main { width: 110px; font-weight: 800; font-size: 1.05em; flex-shrink: 0; }
    #spb-loop-action { min-width: 100px; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    #spb-loop-action.active { background: #4338ca; color: #fff; border-color: #312e81; }

    /* Floating "Coach Mark" Bubble */
    .spb-bubble {
        position: absolute; top: -38px; left: 0;
        background: rgba(0,0,0,0.85); color: #fff;
        padding: 4px 8px; border-radius: 6px; font-size: 11px;
        white-space: nowrap; pointer-events: none;
        opacity: 0; transition: opacity 0.4s;
    }
    .spb-bubble.visible { opacity: 1; }
    .spb-bubble::after {
        content: ''; position: absolute; bottom: -4px; left: 16px;
        border-left: 4px solid transparent; border-right: 4px solid transparent;
        border-top: 4px solid rgba(0,0,0,0.85);
    }
  `,document.head.appendChild(t)}function T(){const e=document.createElement("div");return e.id="selfpb-lite",e.innerHTML=`
    <div class="row" style="margin-bottom:6px; position:relative;">
      <span id="spb-toast" class="pill tiny" style="display:none; position:absolute; right:0; top:0; background:#ef4444; border-color:#b91c1c; color:#fff; z-index:10; box-shadow: 0 2px 10px rgba(0,0,0,0.5);"></span>
      <div class="spacer"></div> 
      <span class="pill tiny" id="spb-ref">Ref: —</span>
      <span class="pill tiny" id="spb-time">0:00 / 0:00</span>
    </div>

    <div id="spb-waveform-container" style="margin-bottom: 6px; padding: 4px 0;">
       <div id="spb-wave-learner" style="height: 50px; width: 100%;"></div>
       <div id="spb-wave-ref" style="height: 50px; width: 100%; border-top: 1px solid #eee;"></div>
    </div>

    <div class="row" style="margin-bottom:6px">
      <button class="btn" id="spb-back">−2s</button>
      <input id="spb-scrub" class="scrub" type="range" min="0" max="1000" step="1" value="0" title="Seek">
      <button class="btn" id="spb-fwd">+2s</button>
    </div>

    <div class="row" style="margin-bottom:8px">
      <button class="btn" id="spb-main">▶ Play</button>
      <div class="pill" title="Playback speed" style="flex:1; display:flex; align-items:center; justify-content:center; padding: 6px 4px;">
        <span class="tiny" style="margin-right:4px">Speed</span>
        <input id="spb-rate" type="range" min="0.5" max="1.5" step="0.05" value="1" style="width:90px; margin:0 6px">
        <span class="tiny" id="spb-rate-val">1.00×</span>
      </div>
    </div>

    <div class="row">
      <div class="pill ab" style="flex:1;">
        <div id="spb-loop-tip" class="spb-bubble">Tap <b>A</b> then <b>B</b> to loop.</div>
        <button class="btn" id="spb-loop-action">⟳ Set Loop A</button>
        <span class="tiny" id="spb-ab-label" style="margin-left:12px; color:#666;">Loop: Off</span>
      </div>
    </div>
  `,document.body.appendChild(e),{host:e,toast:e.querySelector("#spb-toast"),mainBtn:e.querySelector("#spb-main"),backBtn:e.querySelector("#spb-back"),fwdBtn:e.querySelector("#spb-fwd"),scrub:e.querySelector("#spb-scrub"),rate:e.querySelector("#spb-rate"),rateVal:e.querySelector("#spb-rate-val"),timeLab:e.querySelector("#spb-time"),loopAction:e.querySelector("#spb-loop-action"),loopTip:e.querySelector("#spb-loop-tip"),abLabel:e.querySelector("#spb-ab-label"),refLabel:e.querySelector("#spb-ref"),waveLearner:e.querySelector("#spb-wave-learner"),waveRef:e.querySelector("#spb-wave-ref")}}function C(){const{api:e,audio:t,refAudio:s,st:a}=B();A();const n=T();h({learnerContainer:n.waveLearner,refContainer:n.waveRef,masterAudio:t});const d=(i,p=2e3)=>{n.toast.textContent=i,n.toast.style.display="inline-block",n.host.animate([{transform:"translateX(0)"},{transform:"translateX(-4px)"},{transform:"translateX(4px)"},{transform:"translateX(0)"}],{duration:200}),setTimeout(()=>{n.toast.style.display="none"},p)},u=()=>{localStorage.getItem("spb-hint-seen")!=="true"&&(n.loopTip.classList.add("visible"),setTimeout(()=>{n.loopTip.classList.remove("visible"),localStorage.setItem("spb-hint-seen","true")},4e3))},o=()=>{n.mainBtn.textContent=a.playing?"⏸ Pause":"▶ Play",a.a==null?(n.loopAction.textContent="⟳ Set Loop A",n.loopAction.classList.remove("active"),n.abLabel.textContent="Loop: Off"):a.b==null?(n.loopAction.textContent="⟳ Set Loop B",n.loopAction.classList.add("active"),n.abLabel.textContent=`A: ${e.fmt(a.a)} …`):(n.loopAction.textContent="× Clear Loop",n.loopAction.classList.remove("active"),n.abLabel.textContent=`A: ${e.fmt(a.a)}  B: ${e.fmt(a.b)}`)},l=()=>{n.timeLab.textContent=`${e.fmt(t.currentTime||0)} / ${e.fmt(t.duration||0)}`},r=()=>{if(!a.scrubbing){const i=t.duration||0,p=i?Math.floor(t.currentTime/i*1e3):0;n.scrub.value=String(e.clamp(p,0,1e3))}},c=()=>{n.rateVal.textContent=`${Number(t.playbackRate).toFixed(2)}×`,n.rate.value=String(t.playbackRate||1)},y=()=>{const i=!!s.src,p=s.playbackRate||1,L=isFinite(s.duration)?e.fmt(s.duration):"—:—",f=e.getRefMeta(),S=f&&(f.voice||f.style)?` ${f.voice||""}`:"";n.refLabel.textContent=i?`Ref: ${p.toFixed(2)}× · ${L}${S}`:"Ref: —"},g=async(i=!1)=>{if(!t.currentSrc&&!t.src){d("No recording yet!");return}if(t.duration===0||isNaN(t.duration)){d("Audio empty/loading...");return}try{i?(t.currentTime=a.looping&&a.a!=null?a.a:0,a.playing||await e.play()):a.playing?e.pause():(a.looping&&a.a!=null&&a.b!=null&&a.b>a.a&&(t.currentTime<a.a||t.currentTime>a.b)&&(t.currentTime=a.a),await e.play())}catch(p){console.warn("[selfpb] Play failed",p),d("Playback failed")}finally{o()}},v=()=>{if(!t.duration){d("No audio to loop!");return}if(a.a==null)a.a=t.currentTime||0,a.looping=!1,u();else if(a.b==null){if(a.b=t.currentTime||0,a.b<a.a){const i=a.a;a.a=a.b,a.b=i}a.looping=!0,t.currentTime=a.a,a.playing||e.play()}else e.clearAB();o()};n.mainBtn.addEventListener("click",i=>{i.detail!==2&&g(!1)}),n.mainBtn.addEventListener("dblclick",i=>{i.preventDefault(),g(!0)}),n.backBtn.addEventListener("click",()=>{t.currentTime=e.clamp((t.currentTime||0)-2,0,t.duration||0),l(),r()}),n.fwdBtn.addEventListener("click",()=>{t.currentTime=e.clamp((t.currentTime||0)+2,0,t.duration||0),l(),r()}),n.scrub.addEventListener("input",()=>{e._setScrubbingOn();const i=Number(n.scrub.value)/1e3;t.currentTime=e.clamp(i*(t.duration||0),0,t.duration||0),l()}),n.scrub.addEventListener("change",()=>e._setScrubbingOff()),n.rate.addEventListener("input",()=>{const i=e.clamp(Number(n.rate.value)||1,.5,1.5);e.setRate(i),c()}),n.loopAction.addEventListener("click",v),t.addEventListener("timeupdate",()=>{l(),r()}),t.addEventListener("play",()=>{a.playing=!0,o()}),t.addEventListener("pause",()=>{a.playing=!1,o()}),t.addEventListener("loadedmetadata",()=>{l(),r()}),t.addEventListener("ratechange",c),t.addEventListener("ended",()=>{a.playing=!1,o()}),s.addEventListener("loadedmetadata",y),s.addEventListener("ratechange",y),window.addEventListener("keydown",i=>{i.target.tagName==="INPUT"||i.target.tagName==="TEXTAREA"||i.target.isContentEditable||(i.code==="Space"?(i.preventDefault(),n.mainBtn.click()):i.key===","?(i.preventDefault(),n.backBtn.click()):i.key==="."?(i.preventDefault(),n.fwdBtn.click()):i.key==="["?(i.preventDefault(),e.setRate(e.clamp((t.playbackRate||1)-.05,.5,1.5)),c()):i.key==="]"?(i.preventDefault(),e.setRate(e.clamp((t.playbackRate||1)+.05,.5,1.5)),c()):i.key.toLowerCase()==="l"&&(i.preventDefault(),n.loopAction.click()))},{passive:!1}),w(),window.LuxSelfPB=Object.assign(window.LuxSelfPB||{},{el:n.host}),console.info("[self-pb] WaveSurfer UI Mounted");function w(){l(),r(),o(),y()}}export{C as default,C as mountSelfPlaybackLite};
//# sourceMappingURL=ui-BVfpdDiM.js.map
